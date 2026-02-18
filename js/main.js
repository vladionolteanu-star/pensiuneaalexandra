/* ============================
   PENSIUNEA ALEXANDRA — Main JS
   Navigation, animations, utilities
   ============================ */

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initHamburger();
  initLightbox();
  initBookingStrip();
  initScrollAnimations();
});

/* --- Header scroll effect --- */
function initHeader() {
  const header = document.getElementById('header');
  if (!header) return;

  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* --- Hamburger menu --- */
function initHamburger() {
  const btn = document.getElementById('hamburgerBtn');
  const menu = document.getElementById('mobileMenu');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    btn.classList.toggle('open');
    menu.classList.toggle('open');
    document.body.style.overflow = menu.classList.contains('open') ? 'hidden' : '';
  });

  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      btn.classList.remove('open');
      menu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

/* --- Lightbox --- */
let lightboxImages = [];
let lightboxIndex = 0;

function initLightbox() {
  const galleryItems = document.querySelectorAll('.gallery-grid__item');
  if (!galleryItems.length) return;

  galleryItems.forEach((item, index) => {
    const img = item.querySelector('img');
    if (img) {
      lightboxImages.push(img.src);
      item.addEventListener('click', () => openLightbox(index));
    }
  });

  // Close on background click
  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox || !lightbox.classList.contains('open')) return;

    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') lightboxPrev();
    if (e.key === 'ArrowRight') lightboxNext();
  });
}

function openLightbox(index) {
  lightboxIndex = index;
  const lightbox = document.getElementById('lightbox');
  const img = document.getElementById('lightboxImg');
  const counter = document.getElementById('lightboxCounter');

  if (!lightbox || !img) return;

  img.src = lightboxImages[index];
  if (counter) counter.textContent = `${index + 1} / ${lightboxImages.length}`;
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }
}

function lightboxPrev() {
  lightboxIndex = (lightboxIndex - 1 + lightboxImages.length) % lightboxImages.length;
  updateLightbox();
}

function lightboxNext() {
  lightboxIndex = (lightboxIndex + 1) % lightboxImages.length;
  updateLightbox();
}

function updateLightbox() {
  const img = document.getElementById('lightboxImg');
  const counter = document.getElementById('lightboxCounter');
  if (img) img.src = lightboxImages[lightboxIndex];
  if (counter) counter.textContent = `${lightboxIndex + 1} / ${lightboxImages.length}`;
}

/* --- Booking Strip --- */
function initBookingStrip() {
  const checkin = document.getElementById('stripCheckin');
  const checkout = document.getElementById('stripCheckout');

  if (checkin) {
    const today = new Date().toISOString().split('T')[0];
    checkin.min = today;
    checkin.value = today;

    checkin.addEventListener('change', () => {
      if (checkout) {
        const next = new Date(checkin.value);
        next.setDate(next.getDate() + 1);
        checkout.min = next.toISOString().split('T')[0];
        if (!checkout.value || checkout.value <= checkin.value) {
          checkout.value = next.toISOString().split('T')[0];
        }
      }
    });
  }

  if (checkout) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    checkout.min = tomorrow.toISOString().split('T')[0];
    checkout.value = tomorrow.toISOString().split('T')[0];
  }
}

function saveBookingDates() {
  const checkin = document.getElementById('stripCheckin');
  const checkout = document.getElementById('stripCheckout');
  const adults = document.getElementById('stripAdults');
  const children = document.getElementById('stripChildren');

  if (checkin && checkout) {
    sessionStorage.setItem('bookingCheckin', checkin.value);
    sessionStorage.setItem('bookingCheckout', checkout.value);
    if (adults) sessionStorage.setItem('bookingAdults', adults.value);
    if (children) sessionStorage.setItem('bookingChildren', children.value);
  }
}

/* --- Scroll Animations --- */
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.room-card, .usp-card, .testimonial-card, .contact-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
}

/* --- Gallery Filters --- */
function initGalleryFilters() {
  const buttons = document.querySelectorAll('.gallery-filter');
  const items = document.querySelectorAll('.gallery-grid__item');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;

      items.forEach(item => {
        if (filter === 'all' || item.dataset.category === filter) {
          item.style.display = '';
          setTimeout(() => { item.style.opacity = '1'; item.style.transform = 'scale(1)'; }, 50);
        } else {
          item.style.opacity = '0';
          item.style.transform = 'scale(0.95)';
          setTimeout(() => { item.style.display = 'none'; }, 300);
        }
      });
    });
  });
}
