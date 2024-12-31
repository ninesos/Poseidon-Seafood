document.head.insertAdjacentHTML('beforeend', `
<style>
.table-option {
    cursor: pointer;
    transition: all 0.3s ease;
    border: 2px solid #ddd;
}

.table-option:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.table-option.selected {
    border-color: #0d6efd;
    background-color: #f8f9ff;
}

.table-option .card-body {
    padding: 1.5rem;
}

.table-option ul li {
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
}

.table-field-button {
    cursor: pointer;
    background-color: white;
    border: 1px solid #ced4da;
    border-radius: 0.25rem;
    padding: 0.375rem 0.75rem;
    width: 100%;
    text-align: left;
    position: relative;
}

.table-field-button::after {
    content: '▼';
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
}

.table-field-button:hover {
    background-color: #f8f9fa;
}
</style>
`);

let holidays = [];

// Function to round time to nearest 5 minutes
function roundToNearestFiveMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    const roundedMinutes = Math.round(totalMinutes / 5) * 5;
    
    const newHours = Math.floor(roundedMinutes / 60);
    const newMinutes = roundedMinutes % 60;
    
    return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
}

// Time validation function
function isValidTime(time) {
    if (!time) return false;
    
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    const openTime = 10 * 60;  // 10:00 AM
    const closeTime = 22 * 60; // 10:00 PM
    
    // Check if time is within business hours
    if (totalMinutes < openTime || totalMinutes > closeTime) {
        showModal('Please select a time between 10:00 AM and 10:00 PM.', 'error');
        return false;
    }
    
    // Check if minutes are in 5-minute intervals
    if (minutes % 5 !== 0) {
        showModal('Please select a time in 5-minute intervals.', 'error');
        return false;
    }
    
    return true;
}

function isValidAdvanceBooking(dateStr, timeStr) {
    const now = new Date();
    const bookingDate = new Date(dateStr);
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    bookingDate.setHours(hours, minutes, 0, 0);
    
    // Calculate time difference in milliseconds
    const timeDiff = bookingDate.getTime() - now.getTime();
    
    // Convert to hours (1000ms * 60s * 60m = 3600000ms in 1 hour)
    const hoursDiff = timeDiff / 3600000;
    
    return hoursDiff >= 2;
}

// Modal display function
function showModal(message, type) {
    const modalEl = document.getElementById('bookingModal');
    const messageEl = document.getElementById('modalMessage');
    const modalHeader = modalEl.querySelector('.modal-header');
    const modalContent = modalEl.querySelector('.modal-content');
    const submitButton = document.querySelector('button[type="submit"]');
    
    modalContent.classList.remove('border-success', 'border-danger');
    modalHeader.classList.remove('bg-success', 'bg-danger', 'text-white');
    
    if (type === 'success') {
        modalContent.classList.add('border-success');
        modalHeader.classList.add('bg-success', 'text-white');
        const queueNumber = message.match(/Q\d+/)[0];
        messageEl.innerHTML = `
            <div class="text-center">
                <p>✔️ Successfully booked! ✔️ <br> Your queue is</p>
                <div class="queue-number my-4">${queueNumber}</div>
                <br>
                <button class="btn btn-outline-primary copy-btn" data-queue="${queueNumber}">
                    <i class="fas fa-copy me-2"></i>Copy
                </button>
            </div>
        `;
        const copyBtn = messageEl.querySelector('.copy-btn');
        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(queueNumber);
                copyBtn.innerHTML = '<i class="fas fa-check me-2"></i>Copied!';
                setTimeout(() => {
                    copyBtn.innerHTML = '<i class="fas fa-copy me-2"></i>Copy';
                }, 2000);
            } catch (err) {
                console.error('Failed to copy:', err);
            }
        });
    } else if (type === 'error') {
        modalContent.classList.add('border-danger');
        modalHeader.classList.add('bg-danger', 'text-white');
        messageEl.textContent = message;
    }
    
    const modal = new bootstrap.Modal(modalEl);
    
    modalEl.addEventListener('hidden.bs.modal', function () {
        submitButton.disabled = false;
        submitButton.innerHTML = 'Submit';
    }, { once: true });
    
    modal.show();
}

// Initialize form functionality
document.addEventListener('DOMContentLoaded', async function() {
    try {
        const response = await fetch('/api/holidays');
        holidays = await response.json();
    } catch (error) {
        console.error('Error fetching holidays:', error);
    }
    const tableSelect = document.getElementById('table');
    const tableSelectParent = tableSelect.parentElement;
    const sections = document.querySelectorAll("section[id]");
    
    window.addEventListener("scroll", navHighlighter);
    
    function navHighlighter() {
        let scrollY = window.pageYOffset;
        
        sections.forEach(current => {
            const sectionHeight = current.offsetHeight;
            const sectionTop = current.offsetTop - 100;
            const sectionId = current.getAttribute("id");
            
            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                document.querySelector(".navbar-nav a[href*=" + sectionId + "]").classList.add("active-section");
            } else {
                document.querySelector(".navbar-nav a[href*=" + sectionId + "]").classList.remove("active-section");
            }
        });
    }
    
    navHighlighter();
    
    // Hide the original select element
    tableSelect.style.cssText = 'display: none !important; position: absolute; opacity: 0;';
    
    // Create table select button
    let tableButton = document.getElementById('tableSelectButton');
    if (!tableButton) {
        tableButton = document.createElement('button');
        tableButton.type = 'button';
        tableButton.className = 'table-field-button';
        tableButton.id = 'tableSelectButton';
        tableButton.textContent = 'Select a table';
        tableSelectParent.appendChild(tableButton);
    }
    
    // Initialize table selection modal
    const tableSelectionModal = new bootstrap.Modal(document.getElementById('tableSelectionModal'));
    
    // Add click event to button
    tableButton.addEventListener('click', function() {
        tableSelectionModal.show();
    });
    
    // Handle table option selection
    document.querySelectorAll('.table-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.table-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            
            this.classList.add('selected');
            
            const tableType = this.dataset.tableType;
            tableSelect.value = tableType;
            tableButton.textContent = `${tableType} Table`;
            
            tableSelectionModal.hide();
            
            tableButton.style.border = '';
            tableSelect.classList.remove('is-invalid');
        });
    });

    // Initialize form inputs
    const dateInput = document.getElementById('date');
    const timeInput = document.getElementById('time');
    const nameInput = document.getElementById('name');
    const lineIdInput = document.getElementById('lineId');
    
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;

    // Add input event listeners
    const inputs = [nameInput, lineIdInput, dateInput, timeInput];
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            if (this.value.trim() !== '') {
                this.style.border = '';
                this.classList.remove('is-invalid');
            }
        });
    });
});

document.getElementById('table').addEventListener('change', function () {
    const tableSelectButton = document.getElementById('tableSelectButton');
    tableSelectButton.style.border = ''; // รีเซ็ตกรอบสีแดง
});

function isHoliday(date) {
    // Convert date to yyyy/mm/dd format
    const formattedDate = date.split('-').join('/');
    return holidays.includes(formattedDate);
}

// Form submission handler
document.getElementById('bookingForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const submitButton = this.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';

    const fields = {
        name: document.getElementById('name'),
        lineId: document.getElementById('lineId'),
        table: document.getElementById('table'),
        date: document.getElementById('date'),
        time: document.getElementById('time')
    };

    // Reset field styles
    Object.values(fields).forEach(field => {
        field.style.border = '';
        field.classList.remove('is-invalid');
    });

    // Check for empty fields
    const emptyFields = [];
    Object.entries(fields).forEach(([key, field]) => {
        if (!field.value.trim()) {
            emptyFields.push(key);
            if (key === 'table') {
                document.getElementById('tableSelectButton').style.border = '2px solid #dc3545';
            } else {
                field.style.border = '1px solid #dc3545';
                field.classList.add('is-invalid');
            }
        }
    });

    // Time validation functions
    function isWithinBusinessHours(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const bookingTime = hours * 60 + minutes;
        
        const [openHours, openMinutes] = ['10', '00'].map(Number);
        const [closeHours, closeMinutes] = ['22', '00'].map(Number);
        
        const openTime = openHours * 60 + openMinutes;
        const closeTime = closeHours * 60 + closeMinutes;
        
        return bookingTime >= openTime && bookingTime <= closeTime;
    }

    function isValidTimeInterval(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return minutes % 5 === 0;
    }

    //validation checks
    if (fields.date.value && isHoliday(fields.date.value)) {
        showModal('Sorry, the restaurant is closed on this date.', 'error');
        fields.date.classList.add('is-invalid');
        submitButton.disabled = false;
        submitButton.innerHTML = 'Submit';
        return;
    }

    if (!fields.name.value) {
        showModal('Please select a "Name"', 'error');
        fields.name.classList.add('is-invalid');
        submitButton.disabled = false;
        submitButton.innerHTML = 'Submit';
        return;
    }

    if (!fields.lineId.value) {
        showModal('Please select a "Line ID"', 'error');
        fields.lineId.classList.add('is-invalid');
        submitButton.disabled = false;
        submitButton.innerHTML = 'Submit';
        return;
    }

    if (!fields.table.value) { // ตรวจสอบว่าไม่ได้เลือกโต๊ะ
        showModal('Please select a "Table Size"', 'error');
        const tableSelectButton = document.getElementById('tableSelectButton');
        tableSelectButton.style.border = '2px solid #dc3545'; // เปลี่ยนกรอบเป็นสีแดง
        submitButton.disabled = false;
        submitButton.innerHTML = 'Submit';
        return;
    }

    if (!fields.date.value) {
        showModal('Please select a "Date"', 'error');
        fields.date.classList.add('is-invalid');
        submitButton.disabled = false;
        submitButton.innerHTML = 'Submit';
        return;
    }

    if (!fields.time.value) {
        showModal('Please select a "Time"', 'error');
        fields.time.classList.add('is-invalid');
        submitButton.disabled = false;
        submitButton.innerHTML = 'Submit';
        return;
    }

    // Check business hours first
    if (!isWithinBusinessHours(fields.time.value)) {
        showModal('Please select a time between 10:00 AM and 10:00 PM.', 'error');
        fields.time.classList.add('is-invalid');
        submitButton.disabled = false;
        submitButton.innerHTML = 'Submit';
        return;
    }

    // Then check time intervals
    if (!isValidTimeInterval(fields.time.value)) {
        showModal('Please select a time in 5-minute intervals.', 'error');
        fields.time.classList.add('is-invalid');
        submitButton.disabled = false;
        submitButton.innerHTML = 'Submit';
        return;
    }

    // Check if booking is at least 2 hours in advance
    if (!isValidAdvanceBooking(fields.date.value, fields.time.value)) {
        showModal('You must make a reservation 2 hours in advance.', 'error');
        fields.time.classList.add('is-invalid');
        fields.date.classList.add('is-invalid');
        submitButton.disabled = false;
        submitButton.innerHTML = 'Submit';
        return;
    }

    // Submit form
    try {
        const response = await fetch('/api/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: fields.name.value,
                lineId: fields.lineId.value,
                table: fields.table.value,
                date: fields.date.value,
                time: fields.time.value
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            showModal(`✔️ Successfully, Your queue is ${data.queueNumber} ✔️`, 'success');
            e.target.reset();
            
            // Reset table selection modal and button
            document.getElementById('tableSelectButton').textContent = 'Select a table';
            document.querySelectorAll('.table-option').forEach(option => {
                option.classList.remove('selected');
            });
            
            Object.values(fields).forEach(field => {
                field.style.border = '';
                field.classList.remove('is-invalid');
            });
        } else {
            showModal(`❌ ${data.message} ❌`, 'error');
        }
    } catch (error) {
        showModal('❌ An error occurred in booking the queue. ❌', 'error');
        console.error('Booking error:', error);
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = 'Submit';
    }
});

document.getElementById('date').addEventListener('change', function() {
    if (this.value && isHoliday(this.value)) {
        showModal('Sorry, the restaurant is closed on this date.', 'error');
        this.classList.add('is-invalid');
    } else {
        this.classList.remove('is-invalid');
    }
});