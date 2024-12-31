require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

let queues = [];
let holidays = [];

const cors = require('cors');
app.use(cors());

const TABLE_LIMITS = {
    'Big': 7,
    'Small': 14
};

const RESTAURANT_HOURS = {
    open: '10:00',
    close: '22:00'
};

function isHoliday(date) {
    return holidays.includes(date);
}

function isWithinBusinessHours(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const bookingTime = hours * 60 + minutes;
    
    const [openHours, openMinutes] = RESTAURANT_HOURS.open.split(':').map(Number);
    const [closeHours, closeMinutes] = RESTAURANT_HOURS.close.split(':').map(Number);
    
    const openTime = openHours * 60 + openMinutes;
    const closeTime = closeHours * 60 + closeMinutes;
    
    return bookingTime >= openTime && bookingTime <= closeTime;
}

function getTableCount(date, tableType) {
    return queues.filter(q => q.date === date && q.table === tableType).length;
}

function formatQueueInfo(queue) {
    return `
👤 Name: ${queue.name}
💬 Line: ${queue.lineId}
🪑 Table: ${queue.table}
📅 Date: ${queue.date}
🧭 Time: ${queue.time}
📕 Queue: ${queue.queueNumber}


`;
}

function getGroupedQueues() {
    const sortedQueues = [...queues].sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare === 0) {
            return a.time.localeCompare(b.time);
        }
        return dateCompare;
    });

    const groupedQueues = sortedQueues.reduce((groups, queue) => {
        if (!groups[queue.date]) {
            groups[queue.date] = [];
        }
        groups[queue.date].push(queue);
        return groups;
    }, {});

    let output = '';
    for (const [date, dateQueues] of Object.entries(groupedQueues)) {
        output += `Date ${date}\n\n`;
        dateQueues.forEach(queue => {
            output += formatQueueInfo(queue);
        });
    }

    return output || 'No queues available.';
}

app.post('/api/book', async (req, res) => {
    const { name, lineId, table, date, time } = req.body;

    if (isHoliday(date)) {
        return res.status(400).json({
            message: 'Sorry, the restaurant is closed on this date'
        });
    }

    if (!isWithinBusinessHours(time)) {
        return res.status(400).json({
            message: 'Booking time must be between 10:00 and 22:00'
        });
    }

    const tableCount = getTableCount(date, table);
    if (tableCount >= TABLE_LIMITS[table]) {
        return res.status(400).json({
            message: `Sorry, all ${table} tables are booked for this date`
        });
    }

    const queueNumber = `Q${Math.floor(1000 + Math.random() * 9000)}`;
    const newQueue = { name, lineId, table, date, time, queueNumber };
    queues.push(newQueue);

    try {
        await axios.post('https://api.line.me/v2/bot/message/push', {
            to: process.env.LINE_ADMIN_ID,
            messages: [{ 
                type: 'text', 
                text: `There is a new reservation.\n\n${formatQueueInfo(newQueue)}` 
            }]
        }, {
            headers: { Authorization: `Bearer ${process.env.LINE_ACCESS_TOKEN}` }
        });
        res.json({ message: 'Booking successful!', queueNumber });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to send message', error: err });
    }
});

app.get('/api/queues', (req, res) => {
    res.json(queues);
});

app.delete('/api/queues/:queueNumber', (req, res) => {
    const queueNumber = req.params.queueNumber;
    queues = queues.filter(q => q.queueNumber !== queueNumber);
    res.json({ message: `Queue ${queueNumber} removed` });
});

app.get('/api/holidays', (req, res) => {
    res.json(holidays);
});

app.post('/line-webhook', (req, res) => {
    const { events } = req.body;
    events.forEach(event => {
        const message = event.message.text;

        if (message.toLowerCase() === 'q') {
            const queueList = getGroupedQueues();
            replyMessage(event.replyToken, queueList);
        } else if (message.toLowerCase() === 'qc') {
            const holidayList = holidays.length > 0 ? 
                `Restaurant holidays:\n${holidays.join('\n')}` : 
                'No holidays scheduled';
            replyMessage(event.replyToken, holidayList);
        } else if (message.startsWith('c ')) {
            const date = message.split(' ')[1];
            if (date && /^\d{4}\/\d{2}\/\d{2}$/.test(date)) {
                if (!holidays.includes(date)) {
                    holidays.push(date);
                    holidays.sort();
                    replyMessage(event.replyToken, `Added holiday: ${date}`);
                } else {
                    replyMessage(event.replyToken, 'This date is already marked as a holiday');
                }
            } else {
                replyMessage(event.replyToken, 'Invalid date format. Please use YYYY/MM/DD');
            }
        } else if (message.startsWith('d')) {
            const queueNumber = message.split(' ')[1];
            queues = queues.filter(q => q.queueNumber !== queueNumber);
            replyMessage(event.replyToken, `Queue ${queueNumber} has been managed.`);
        }
    });
    res.sendStatus(200);
});

function replyMessage(replyToken, text) {
    axios.post('https://api.line.me/v2/bot/message/reply', {
        replyToken,
        messages: [{ type: 'text', text }],
    }, {
        headers: { Authorization: `Bearer ${process.env.LINE_ACCESS_TOKEN}` }
    });
}

app.get('/health', (req, res) => {
  res.send('OK');
});

// function ping ตัวเอง
function keepAlive() {
  // แก้ URL นี้เป็น URL ของ app คุณบน render
  const url = "https://poseidon-seafood.onrender.com/health";  
  
  https.get(url, (res) => {
    console.log('Ping successful at:', new Date().toISOString());
  }).on('error', (err) => {
    console.log('Ping failed:', err);
  });
}

// เริ่ม ping ทุก 14 นาที
setInterval(keepAlive, 5 * 60 * 1000);

// ส่วนอื่นๆ ของ app คุณ...

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});