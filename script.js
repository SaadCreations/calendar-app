document.addEventListener('DOMContentLoaded', function() {
    // Calendar elements
    const calendarDays = document.getElementById('calendar-days');
    const monthDisplay = document.getElementById('month-display');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const addEventBtn = document.getElementById('add-event-btn');
    const modal = document.getElementById('event-modal');
    const closeModalBtn = document.querySelector('.close');
    const eventForm = document.getElementById('event-form');
    const eventsList = document.getElementById('events-list');
    
    // Current date
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    
    // Events storage
    let events = JSON.parse(localStorage.getItem('calendarEvents')) || [];
    
    // Initialize calendar
    function initCalendar() {
        renderCalendar();
        renderEvents();
        
        // Event listeners
        prevMonthBtn.addEventListener('click', () => {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            renderCalendar();
        });
        
        nextMonthBtn.addEventListener('click', () => {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            renderCalendar();
        });
        
        addEventBtn.addEventListener('click', () => {
            document.getElementById('event-date').valueAsDate = new Date();
            modal.style.display = 'block';
        });
        
        closeModalBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        eventForm.addEventListener('submit', (e) => {
            e.preventDefault();
            addEvent();
        });
    }
    
    // Render calendar
    function renderCalendar() {
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        monthDisplay.textContent = `${firstDay.toLocaleString('default', { month: 'long' })} ${currentYear}`;
        
        calendarDays.innerHTML = '';
        
        // Previous month's days
        const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('day', 'other-month');
            dayElement.textContent = prevMonthLastDay - i;
            calendarDays.appendChild(dayElement);
        }
        
        // Current month's days
        const today = new Date();
        for (let i = 1; i <= daysInMonth; i++) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('day');
            dayElement.textContent = i;
            
            // Check if it's today
            if (currentYear === today.getFullYear() && 
                currentMonth === today.getMonth() && 
                i === today.getDate()) {
                dayElement.classList.add('today');
            }
            
            // Check for events on this day
            const dayEvents = events.filter(event => {
                const eventDate = new Date(event.date);
                return eventDate.getDate() === i && 
                       eventDate.getMonth() === currentMonth && 
                       eventDate.getFullYear() === currentYear;
            });
            
            if (dayEvents.length > 0) {
                const eventCount = document.createElement('span');
                eventCount.classList.add('event-count');
                eventCount.textContent = dayEvents.length;
                dayElement.appendChild(eventCount);
            }
            
            // Add click event to open modal with date pre-filled
            dayElement.addEventListener('click', () => {
                const selectedDate = new Date(currentYear, currentMonth, i);
                document.getElementById('event-date').valueAsDate = selectedDate;
                modal.style.display = 'block';
            });
            
            calendarDays.appendChild(dayElement);
        }
        
        // Next month's days
        const totalDaysDisplayed = startingDayOfWeek + daysInMonth;
        const remainingCells = 7 - (totalDaysDisplayed % 7);
        if (remainingCells < 7) {
            for (let i = 1; i <= remainingCells; i++) {
                const dayElement = document.createElement('div');
                dayElement.classList.add('day', 'other-month');
                dayElement.textContent = i;
                calendarDays.appendChild(dayElement);
            }
        }
    }
    
    // Add new event
    function addEvent() {
        const title = document.getElementById('event-title').value;
        const date = document.getElementById('event-date').value;
        const time = document.getElementById('event-time').value;
        const description = document.getElementById('event-description').value;
        
        if (!title || !date) {
            alert('Please enter at least a title and date for the event.');
            return;
        }
        
        const newEvent = {
            id: Date.now(), // Unique ID using timestamp
            title,
            date,
            time,
            description
        };
        
        events.push(newEvent);
        saveEvents();
        renderCalendar();
        renderEvents();
        
        // Reset form and close modal
        eventForm.reset();
        modal.style.display = 'none';
    }
    
    // Render events list
    function renderEvents() {
        eventsList.innerHTML = '';
        
        // Sort events by date
        const sortedEvents = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Filter for upcoming events
        const upcomingEvents = sortedEvents.filter(event => new Date(event.date) >= new Date().setHours(0, 0, 0, 0));
        
        if (upcomingEvents.length === 0) {
            eventsList.innerHTML = '<p>No upcoming events.</p>';
            return;
        }
        
        upcomingEvents.forEach(event => {
            const eventDate = new Date(event.date);
            const formattedDate = eventDate.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
            });
            
            const eventElement = document.createElement('div');
            eventElement.classList.add('event-item');
            eventElement.innerHTML = `
                <h4>${event.title}</h4>
                <p><strong>Date:</strong> ${formattedDate}</p>
                ${event.time ? `<p><strong>Time:</strong> ${event.time}</p>` : ''}
                ${event.description ? `<p><strong>Description:</strong> ${event.description}</p>` : ''}
                <div class="event-actions">
                    <button class="delete-btn" data-id="${event.id}">Delete</button>
                </div>
            `;
            
            eventsList.appendChild(eventElement);
        });
        
        // Add event listeners for delete buttons
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const eventId = parseInt(e.target.getAttribute('data-id'));
                deleteEvent(eventId);
            });
        });
    }
    
    // Delete event
    function deleteEvent(eventId) {
        if (confirm('Are you sure you want to delete this event?')) {
            events = events.filter(event => event.id !== eventId);
            saveEvents();
            renderCalendar();
            renderEvents();
        }
    }
    
    // Save events to localStorage
    function saveEvents() {
        localStorage.setItem('calendarEvents', JSON.stringify(events));
    }
    
    // Initialize the calendar
    initCalendar();
});