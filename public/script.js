document.getElementById('bookingForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const lineId = document.getElementById('lineId').value;
    const table = document.getElementById('table').value;
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;

    if (!isValidTime(time)) {
        showModal('❌ Please select a time between 10:00 AM and 10:00 PM. ❌', 'error');
        return;
    }

    try {
        const response = await fetch('/api/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, lineId, table, date, time })
        });

        const data = await response.json();
        
        if (response.ok) {
            showModal(`✔️ Successfully, Your queue is ${data.queueNumber} ✔️`, 'success');
            e.target.reset();
        } else {
            showModal(`❌ ${data.message} ❌`, 'error');
        }
    } catch (error) {
        showModal('❌ An error occurred in booking the queue. ❌', 'error');
        console.error('Booking error:', error);
    }
});

function showModal(message, type) {
    const modalEl = document.getElementById('bookingModal');
    const messageEl = document.getElementById('modalMessage');
    const modalHeader = modalEl.querySelector('.modal-header');
    const modalContent = modalEl.querySelector('.modal-content');
    
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
    modal.show();
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    const form = document.getElementById('bookingForm');
    const timeInput = document.getElementById('time');
    const dateInput = document.getElementById('date');

    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;

    // Set time input step to 5 minutes (300 seconds)
    timeInput.step = "300";

    timeInput.addEventListener('input', function() {
        if (this.value && !isValidTime(this.value)) {
            this.classList.add('is-invalid');
        } else {
            this.classList.remove('is-invalid');
        }
    });

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Check if the form is valid
        if (!form.checkValidity()) {
            e.stopPropagation();
            form.classList.add('was-validated');
            
            // Show alert for incomplete form
            showModal('❌ Please fill in all required fields correctly ❌', 'error');
            return;
        }

        const name = document.getElementById('name').value;
        const lineId = document.getElementById('lineId').value;
        const table = document.getElementById('table').value;
        const date = dateInput.value;
        const time = timeInput.value;

        if (!isValidTime(time)) {
            showModal('❌ Please select a time between 10:00 AM and 10:00 PM ❌', 'error');
            return;
        }

        try {
            const response = await fetch('/api/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, lineId, table, date, time })
            });

            const data = await response.json();
            
            if (response.ok) {
                showModal(`✔️ Successfully booked! Your queue is ${data.queueNumber} ✔️`, 'success');
                form.reset();
                form.classList.remove('was-validated');
            } else {
                showModal(`❌ ${data.message} ❌`, 'error');
            }
        } catch (error) {
            showModal('❌ An error occurred in booking the queue ❌', 'error');
            console.error('Booking error:', error);
        }
    });
});

function isValidTime(time) {
    const [hours, minutes] = time.split(':').map(Number);
    const bookingTime = hours * 60 + minutes;
    const openTime = 10 * 60;  // 10:00
    const closeTime = 22 * 60; // 22:00
    
    return bookingTime >= openTime && bookingTime <= closeTime;
}

// Add this to script.js
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('bookingForm');
    const timeInput = document.getElementById('time');
    const dateInput = document.getElementById('date');
    const tableSelect = document.getElementById('table');

    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;

    // Set time input step to 5 minutes
    timeInput.step = "300";

    // Show modal function
    function showModal(message, type) {
        const modalEl = document.getElementById('bookingModal');
        const messageEl = document.getElementById('modalMessage');
        const modalHeader = modalEl.querySelector('.modal-header');
        const modalContent = modalEl.querySelector('.modal-content');
        
        modalContent.classList.remove('border-success', 'border-danger');
        modalHeader.classList.remove('bg-success', 'bg-danger', 'text-white');
        
        if (type === 'success') {
            modalContent.classList.add('border-success');
            modalHeader.classList.add('bg-success', 'text-white');
            const queueNumber = message.match(/Q\d+/)?.[0];
            if (queueNumber) {
                messageEl.innerHTML = `
                    <div class="text-center">
                        <p>✔️ Successfully booked! ✔️ <br> Your queue is</p>
                        <div class="queue-number my-4">${queueNumber}</div>
                        <button class="btn btn-outline-primary copy-btn" data-queue="${queueNumber}">
                            <i class="fas fa-copy me-2"></i>Copy
                        </button>
                    </div>
                `;
            } else {
                messageEl.textContent = message;
            }
        } else if (type === 'error') {
            modalContent.classList.add('border-danger');
            modalHeader.classList.add('bg-danger', 'text-white');
            messageEl.innerHTML = `<div class="text-center">❌ ${message} ❌</div>`;
        }
        
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    }

    // Time validation function
    function isValidTime(time) {
        const [hours, minutes] = time.split(':').map(Number);
        const bookingTime = hours * 60 + minutes;
        const openTime = 10 * 60;  // 10:00
        const closeTime = 22 * 60; // 22:00
        
        return bookingTime >= openTime && bookingTime <= closeTime;
    }

    // Time input validation
    timeInput.addEventListener('change', function() {
        if (this.value) {
            // Check if time is valid
            if (!isValidTime(this.value)) {
                showModal('Please select a time between 10:00 AM and 10:00 PM', 'error');
                this.value = ''; // Reset the time input
            }
            
            // Check if minutes are in 5-minute intervals
            const minutes = parseInt(this.value.split(':')[1]);
            if (minutes % 5 !== 0) {
                showModal('Please select time in 5-minute intervals', 'error');
                this.value = ''; // Reset the time input
            }
        }
    });

    // Table selection handling
    tableSelect.addEventListener('change', function() {
        const tableType = this.value;
        showModal(`You have selected a ${tableType} table`, 'success');
    });

    // Form submission handling
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Get all required inputs
        const requiredInputs = form.querySelectorAll('[required]');
        const emptyFields = [];

        // Check each required field
        requiredInputs.forEach(input => {
            if (!input.value) {
                input.classList.add('is-invalid');
                emptyFields.push(input.previousElementSibling.textContent);
            } else {
                input.classList.remove('is-invalid');
            }
        });

        // If there are empty fields, show error message
        if (emptyFields.length > 0) {
            showModal(`Please fill in the following fields: ${emptyFields.join(', ')}`, 'error');
            return;
        }

        // Validate time if all fields are filled
        const time = timeInput.value;
        if (!isValidTime(time)) {
            showModal('Please select a time between 10:00 AM and 10:00 PM', 'error');
            return;
        }

        // If all validations pass, proceed with form submission
        try {
            const response = await fetch('/api/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: document.getElementById('name').value,
                    lineId: document.getElementById('lineId').value,
                    table: tableSelect.value,
                    date: dateInput.value,
                    time: time
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                showModal(`✔️ Successfully booked! Your queue is ${data.queueNumber} ✔️`, 'success');
                form.reset();
                form.classList.remove('was-validated');
            } else {
                showModal(data.message, 'error');
            }
        } catch (error) {
            showModal('An error occurred in booking the queue', 'error');
            console.error('Booking error:', error);
        }
    });

    // Copy button functionality
    document.addEventListener('click', async function(e) {
        if (e.target.closest('.copy-btn')) {
            const queueNumber = e.target.closest('.copy-btn').dataset.queue;
            try {
                await navigator.clipboard.writeText(queueNumber);
                e.target.closest('.copy-btn').innerHTML = '<i class="fas fa-check me-2"></i>Copied!';
                setTimeout(() => {
                    e.target.closest('.copy-btn').innerHTML = '<i class="fas fa-copy me-2"></i>Copy';
                }, 2000);
            } catch (err) {
                console.error('Failed to copy:', err);
            }
        }
    });
});