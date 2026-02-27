/* ============================
   PENSIUNEA ALEXANDRA — Calendar
   Availability calendar with room selection
   ============================ */

const ROOM_TYPES = [
    { id: 'dubla-clasic', name: 'Camera Dublă Clasic', price: 250 },
    { id: 'twin', name: 'Camera Twin', price: 230 },
    { id: 'familie', name: 'Camera Familie', price: 350 },
    { id: 'apt-predeal', name: 'Apartament Predeal', price: 480 },
    { id: 'apt-panoramic', name: 'Apartament Panoramic', price: 600 }
];

const MONTHS_RO = ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
    'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'];
const DAYS_RO = ['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du'];

class AvailabilityCalendar {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.currentDate = new Date();
        this.currentMonth = this.currentDate.getMonth();
        this.currentYear = this.currentDate.getFullYear();
        this.selectedRoom = options.selectedRoom || 'dubla-clasic';
        this.selectedCheckin = null;
        this.selectedCheckout = null;
        this.availability = {};
        this.onDateSelect = options.onDateSelect || null;
        this.isAdmin = options.isAdmin || false;

        this.loadAvailability();
        this.render();
    }

    loadAvailability() {
        const stored = localStorage.getItem('pensiunea_availability');
        if (stored) {
            try {
                this.availability = JSON.parse(stored);
            } catch (e) {
                this.availability = {};
            }
        }
    }

    saveAvailability() {
        localStorage.setItem('pensiunea_availability', JSON.stringify(this.availability));
    }

    isOccupied(dateStr) {
        const roomData = this.availability[this.selectedRoom];
        if (!roomData) return false;
        return roomData[dateStr] === 'occupied';
    }

    toggleOccupied(dateStr) {
        if (!this.availability[this.selectedRoom]) {
            this.availability[this.selectedRoom] = {};
        }

        if (this.availability[this.selectedRoom][dateStr] === 'occupied') {
            delete this.availability[this.selectedRoom][dateStr];
        } else {
            this.availability[this.selectedRoom][dateStr] = 'occupied';
        }

        this.saveAvailability();
        this.render();
    }

    formatDate(year, month, day) {
        return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    }

    getFirstDayOfMonth(year, month) {
        const day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1; // Monday = 0
    }

    prevMonth() {
        this.currentMonth--;
        if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        }
        this.render();
    }

    nextMonth() {
        this.currentMonth++;
        if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        }
        this.render();
    }

    selectRoom(roomId) {
        this.selectedRoom = roomId;
        this.render();

        // Update room selector buttons
        document.querySelectorAll('.room-selector__btn, .admin-room-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.room === roomId);
        });
    }

    handleDayClick(dateStr) {
        if (this.isAdmin) {
            this.toggleOccupied(dateStr);
            return;
        }

        if (this.isOccupied(dateStr)) return;

        const clickedDate = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (clickedDate < today) return;

        if (!this.selectedCheckin || (this.selectedCheckin && this.selectedCheckout)) {
            this.selectedCheckin = dateStr;
            this.selectedCheckout = null;
        } else if (dateStr > this.selectedCheckin) {
            // Check if any occupied dates in range
            const start = new Date(this.selectedCheckin);
            const end = new Date(dateStr);
            let hasOccupied = false;

            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const ds = this.formatDate(d.getFullYear(), d.getMonth(), d.getDate());
                if (this.isOccupied(ds)) {
                    hasOccupied = true;
                    break;
                }
            }

            if (!hasOccupied) {
                this.selectedCheckout = dateStr;
            } else {
                this.selectedCheckin = dateStr;
                this.selectedCheckout = null;
            }
        } else {
            this.selectedCheckin = dateStr;
            this.selectedCheckout = null;
        }

        this.render();

        if (this.onDateSelect) {
            this.onDateSelect(this.selectedCheckin, this.selectedCheckout);
        }
    }

    isInRange(dateStr) {
        if (!this.selectedCheckin || !this.selectedCheckout) return false;
        return dateStr >= this.selectedCheckin && dateStr <= this.selectedCheckout;
    }

    render() {
        const daysInMonth = this.getDaysInMonth(this.currentYear, this.currentMonth);
        const firstDay = this.getFirstDayOfMonth(this.currentYear, this.currentMonth);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = this.formatDate(today.getFullYear(), today.getMonth(), today.getDate());

        let html = `
      <div class="calendar">
        <div class="calendar__header">
          <button class="calendar__nav-btn" onclick="window.calendar.prevMonth()" aria-label="Luna anterioară">‹</button>
          <span class="calendar__month">${MONTHS_RO[this.currentMonth]} ${this.currentYear}</span>
          <button class="calendar__nav-btn" onclick="window.calendar.nextMonth()" aria-label="Luna următoare">›</button>
        </div>
        <div class="calendar__weekdays">
          ${DAYS_RO.map(d => `<span class="calendar__weekday">${d}</span>`).join('')}
        </div>
        <div class="calendar__days">
    `;

        // Empty cells before first day
        for (let i = 0; i < firstDay; i++) {
            html += `<span class="calendar__day calendar__day--empty"></span>`;
        }

        // Day cells
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = this.formatDate(this.currentYear, this.currentMonth, day);
            const date = new Date(this.currentYear, this.currentMonth, day);
            const isPast = date < today;
            const isToday = dateStr === todayStr;
            const isOccupied = this.isOccupied(dateStr);
            const isSelected = dateStr === this.selectedCheckin || dateStr === this.selectedCheckout;
            const isInRange = this.isInRange(dateStr);

            let classes = 'calendar__day';
            if (isPast && !this.isAdmin) classes += ' calendar__day--disabled';
            else if (isOccupied) classes += ' calendar__day--occupied';
            else classes += ' calendar__day--available';

            if (isToday) classes += ' calendar__day--today';
            if (isSelected) classes += ' calendar__day--selected';
            if (isInRange && !isSelected) classes += ' calendar__day--in-range';
            if (this.isAdmin && isOccupied) classes += ' admin-calendar__day--toggle-occupied';

            const clickable = this.isAdmin || (!isPast);
            html += `<span class="${classes}" ${clickable ? `onclick="window.calendar.handleDayClick('${dateStr}')"` : ''}>${day}</span>`;
        }

        html += `
        </div>
        <div class="calendar__legend">
          <span class="calendar__legend-item">
            <span class="calendar__legend-dot calendar__legend-dot--available"></span>
            Disponibil
          </span>
          <span class="calendar__legend-item">
            <span class="calendar__legend-dot calendar__legend-dot--occupied"></span>
            Ocupat
          </span>
        </div>
      </div>
    `;

        this.container.innerHTML = html;
    }
}

// Calendar instance managed by each page
