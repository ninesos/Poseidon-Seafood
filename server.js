require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

let queues = [];

const cors = require('cors');
app.use(cors());

const TABLE_LIMITS = {
    'Big': 8,
    'Small': 2
};

const RESTAURANT_HOURS = {
    open: '10:00',
    close: '22:00'
};

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

app.post('/line-webhook', (req, res) => {
    const { events } = req.body;
    events.forEach(event => {
        const message = event.message.text;

        if (message.toLowerCase() === 'q') {
            const queueList = getGroupedQueues();
            replyMessage(event.replyToken, queueList);
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

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));