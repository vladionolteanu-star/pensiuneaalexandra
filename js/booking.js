/* ============================
   PENSIUNEA ALEXANDRA — Booking
   Form validation + WhatsApp integration
   ============================ */

const WHATSAPP_NUMBER = '40727333869';

document.addEventListener('DOMContentLoaded', () => {
    initBookingForm();
    initRoomSelector();
    restoreBookingDates();
});

function initBookingForm() {
    const form = document.getElementById('bookingForm');
    if (!form) return;

    // WhatsApp submit
    const whatsappBtn = document.getElementById('submitWhatsApp');
    if (whatsappBtn) {
        whatsappBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (validateForm()) sendWhatsApp();
        });
    }

    // Email submit
    const emailBtn = document.getElementById('submitEmail');
    if (emailBtn) {
        emailBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (validateForm()) sendEmail();
        });
    }

    // Price calculator
    const checkinInput = document.getElementById('checkin');
    const checkoutInput = document.getElementById('checkout');
    const roomInput = document.getElementById('roomType');

    [checkinInput, checkoutInput, roomInput].forEach(input => {
        if (input) input.addEventListener('change', updatePriceEstimate);
    });
}

function initRoomSelector() {
    const buttons = document.querySelectorAll('.room-selector__btn');
    const roomInput = document.getElementById('roomType');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            if (roomInput) {
                roomInput.value = btn.dataset.room;
                updatePriceEstimate();
            }

            if (typeof calendar !== 'undefined' && calendar) {
                calendar.selectRoom(btn.dataset.room);
            }
        });
    });
}

function restoreBookingDates() {
    const checkin = sessionStorage.getItem('bookingCheckin');
    const checkout = sessionStorage.getItem('bookingCheckout');
    const adults = sessionStorage.getItem('bookingAdults');
    const children = sessionStorage.getItem('bookingChildren');

    if (checkin) {
        const el = document.getElementById('checkin');
        if (el) el.value = checkin;
    }
    if (checkout) {
        const el = document.getElementById('checkout');
        if (el) el.value = checkout;
    }
    if (adults) {
        const el = document.getElementById('guests');
        if (el) el.value = adults;
    }
    if (children) {
        const el = document.getElementById('children');
        if (el) el.value = children;
    }

    updatePriceEstimate();
}

function validateForm() {
    const required = ['name', 'phone', 'checkin', 'checkout', 'roomType'];
    let valid = true;

    required.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;

        const wrapper = el.closest('.form-group');
        if (!el.value.trim()) {
            el.style.borderColor = 'var(--danger)';
            if (wrapper) {
                let err = wrapper.querySelector('.form-error');
                if (!err) {
                    err = document.createElement('span');
                    err.className = 'form-error';
                    err.style.cssText = 'color: var(--danger); font-size: 0.8rem; margin-top: 4px; display: block;';
                    wrapper.appendChild(err);
                }
                err.textContent = 'Câmp obligatoriu';
            }
            valid = false;
        } else {
            el.style.borderColor = '';
            const err = wrapper?.querySelector('.form-error');
            if (err) err.remove();
        }
    });

    // Date validation
    const checkin = document.getElementById('checkin');
    const checkout = document.getElementById('checkout');
    if (checkin?.value && checkout?.value) {
        if (checkout.value <= checkin.value) {
            checkout.style.borderColor = 'var(--danger)';
            const wrapper = checkout.closest('.form-group');
            let err = wrapper?.querySelector('.form-error');
            if (!err && wrapper) {
                err = document.createElement('span');
                err.className = 'form-error';
                err.style.cssText = 'color: var(--danger); font-size: 0.8rem; margin-top: 4px; display: block;';
                wrapper.appendChild(err);
            }
            if (err) err.textContent = 'Check-out trebuie să fie după check-in';
            valid = false;
        }
    }

    return valid;
}

function getFormData() {
    return {
        name: document.getElementById('name')?.value || '',
        phone: document.getElementById('phone')?.value || '',
        email: document.getElementById('email')?.value || '',
        checkin: document.getElementById('checkin')?.value || '',
        checkout: document.getElementById('checkout')?.value || '',
        roomType: document.getElementById('roomType')?.value || '',
        guests: document.getElementById('guests')?.value || '',
        children: document.getElementById('children')?.value || '0',
        message: document.getElementById('message')?.value || ''
    };
}

function getRoomName(roomId) {
    const names = {
        'dubla-clasic': 'Camera Dublă Clasic (250 RON)',
        'twin': 'Camera Twin (230 RON)',
        'familie': 'Camera Familie (350 RON)',
        'apt-predeal': 'Apartament Predeal (480 RON)',
        'apt-panoramic': 'Apartament Panoramic (600 RON)'
    };
    return names[roomId] || roomId;
}

function formatDateRO(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const months = ['ian', 'feb', 'mar', 'apr', 'mai', 'iun', 'iul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function sendWhatsApp() {
    const data = getFormData();
    const nights = calculateNights(data.checkin, data.checkout);

    let text = `🏔️ *Cerere Rezervare — Pensiunea Alexandra*\n\n`;
    text += `👤 Nume: ${data.name}\n`;
    text += `📞 Telefon: ${data.phone}\n`;
    if (data.email) text += `✉️ Email: ${data.email}\n`;
    text += `\n📅 Check-in: ${formatDateRO(data.checkin)}\n`;
    text += `📅 Check-out: ${formatDateRO(data.checkout)}\n`;
    text += `🌙 ${nights} ${nights === 1 ? 'noapte' : 'nopți'}\n`;
    text += `\n🛏️ Camera: ${getRoomName(data.roomType)}\n`;
    text += `👥 Adulți: ${data.guests || '2'}\n`;
    if (data.children && data.children !== '0') text += `👶 Copii: ${data.children}\n`;
    if (data.message) text += `\n💬 Mesaj: ${data.message}\n`;

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`, '_blank');

    // Show confirmation
    showConfirmation('whatsapp');
}

function sendEmail() {
    const data = getFormData();
    const nights = calculateNights(data.checkin, data.checkout);

    const subject = `Cerere Rezervare — ${formatDateRO(data.checkin)} - ${formatDateRO(data.checkout)}`;
    let body = `Cerere Rezervare — Pensiunea Alexandra\n\n`;
    body += `Nume: ${data.name}\n`;
    body += `Telefon: ${data.phone}\n`;
    if (data.email) body += `Email: ${data.email}\n\n`;
    body += `Check-in: ${formatDateRO(data.checkin)}\n`;
    body += `Check-out: ${formatDateRO(data.checkout)}\n`;
    body += `Nopți: ${nights}\n\n`;
    body += `Camera: ${getRoomName(data.roomType)}\n`;
    body += `Adulți: ${data.guests || '2'}\n`;
    if (data.children && data.children !== '0') body += `Copii: ${data.children}\n`;
    if (data.message) body += `\nMesaj: ${data.message}\n`;

    window.location.href = `mailto:contact@pensiuneaalexandra.ro?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function calculateNights(checkin, checkout) {
    if (!checkin || !checkout) return 0;
    const start = new Date(checkin);
    const end = new Date(checkout);
    return Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));
}

function updatePriceEstimate() {
    const checkin = document.getElementById('checkin')?.value;
    const checkout = document.getElementById('checkout')?.value;
    const roomType = document.getElementById('roomType')?.value;
    const priceEl = document.getElementById('priceEstimate');

    if (!priceEl || !checkin || !checkout || !roomType) return;

    const nights = calculateNights(checkin, checkout);
    if (nights <= 0) {
        priceEl.textContent = '';
        return;
    }

    const prices = {
        'dubla-clasic': 250,
        'twin': 230,
        'familie': 350,
        'apt-predeal': 480,
        'apt-panoramic': 600
    };

    const pricePerNight = prices[roomType] || 0;
    const total = pricePerNight * nights;

    priceEl.innerHTML = `
    <div style="background: var(--cream); padding: 16px; border-radius: var(--radius-md); margin-top: 8px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <span>${pricePerNight} RON × ${nights} ${nights === 1 ? 'noapte' : 'nopți'}</span>
        <span><strong>${total} RON</strong></span>
      </div>
      <div style="font-size: 0.8rem; color: var(--gray-500);">Copii 1-17 ani: +100 RON/noapte</div>
    </div>
  `;
}

function showConfirmation(type) {
    const modal = document.createElement('div');
    modal.style.cssText = `
    position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 10001;
    display: flex; align-items: center; justify-content: center; animation: fadeIn 0.3s ease;
  `;

    const icon = type === 'whatsapp' ? '💬' : '✉️';
    const message = type === 'whatsapp'
        ? 'Cererea ta a fost trimisă pe WhatsApp! Vei primi un răspuns în curând.'
        : 'Emailul a fost deschis în clientul tău de email. Trimite-l pentru a finaliza cererea.';

    modal.innerHTML = `
    <div style="background: white; padding: 40px; border-radius: 16px; text-align: center; max-width: 400px; margin: 16px;">
      <div style="font-size: 3rem; margin-bottom: 16px;">${icon}</div>
      <h3 style="font-family: var(--font-heading); margin-bottom: 12px;">Cerere trimisă!</h3>
      <p style="color: var(--gray-500); margin-bottom: 24px; line-height: 1.5;">${message}</p>
      <button onclick="this.closest('div[style]').remove()" class="btn btn--primary" style="background: var(--forest); color: white; padding: 12px 32px; border-radius: 12px; border: none; cursor: pointer; font-weight: 600;">OK</button>
    </div>
  `;

    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}
