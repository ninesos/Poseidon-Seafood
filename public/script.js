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
    const dateInput = document.getElementById('date');
    const timeInput = document.getElementById('time');
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
    timeInput.step = "300"; //5 min
    timeInput.addEventListener('input', function() {
        if (this.value) {
            if (isValidTime(this.value)) {
                this.classList.remove('invalid-time');
            } else {
                this.classList.add('invalid-time');
            }
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
    // Get all sections that have an ID defined
    const sections = document.querySelectorAll("section[id]");
    
    // Add an event listener listening for scroll
    window.addEventListener("scroll", navHighlighter);
    
    function navHighlighter() {
        // Get current scroll position
        let scrollY = window.pageYOffset;
        
        // Now we loop through sections to get height, top and ID values for each
        sections.forEach(current => {
            const sectionHeight = current.offsetHeight;
            const sectionTop = current.offsetTop - 100; // Adjust this value based on your navbar height
            const sectionId = current.getAttribute("id");
            
            // Check if we've scrolled to the section
            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                document.querySelector(".navbar-nav a[href*=" + sectionId + "]").classList.add("active-section");
            } else {
                document.querySelector(".navbar-nav a[href*=" + sectionId + "]").classList.remove("active-section");
            }
        });
    }
    
    // Call the function on load
    navHighlighter();
});