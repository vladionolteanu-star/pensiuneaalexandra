/* ============================
   PENSIUNEA ALEXANDRA — Room Photos
   Dynamic slideshow from Supabase (fallback: JSON files)
   ============================ */

document.addEventListener('DOMContentLoaded', () => {
    initRoomSlideshows();
});

// Maps HTML element IDs to room IDs in the database
const ROOM_ID_MAP = {
    'dubla-clasic': 'dubla-clasic',
    'twin': 'twin',
    'familie': 'familie',
    'apt-predeal': 'apt-predeal',
    'apt-panoramic': 'apt-panoramic',
    'classic-double': 'dubla-clasic',
    'family': 'familie',
    'predeal-apt': 'apt-predeal',
    'panoramic-apt': 'apt-panoramic'
};

async function initRoomSlideshows() {
    for (const [elementId, roomId] of Object.entries(ROOM_ID_MAP)) {
        const container = document.getElementById(elementId);
        if (!container) continue;

        const gallery = container.querySelector('.room-detail__gallery');
        if (!gallery) continue;

        let photos = null;
        let price = null;

        // Try Supabase first
        if (typeof db !== 'undefined' && db.getRoomWithPhotos) {
            try {
                const room = await db.getRoomWithPhotos(roomId);
                if (room && room.photos && room.photos.length > 0) {
                    photos = room.photos;
                    price = room.price;
                }
            } catch (e) {
                console.log('Supabase unavailable for room photos, trying JSON fallback');
            }
        }

        // Fallback to JSON files
        if (!photos) {
            try {
                const basePath = window.location.pathname.includes('/en/') ? '../' : '';
                const response = await fetch(`${basePath}content/rooms/${roomId}.json`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.photos && data.photos.length > 0) {
                        photos = data.photos;
                        price = data.price;
                    }
                }
            } catch (e) {
                console.log(`Using static data for ${elementId}`);
            }
        }

        if (!photos || photos.length === 0) continue;

        buildSlideshow(gallery, photos, elementId);

        if (price) {
            const priceEl = container.querySelector('.room-detail__price');
            if (priceEl) {
                const isEN = window.location.pathname.includes('/en/');
                priceEl.innerHTML = `${price} RON <span>/ ${isEN ? 'night' : 'noapte'}</span>`;
            }
        }
    }
}

function buildSlideshow(gallery, photos, roomId) {
    const imgPrefix = window.location.pathname.includes('/en/') ? '..' : '';

    gallery.innerHTML = '';
    gallery.classList.add('room-slideshow');

    const slidesContainer = document.createElement('div');
    slidesContainer.className = 'room-slideshow__slides';

    photos.forEach((photo, index) => {
        const img = document.createElement('img');
        const src = photo.src.startsWith('/') ? `${imgPrefix}${photo.src}` : `${imgPrefix}/${photo.src}`;
        img.src = src;
        img.alt = photo.alt || '';
        img.loading = index === 0 ? 'eager' : 'lazy';
        img.className = `room-slideshow__img ${index === 0 ? 'active' : ''}`;
        img.dataset.index = index;
        slidesContainer.appendChild(img);
    });

    gallery.appendChild(slidesContainer);

    if (photos.length > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.className = 'room-slideshow__btn room-slideshow__btn--prev';
        prevBtn.innerHTML = '‹';
        prevBtn.setAttribute('aria-label', 'Previous photo');

        const nextBtn = document.createElement('button');
        nextBtn.className = 'room-slideshow__btn room-slideshow__btn--next';
        nextBtn.innerHTML = '›';
        nextBtn.setAttribute('aria-label', 'Next photo');

        const dotsContainer = document.createElement('div');
        dotsContainer.className = 'room-slideshow__dots';

        photos.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.className = `room-slideshow__dot ${index === 0 ? 'active' : ''}`;
            dot.setAttribute('aria-label', `Photo ${index + 1}`);
            dot.dataset.index = index;
            dotsContainer.appendChild(dot);
        });

        const counter = document.createElement('div');
        counter.className = 'room-slideshow__counter';
        counter.textContent = `1 / ${photos.length}`;

        gallery.appendChild(prevBtn);
        gallery.appendChild(nextBtn);
        gallery.appendChild(dotsContainer);
        gallery.appendChild(counter);

        let currentIndex = 0;

        function goTo(index) {
            const images = slidesContainer.querySelectorAll('.room-slideshow__img');
            const dots = dotsContainer.querySelectorAll('.room-slideshow__dot');

            images.forEach(img => img.classList.remove('active'));
            dots.forEach(dot => dot.classList.remove('active'));

            currentIndex = (index + photos.length) % photos.length;
            images[currentIndex].classList.add('active');
            dots[currentIndex].classList.add('active');
            counter.textContent = `${currentIndex + 1} / ${photos.length}`;
        }

        prevBtn.addEventListener('click', () => goTo(currentIndex - 1));
        nextBtn.addEventListener('click', () => goTo(currentIndex + 1));

        dotsContainer.querySelectorAll('.room-slideshow__dot').forEach(dot => {
            dot.addEventListener('click', () => goTo(parseInt(dot.dataset.index)));
        });

        let touchStartX = 0;
        gallery.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        }, { passive: true });

        gallery.addEventListener('touchend', (e) => {
            const diff = touchStartX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 50) {
                goTo(diff > 0 ? currentIndex + 1 : currentIndex - 1);
            }
        }, { passive: true });
    }
}
