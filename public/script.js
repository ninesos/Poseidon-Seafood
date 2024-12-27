document.head.insertAdjacentHTML('beforeend', `
<style>
.table-option {
    cursor: pointer;
    transition: all 0.3s ease;
    border: 2px solid transparent;
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
    const openTime = 10 * 60;  // 10:00
    const closeTime = 22 * 60; // 22:00
    
    // Check if time is within business hours
    if (totalMinutes < openTime || totalMinutes > closeTime) {
        return false;
    }
    
    // Check if minutes are in 5-minute intervals
    return minutes % 5 === 0;
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
document.addEventListener('DOMContentLoaded', function() {
    const tableSelect = document.getElementById('table');
    const tableSelectParent = tableSelect.parentElement;
    
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
    timeInput.step = "300"; // 5 min intervals

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

    // Time input validation
    timeInput.addEventListener('change', function() {
        if (this.value) {
            if (!isValidTime(this.value)) {
                const suggestedTime = roundToNearestFiveMinutes(this.value);
                showModal(`Please select a time in 5-minute intervals. The nearest available time would be ${suggestedTime}`, 'error');
                this.classList.add('invalid-time');
            } else {
                this.classList.remove('invalid-time');
            }
        }
    });
});

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
                field.style.border = '2px solid #dc3545';
                field.classList.add('is-invalid');
            }
        }
    });

    if (emptyFields.length > 0) {
        const fieldNames = emptyFields.map(field => {
            switch(field) {
                case 'name': return 'Name';
                case 'lineId': return 'Line ID';
                case 'table': return 'Table';
                case 'date': return 'Date';
                case 'time': return 'Time';
                default: return field;
            }
        });

        showModal(`Please fill in the following required fields: ${fieldNames.join(', ')}`, 'error');
        submitButton.disabled = false;
        submitButton.innerHTML = 'Submit';
        return;
    }

    // Time validation
    if (!fields.time.value) {
        showModal('Please select a time.', 'error');
        fields.time.classList.add('is-invalid');
        submitButton.disabled = false;
        submitButton.innerHTML = 'Submit';
        return;
    }

    if (!isValidTime(fields.time.value)) {
        const suggestedTime = roundToNearestFiveMinutes(fields.time.value);
        showModal(`Please select a time in 5-minute intervals. The nearest available time would be ${suggestedTime}`, 'error');
        fields.time.classList.add('is-invalid');
        submitButton.disabled = false;
        submitButton.innerHTML = 'Submit';
        return;
    }

    // Check if booking is at least 2 hours in advance
    if (!isValidAdvanceBooking(fields.date.value, fields.time.value)) {
        showModal('คุณต้องจองคิวล่วงหน้า 2 ชั่วโมง', 'error');
        fields.time.classList.add('invalid-time');
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
            document.getElementById('tableSelectButton').textContent = 'Select a table';
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