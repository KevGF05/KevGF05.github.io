// Menú móvil
const toggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

function setMenu(open) {
    navLinks.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    toggle.querySelector('use').setAttribute('href', open ? '#i-x' : '#i-menu');
}

toggle.addEventListener('click', () => setMenu(!navLinks.classList.contains('open')));

navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => setMenu(false));
});

// Resalta en el menú la sección visible
const sections = document.querySelectorAll('main section[id]');
const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.querySelectorAll('a').forEach(a => {
            a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id);
        });
    });
}, { rootMargin: '-50% 0px -50% 0px' });
sections.forEach(s => sectionObserver.observe(s));

// Animación de aparición al hacer scroll
const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// Ventana de proyecto con galería de capturas
const modal = document.getElementById('project-modal');
const modalImg = modal.querySelector('.gallery-img');
const modalCaption = modal.querySelector('.gallery-caption');
const modalCounter = modal.querySelector('.gallery-counter');
const modalThumbs = modal.querySelector('.gallery-thumbs');
const modalBody = modal.querySelector('.modal-body');
let images = [];
let captions = [];
let current = 0;
let lastFocus = null;

function showImage(index) {
    current = (index + images.length) % images.length;
    modalImg.src = images[current];
    modalImg.alt = captions[current] || '';
    modalCaption.textContent = captions[current] || '';
    modalCounter.textContent = `${current + 1} / ${images.length}`;
    modalThumbs.querySelectorAll('button').forEach((b, i) => {
        b.classList.toggle('active', i === current);
        if (i === current) {
            // Solo desplaza la fila de miniaturas, no la ventana
            modalThumbs.scrollLeft = b.offsetLeft - (modalThumbs.clientWidth - b.offsetWidth) / 2;
        }
    });
}

function openModal(card) {
    images = card.dataset.images.split(',');
    captions = (card.dataset.captions || '').split('|');
    lastFocus = document.activeElement;

    // Reutiliza el título, la descripción, las tecnologías y los enlaces de la tarjeta
    modalBody.innerHTML = '';
    modalBody.append(card.querySelector('.project-info').cloneNode(true));
    modalBody.querySelector('h3').id = 'project-modal-title';

    modalThumbs.innerHTML = '';
    images.forEach((src, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', `Ver captura ${i + 1}: ${captions[i] || ''}`);
        b.innerHTML = `<img src="${src}" alt="">`;
        b.addEventListener('click', () => showImage(i));
        modalThumbs.append(b);
    });

    // Las capturas de celular se muestran en formato vertical
    modal.classList.toggle('vertical', card.hasAttribute('data-vertical'));
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    modal.querySelector('.modal-content').scrollTop = 0;
    showImage(0);
    modal.querySelector('.modal-close').focus({ preventScroll: true });

    // Entrada en el historial para que el botón "Atrás" del teléfono cierre la ventana
    try {
        history.pushState({ projectModal: true }, '');
    } catch (e) {
        // Algunos navegadores no lo permiten al abrir el archivo localmente
    }
}

function hideModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus({ preventScroll: true });
}

function closeModal() {
    // Si la ventana agregó una entrada al historial, se quita y popstate la oculta
    if (history.state && history.state.projectModal) {
        history.back();
    } else {
        hideModal();
    }
}

window.addEventListener('popstate', () => {
    if (modal.classList.contains('open')) hideModal();
});

document.querySelectorAll('.project-card[data-images]').forEach(card => {
    card.addEventListener('click', e => {
        if (e.target.closest('a')) return; // el enlace de GitHub sigue funcionando normal
        openModal(card);
    });
    card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openModal(card);
        }
    });
});

modal.querySelector('.gallery-prev').addEventListener('click', () => showImage(current - 1));
modal.querySelector('.gallery-next').addEventListener('click', () => showImage(current + 1));
modal.querySelector('.modal-close').addEventListener('click', closeModal);
modal.querySelector('.modal-back').addEventListener('click', closeModal);
modal.addEventListener('click', e => {
    if (e.target === modal) closeModal();
});

document.addEventListener('keydown', e => {
    if (!modal.classList.contains('open')) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') showImage(current - 1);
    if (e.key === 'ArrowRight') showImage(current + 1);
});

// Deslizar con el dedo en celulares
let touchX = null;
modalImg.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
modalImg.addEventListener('touchend', e => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) showImage(current + (dx < 0 ? 1 : -1));
    touchX = null;
});

// Botón de correo: copia la dirección al portapapeles sin mostrarla en la página
const copyBtn = document.querySelector('.copy-email');
const copyTooltip = copyBtn.querySelector('.copy-tooltip');
let tooltipTimer = null;

function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
    }
    // Respaldo para navegadores sin la API del portapapeles
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.append(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok ? Promise.resolve() : Promise.reject();
}

copyBtn.addEventListener('click', () => {
    const email = `${copyBtn.dataset.user}@${copyBtn.dataset.domain}`;
    copyText(email)
        .then(() => { copyTooltip.textContent = '¡Correo copiado!'; })
        .catch(() => { copyTooltip.textContent = email; });
    copyTooltip.classList.add('show');
    clearTimeout(tooltipTimer);
    tooltipTimer = setTimeout(() => copyTooltip.classList.remove('show'), 2000);
});

// Año actual en el footer
document.getElementById('year').textContent = new Date().getFullYear();
