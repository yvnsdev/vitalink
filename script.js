// CONFIGURACIÓN SUPABASE - REEMPLAZAR CON TUS PROPIAS CREDENCIALES
const SUPABASE_URL = 'https://mogtzwibejrrlpwdghop.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vZ3R6d2liZWpycmxwd2RnaG9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMTY5MjMsImV4cCI6MjA3NDY5MjkyM30.bfI6lV2ON6RSM8sPybC25dup-oYDfpLVcsDVEP2nObw';

// Lista de emails administradores
const ADMIN_EMAILS = ["tomas.yevenesc@gmail.com"];

// Variables globales
let supabase;
let currentUser = null;
let capsulesData = [];
let categoriesCache = [];

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async function () {
    await initSupabase();
    initEventListeners();
    checkAuthState();
    await loadCapsules();
    await loadCategories();
    initFAQ();
    initScrollEffects();
    initAlliancesCarousel();
    // initHeroNetwork removed - particles disabled for performance
});

// Hero particles removed to improve performance

// Inicializar cliente Supabase
async function initSupabase() {
    try {
        // Crear cliente Supabase
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        console.log('Supabase inicializado correctamente');
    } catch (error) {
        console.error('Error inicializando Supabase:', error);
        showToast('Error de conexión con la base de datos', 'error');
    }
}

// Inicializar event listeners
function initEventListeners() {
    // Navegación móvil
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
            document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
        });
    }

    // Cerrar menú móvil al hacer clic en un enlace
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // Botón de acceso/auth
    const authBtn = document.getElementById('auth-btn');
    if (authBtn) {
        authBtn.addEventListener('click', openAuthModal);
    }

    // Modal de autenticación
    const authModal = document.getElementById('auth-modal');
    const modalClose = document.querySelector('.modal-close');

    if (modalClose) {
        modalClose.addEventListener('click', closeAuthModal);
    }

    // Cerrar modal al hacer clic fuera
    if (authModal) {
        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) {
                closeAuthModal();
            }
        });
    }

    // Tabs de autenticación
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            switchAuthTab(tabName);
        });
    });

    // Formularios de autenticación
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Cerrar sesión
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Filtros y búsqueda
    const searchInput = document.getElementById('search-input');
    const categorySelect = document.getElementById('category-select');
    const sortSelect = document.getElementById('sort-select');

    if (searchInput) {
        searchInput.addEventListener('input', filterCapsules);
    }

    if (categorySelect) {
        categorySelect.addEventListener('change', filterCapsules);
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', filterCapsules);
    }

    // Formulario de contacto
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContact);
    }

    // Formulario de subida de recursos
    const uploadForm = document.getElementById('upload-form');
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleUpload);
    }

    // Cerrar panel de usuario al hacer clic fuera
    document.addEventListener('click', (e) => {
        const userPanel = document.getElementById('user-panel');
        const authBtn = document.getElementById('auth-btn');

        if (userPanel && userPanel.classList.contains('active') &&
            !userPanel.contains(e.target) &&
            e.target !== authBtn &&
            !authBtn.contains(e.target)) {
            closeUserPanel();
        }
    });

    initFilePreview();
    initThumbnailPreview();

}

// Inicializar FAQ
function initFAQ() {
    const faqQuestions = document.querySelectorAll('.faq-question');

    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const item = question.parentElement;
            const isActive = item.classList.contains('active');

            // Cerrar todas las preguntas
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
            });

            // Abrir la pregunta actual si no estaba activa
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
}

// Inicializar efectos de scroll
function initScrollEffects() {
    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Animación de elementos al hacer scroll
        animateOnScroll();
    });

    // Lazy loading para imágenes
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

// Animación de elementos al hacer scroll
function animateOnScroll() {
    const elements = document.querySelectorAll('.benefit-card, .focus-item, .testimonial-card, .capsula-card');

    elements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;

        if (elementTop < window.innerHeight - elementVisible) {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }
    });
}

// Verificar estado de autenticación
async function checkAuthState() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
            console.error('Error verificando sesión:', error);
            return;
        }

        if (session?.user) {
            currentUser = session.user;
            updateUIForAuthenticatedUser();
        } else {
            updateUIForUnauthenticatedUser();
        }
    } catch (error) {
        console.error('Error en checkAuthState:', error);
    }
}

// Actualizar UI para usuario autenticado
function updateUIForAuthenticatedUser() {
    console.log('Actualizando UI para usuario autenticado:', currentUser.email);

    // Actualizar botón de auth
    const authBtn = document.getElementById('auth-btn');
    if (authBtn) {
        authBtn.textContent = 'Mi Perfil';
        authBtn.removeEventListener('click', openAuthModal);
        authBtn.addEventListener('click', toggleUserPanel);
    }

    // Actualizar avatar de usuario
    const userAvatar = document.getElementById('user-avatar');
    const userEmail = document.getElementById('user-email');

    if (userAvatar && currentUser.email) {
        userAvatar.textContent = currentUser.email.charAt(0).toUpperCase();
    }

    if (userEmail && currentUser.email) {
        userEmail.textContent = currentUser.email;
    }

    // MOSTRAR PANEL DE ADMIN A TODOS LOS USUARIOS AUTENTICADOS
    const adminPanel = document.getElementById('admin-panel');
    const regularPanel = document.getElementById('regular-panel');

    console.log('Elementos encontrados:', {
        adminPanel: adminPanel,
        regularPanel: regularPanel
    });

    if (adminPanel) {
        adminPanel.style.display = 'block';
        console.log('Admin panel mostrado');
    }

    if (regularPanel) {
        regularPanel.style.display = 'none';
        console.log('Regular panel ocultado');
    }

    loadUserFiles();

    // Cerrar modal de auth si está abierto
    closeAuthModal();
}

// Actualizar UI para usuario no autenticado
function updateUIForUnauthenticatedUser() {
    const authBtn = document.getElementById('auth-btn');
    if (authBtn) {
        authBtn.textContent = 'Acceder';
        authBtn.removeEventListener('click', toggleUserPanel);
        authBtn.addEventListener('click', openAuthModal);
    }

    // Cerrar panel de usuario si está abierto
    closeUserPanel();
}

// Abrir modal de autenticación
function openAuthModal() {
    const authModal = document.getElementById('auth-modal');
    if (authModal) {
        authModal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Resetear formularios
        document.getElementById('login-form').reset();
        document.getElementById('register-form').reset();

        // Mostrar tab de login por defecto
        switchAuthTab('login');
    }
}

// Cerrar modal de autenticación
function closeAuthModal() {
    const authModal = document.getElementById('auth-modal');
    if (authModal) {
        authModal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Cambiar entre tabs de autenticación
function switchAuthTab(tabName) {
    // Actualizar botones de tab
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.classList.remove('active');
    });

    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Mostrar formulario correspondiente
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });

    document.getElementById(`${tabName}-form`).classList.add('active');
}

// Manejar inicio de sesión
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    // Mostrar estado de carga
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Iniciando sesión...';
    submitBtn.disabled = true;

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            throw error;
        }

        currentUser = data.user;
        updateUIForAuthenticatedUser();
        showToast('Sesión iniciada correctamente', 'success');

    } catch (error) {
        console.error('Error en login:', error);
        showToast('Error al iniciar sesión: ' + error.message, 'error');
    } finally {
        // Restaurar botón
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Manejar registro
async function handleRegister(e) {
    e.preventDefault();

    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // Validar contraseñas
    if (password !== confirmPassword) {
        showToast('Las contraseñas no coinciden', 'error');
        return;
    }

    // Mostrar estado de carga
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Creando cuenta...';
    submitBtn.disabled = true;

    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    is_profesional_rural: true
                }
            }
        });

        if (error) {
            throw error;
        }

        showToast('Cuenta creada correctamente. Revisa tu email para confirmar.', 'success');
        switchAuthTab('login');

    } catch (error) {
        console.error('Error en registro:', error);
        showToast('Error al crear cuenta: ' + error.message, 'error');
    } finally {
        // Restaurar botón
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Manejar cierre de sesión
async function handleLogout() {
    try {
        const { error } = await supabase.auth.signOut();

        if (error) {
            throw error;
        }

        currentUser = null;
        updateUIForUnauthenticatedUser();
        showToast('Sesión cerrada correctamente', 'success');

    } catch (error) {
        console.error('Error en logout:', error);
        showToast('Error al cerrar sesión', 'error');
    }
}

// Abrir/cerrar panel de usuario
function toggleUserPanel() {
    const userPanel = document.getElementById('user-panel');
    if (userPanel) {
        userPanel.classList.toggle('active');
        document.body.style.overflow = userPanel.classList.contains('active') ? 'hidden' : '';
    }
}

// Cerrar panel de usuario
function closeUserPanel() {
    const userPanel = document.getElementById('user-panel');
    if (userPanel) {
        userPanel.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Cargar recursos desde Supabase
async function loadCapsules() {
    const capsulesGrid = document.getElementById('capsulas-grid');

    try {
        // Mostrar estado de carga
        capsulesGrid.innerHTML = '<div class="loading">Cargando recursos...</div>';

        // Intentar cargar desde la tabla capsules
        let { data: capsules, error } = await supabase
            .from('capsules')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.warn('No se pudo cargar desde la tabla capsules, usando datos de ejemplo:', error);
            capsules = getMockCapsulas();
        }

        // Si no hay recursos, usar datos de ejemplo
        if (!capsules || capsules.length === 0) {
            capsules = getMockCapsulas();
        }

        capsulesData = capsules;
        renderCapsules(capsules);

    } catch (error) {
        console.error('Error cargando recursos:', error);
        capsulesData = getMockCapsulas();
        renderCapsules(capsulesData);
        showToast('Usando datos de ejemplo', 'info');
    }
}

// Cargar categorías desde Supabase (o derivar de capsules) y poblar select + filtro
async function loadCategories() {
    const datalist = document.getElementById('categories-datalist');
    const categorySelect = document.getElementById('category-select');

    try {
        if (typeof supabase !== 'undefined' && supabase) {
            const { data, error } = await supabase.from('categories').select('*').order('name', { ascending: true });
            if (!error && data) {
                // almacenar como objetos {slug, name}
                categoriesCache = data.map(c => ({ slug: c.slug, name: c.name }));
            }
        }
    } catch (err) {
        console.warn('No se pudo cargar categories desde Supabase, usando fallback', err);
    }

    // Si no tenemos categories en DB, derivar de capsulesData
    if (!categoriesCache || categoriesCache.length === 0) {
        const map = new Map();
        (capsulesData || []).forEach(c => {
            if (c.category) {
                const slug = c.category;
                if (!map.has(slug)) map.set(slug, { slug, name: getCategoryName(slug) });
            }
        });
        categoriesCache = Array.from(map.values());
    }

    // Poblar datalist (si existe) — mantenido por compatibilidad
    if (datalist) {
        datalist.innerHTML = categoriesCache.map(cat => `<option value="${cat.slug}"></option>`).join('');
    }

    // Poblar select de filtro (si existe)
    if (categorySelect) {
        const current = categorySelect.value || 'todas';
        categorySelect.innerHTML = '<option value="todas">Todas las categorías</option>' +
            categoriesCache.map(cat => `<option value="${cat.slug}">${cat.name}</option>`).join('');
        categorySelect.value = current;
    }

    // Poblar select del formulario de subida (capsule-category) si existe
    const uploadSelect = document.getElementById('capsule-category');
    if (uploadSelect) {
        const currentUpload = uploadSelect.value || '';
        uploadSelect.innerHTML = '<option value="">Selecciona una categoría</option>' +
            categoriesCache.map(cat => `<option value="${cat.slug}">${cat.name}</option>`).join('');
        if (currentUpload) uploadSelect.value = currentUpload;
    }
}

// Obtener recursos de ejemplo (mock)
function getMockCapsulas() {
    return [];
}

// Renderizar recursos en el grid
function renderCapsules(capsules) {
    const capsulesGrid = document.getElementById('capsulas-grid');

    if (!capsulesGrid) return;

    if (capsules.length === 0) {
        capsulesGrid.innerHTML = '<div class="loading">No se encontraron recursos que coincidan con tu búsqueda</div>';
        return;
    }

    capsulesGrid.innerHTML = capsules.map(capsule => {
        const isVideo = capsule.file_type === 'video' ||
            (capsule.public_url && /\.(mp4|mov|avi)$/i.test(capsule.public_url));

        // Usar miniatura personalizada si está disponible, sino usar el icono de categoría
        const thumbnailContent = capsule.thumbnail_url ?
            `<img src="${capsule.thumbnail_url}" alt="${capsule.title}" class="capsula-thumbnail">` :
            `<div class="capsula-icon">${getCategoryIcon(capsule.category)}</div>`;

        return `
        <div class="capsula-card" data-category="${capsule.category}">
            <div class="capsula-image ${capsule.thumbnail_url ? 'has-thumbnail' : ''}">
                ${thumbnailContent}
                ${isVideo ? '<div class="video-indicator">VIDEO</div>' : ''}
            </div>
            <div class="capsula-content">
                <span class="capsula-category">${getCategoryName(capsule.category)}</span>
                <h3 class="capsula-title">${capsule.title}</h3>
                <p class="capsula-description">${capsule.description}</p>
                <div class="capsula-meta">
                    <span class="capsula-duration">⏱ ${capsule.duration_minutes} min</span>
                    ${isVideo ?
                    `<button class="btn btn-primary btn-small play-video-btn" 
                                    data-video-url="${capsule.public_url}"
                                    data-thumbnail-url="${capsule.thumbnail_url || ''}">
                                Reproducir Video
                             </button>` :
                `<a href="${capsule.public_url || '#'}" class="btn btn-primary btn-small" target="_blank">
                            Ver/Descargar
                         </a>`
            }
                </div>
            </div>
        </div>
        `;
    }).join('');

    // Agregar event listeners para los botones de video (mejorado)
    document.querySelectorAll('.play-video-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const videoUrl = this.getAttribute('data-video-url');
            const thumbnail = this.getAttribute('data-thumbnail-url') || '';
            const card = this.closest('.capsula-card');
            const title = card?.querySelector('.capsula-title')?.textContent || '';
            openVideoModal({ videoUrl, thumbnailUrl: thumbnail, title });
        });
    });

    // Aplicar animaciones
    setTimeout(() => {
        animateOnScroll();
    }, 100);
}

// Función para abrir modal de video
function openVideoModal({ videoUrl, thumbnailUrl = '', title = '' } = {}) {
    if (!videoUrl) return;

    // Crear modal accesible y mejorado para video
    const videoModal = document.createElement('div');
    videoModal.className = 'modal active modal-video';
    videoModal.setAttribute('role', 'dialog');
    videoModal.setAttribute('aria-modal', 'true');
    videoModal.innerHTML = `
        <div class="modal-content" style="max-width: 900px;">
            <button class="modal-close" aria-label="Cerrar modal">×</button>
            <div class="video-meta" style="margin-bottom:0.75rem;">
                <strong class="video-title">${title || ''}</strong>
            </div>
            <div class="video-container">
                <div class="video-spinner" aria-hidden="true"></div>
                <video class="player" controls preload="metadata" playsinline style="width:100%; height:auto; display:block; background:#000; border-radius:8px;">
                    <source src="${videoUrl}" type="video/mp4">
                    Tu navegador no soporta el elemento de video.
                </video>
            </div>
            <div style="text-align: center; margin-top: 1rem;">
                <a href="${videoUrl}" class="btn btn-outline" download>Descargar Video</a>
            </div>
        </div>
    `;

    // Añadir poster si existe
    if (thumbnailUrl) {
        const temp = document.createElement('video');
        temp.setAttribute('poster', thumbnailUrl);
        // set poster on actual video after it's inserted
    }

    document.body.appendChild(videoModal);

    // Evitar scroll de fondo
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const modalContent = videoModal.querySelector('.modal-content');
    const closeBtn = videoModal.querySelector('.modal-close');
    const player = videoModal.querySelector('.player');
    const spinner = videoModal.querySelector('.video-spinner');

    // Apply poster if provided
    if (thumbnailUrl) player.setAttribute('poster', thumbnailUrl);

    // Autoplay on user gesture
    player.play().catch(()=>{});

    // Show spinner until canplay
    const onCanPlay = () => {
        spinner.style.display = 'none';
        player.classList.add('ready');
        player.play().catch(()=>{});
    };

    const onWaiting = () => { spinner.style.display = 'block'; };
    const onPlaying = () => { spinner.style.display = 'none'; };

    player.addEventListener('canplay', onCanPlay);
    player.addEventListener('playing', onPlaying);
    player.addEventListener('waiting', onWaiting);

    // Close handlers
    function closeModal() {
        // remove listeners
        player.pause();
        player.removeEventListener('canplay', onCanPlay);
        player.removeEventListener('playing', onPlaying);
        player.removeEventListener('waiting', onWaiting);
        document.removeEventListener('keydown', onKeyDown);
        videoModal.remove();
        document.body.style.overflow = previousOverflow;
    }

    closeBtn.addEventListener('click', closeModal);

    // Cerrar modal al hacer clic fuera del contenido
    videoModal.addEventListener('click', (e) => {
        if (e.target === videoModal) closeModal();
    });

    // Teclas de acceso: Esc cierra, espacio play/pause, flechas seek
    function onKeyDown(e) {
        if (e.key === 'Escape') {
            closeModal();
            return;
        }
        if (e.key === ' ' || e.code === 'Space') {
            e.preventDefault();
            if (player.paused) player.play(); else player.pause();
            return;
        }
        if (e.key === 'ArrowRight') {
            player.currentTime = Math.min(player.duration || Infinity, player.currentTime + 5);
            return;
        }
        if (e.key === 'ArrowLeft') {
            player.currentTime = Math.max(0, player.currentTime - 5);
            return;
        }
    }

    document.addEventListener('keydown', onKeyDown);

    // Focus inicial en botón cerrar
    closeBtn.focus();
}

// Obtener icono por categoría
function getCategoryIcon(category) {
    const icons = {
        'salud_fisica': '<i class="fas fa-heartbeat"></i>',
        'bienestar_mental': '<i class="fas fa-brain"></i>',
        'competencias_profesionales': '<i class="fas fa-stethoscope"></i>'
    };

    return icons[category] || '<i class="fas fa-file"></i>';
}

// Obtener nombre legible de categoría
function getCategoryName(category) {
    const names = {
        'salud_fisica': 'Salud Física',
        'bienestar_mental': 'Bienestar Mental',
        'competencias_profesionales': 'Competencias Profesionales'
    };
    if (!category) return '';

    // If we have a mapping, return it
    if (names[category]) return names[category];

    // Otherwise, transform slug-like strings to readable names:
    // - replace underscores and hyphens with spaces
    // - collapse multiple spaces
    // - trim and title-case each word
    const cleaned = category.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
    return cleaned.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// Filtrar recursos
function filterCapsules() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const categoryFilter = document.getElementById('category-select').value;
    const sortFilter = document.getElementById('sort-select').value;

    let filteredCapsules = capsulesData.filter(capsule => {
        const matchesSearch = !searchTerm ||
            capsule.title.toLowerCase().includes(searchTerm) ||
            capsule.description.toLowerCase().includes(searchTerm);

        const matchesCategory = categoryFilter === 'todas' || capsule.category === categoryFilter;

        return matchesSearch && matchesCategory;
    });

    // Aplicar ordenamiento
    if (sortFilter === 'nuevas') {
        filteredCapsules.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortFilter === 'populares') {
        filteredCapsules.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (sortFilter === 'duracion') {
        filteredCapsules.sort((a, b) => a.duration_minutes - b.duration_minutes);
    }

    renderCapsules(filteredCapsules);
}

// Manejar envío de formulario de contacto
async function handleContact(e) {
    e.preventDefault();

    // Mostrar estado de carga
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Enviando...';
    submitBtn.disabled = true;

    // Recoger valores y validación sencilla
    const name = (document.getElementById('name')?.value || '').trim();
    const email = (document.getElementById('email')?.value || '').trim();
    const subject = (document.getElementById('subject')?.value || '').trim();
    const message = (document.getElementById('message')?.value || '').trim();

    if (!name || !email || !message) {
        showToast('Por favor completa los campos requeridos (nombre, email y mensaje).', 'error');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        return;
    }

    try {
        // Si Supabase está inicializado, guardar en la tabla 'contacts'
        if (typeof supabase !== 'undefined' && supabase) {
            const payload = {
                name,
                email,
                subject,
                message,
                owner: currentUser ? currentUser.id : null,
                created_at: new Date().toISOString()
            };

            const { data, error } = await supabase.from('contacts').insert([payload]);
            if (error) throw error;

            showToast('Mensaje enviado correctamente. Te contactaremos pronto.', 'success');
            e.target.reset();
        } else {
            // Fallback: simulación local rápida
            await new Promise(res => setTimeout(res, 900));
            showToast('Mensaje enviado correctamente (modo local).', 'success');
            e.target.reset();
        }
    } catch (err) {
        console.error('Error enviando contacto:', err);
        showToast('Error al enviar el mensaje: ' + (err.message || err), 'error');
    } finally {
        // Restaurar botón
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Manejar subida de recurso
async function handleUpload(e) {
    e.preventDefault();

    if (!currentUser) {
        showToast('Debes iniciar sesión para subir recursos', 'error');
        return;
    }

    const title = document.getElementById('capsule-title').value;
    const category = document.getElementById('capsule-category').value;
    const description = document.getElementById('capsule-description').value;
    const duration = document.getElementById('capsule-duration').value;
    const fileInput = document.getElementById('capsule-file');
    const thumbnailInput = document.getElementById('capsule-thumbnail');
    const file = fileInput.files[0];
    const thumbnailFile = thumbnailInput.files[0];

    if (!file) {
        showToast('Selecciona un archivo principal', 'error');
        return;
    }

    // Validar tipo de archivo y tamaño
    const allowedTypes = [
        'application/pdf',
        'video/mp4',
        'video/mpeg',
        'video/quicktime',
        'video/x-msvideo',
        'image/jpeg',
        'image/jpg',
        'image/png'
    ];

    const allowedThumbnailTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png'
    ];

    const maxSize = 100 * 1024 * 1024; // 100MB máximo para videos
    const maxThumbnailSize = 5 * 1024 * 1024; // 5MB máximo para miniaturas

    if (!allowedTypes.includes(file.type)) {
        showToast('Tipo de archivo no permitido. Usa PDF, MP4, MOV, AVI, JPG o PNG.', 'error');
        return;
    }

    if (file.size > maxSize) {
        showToast('El archivo es demasiado grande. Máximo 100MB.', 'error');
        return;
    }

    // Validar miniatura si se proporciona
    let thumbnailPath = null;
    let thumbnailUrl = null;

    if (thumbnailFile) {
        if (!allowedThumbnailTypes.includes(thumbnailFile.type)) {
            showToast('La miniatura debe ser una imagen JPG o PNG', 'error');
            return;
        }

        if (thumbnailFile.size > maxThumbnailSize) {
            showToast('La miniatura es demasiado grande. Máximo 5MB.', 'error');
            return;
        }
    }

    // Mostrar estado de carga
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Subiendo...';
    submitBtn.disabled = true;

    try {
        // Crear slug para el nombre del archivo
        const slug = title.toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
        const timestamp = Date.now();
        const fileExt = file.name.split('.').pop();
        const filePath = `${category}/${slug}-${timestamp}.${fileExt}`;

        // Subir archivo principal a Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('capsulas')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            throw uploadError;
        }

        // Obtener URL pública del archivo principal
        const { data: urlData } = supabase.storage
            .from('capsulas')
            .getPublicUrl(filePath);

        // Subir miniatura si se proporcionó
        if (thumbnailFile) {
            const thumbnailExt = thumbnailFile.name.split('.').pop();
            const thumbnailPath = `thumbnails/${slug}-${timestamp}.${thumbnailExt}`;

            const { data: thumbnailUploadData, error: thumbnailUploadError } = await supabase.storage
                .from('capsulas')
                .upload(thumbnailPath, thumbnailFile, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (thumbnailUploadError) {
                throw thumbnailUploadError;
            }

            // Obtener URL pública de la miniatura
            const { data: thumbnailUrlData } = supabase.storage
                .from('capsulas')
                .getPublicUrl(thumbnailPath);

            thumbnailUrl = thumbnailUrlData.publicUrl;
        }

        // Determinar el tipo de contenido
        const isVideo = file.type.startsWith('video/');
        const isImage = file.type.startsWith('image/');
        const contentType = isVideo ? 'video' : (isImage ? 'image' : 'document');

        // Guardar metadatos en la tabla capsules
        const { data: capsuleData, error: capsuleError } = await supabase
            .from('capsules')
            .insert([
                {
                    title,
                    category,
                    description,
                    duration_minutes: parseInt(duration),
                    file_path: filePath,
                    public_url: urlData.publicUrl,
                    thumbnail_url: thumbnailUrl, // Nueva columna para la miniatura
                    file_type: contentType,
                    file_size: file.size,
                    owner: currentUser.id
                }
            ])
            .select();

        if (capsuleError) {
            throw capsuleError;
        }

        // Actualizar lista de recursos
        loadCapsules();
        loadUserFiles();

        // Limpiar formulario
        e.target.reset();

        showToast('Recurso subido correctamente', 'success');

    } catch (error) {
        console.error('Error subiendo recurso:', error);
        showToast('Error al subir recurso: ' + error.message, 'error');
    } finally {
        // Restaurar botón
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Cargar archivos del usuario
async function loadUserFiles() {
    if (!currentUser) return;

    const filesList = document.getElementById('my-files-list');
    if (!filesList) return;

    try {
        const { data: files, error } = await supabase
            .from('capsules')
            .select('*')
            .eq('owner', currentUser.id)
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        if (!files || files.length === 0) {
            filesList.innerHTML = '<p>No has subido ningún recurso aún.</p>';
            return;
        }

        filesList.innerHTML = files.map(file => `
            <div class="capsula-card">
                <div class="capsula-content">
                    <span class="capsula-category">${getCategoryName(file.category)}</span>
                    <h3 class="capsula-title">${file.title}</h3>
                    <p class="capsula-description">${file.description}</p>
                    <div class="capsula-meta">
                        <span class="capsula-duration">⏱ ${file.duration_minutes} min</span>
                        <a href="${file.public_url || '#'}" class="btn btn-primary btn-small" target="_blank">
                            Ver/Descargar
                        </a>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error cargando archivos del usuario:', error);
        filesList.innerHTML = '<p>Error al cargar tus archivos.</p>';
    }
}

// Mostrar notificaciones toast
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');

    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    // Auto-eliminar después de 5 segundos
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 5000);
}

// Escuchar cambios de autenticación
if (supabase) {
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN') {
            currentUser = session.user;
            updateUIForAuthenticatedUser();
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            updateUIForUnauthenticatedUser();
        }
    });
}

// Puedes agregar esta función para previsualizar videos antes de subir
function initFilePreview() {
    const fileInput = document.getElementById('capsule-file');
    if (fileInput) {
        fileInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file && file.type.startsWith('video/')) {
                // Mostrar previsualización o información del video
                showToast(`Video seleccionado: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`, 'info');
            }
        });
    }
}

// Agrega esta función para previsualizar la miniatura antes de subir
function initThumbnailPreview() {
    const thumbnailInput = document.getElementById('capsule-thumbnail');
    if (thumbnailInput) {
        thumbnailInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    // Crear o actualizar la previsualización
                    let previewContainer = document.getElementById('thumbnail-preview');
                    if (!previewContainer) {
                        previewContainer = document.createElement('div');
                        previewContainer.id = 'thumbnail-preview';
                        previewContainer.className = 'thumbnail-preview';
                        thumbnailInput.parentNode.appendChild(previewContainer);
                    }

                    previewContainer.innerHTML = `<img src="${e.target.result}" alt="Vista previa de miniatura">`;
                    previewContainer.classList.add('active');

                    showToast(`Miniatura seleccionada: ${file.name}`, 'info');
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

function initAlliancesCarousel() {
    const root = document.getElementById('alianzas-carousel');
    if (!root) return;

    const track = root.querySelector('.carousel-track');
    const prev = root.querySelector('.prev');
    const next = root.querySelector('.next');

    // Mostrar flechas solo si hay más de 5 logos
    const items = track.querySelectorAll('.alianza-item');
    const showArrows = items.length > 5;
    prev.style.display = next.style.display = showArrows ? 'block' : 'none';

    const pageScroll = () => track.clientWidth * 0.9;

    prev.addEventListener('click', () => {
        track.scrollBy({ left: -pageScroll(), behavior: 'smooth' });
    });
    next.addEventListener('click', () => {
        track.scrollBy({ left: pageScroll(), behavior: 'smooth' });
    });

    // Accesibilidad con teclado dentro del carrusel
    track.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') prev.click();
        if (e.key === 'ArrowRight') next.click();
    });

    // Opcional: snap al item más cercano después de scroll
    let snapTimeout;
    track.addEventListener('scroll', () => {
        clearTimeout(snapTimeout);
        snapTimeout = setTimeout(() => {
            // elegir el item más cercano al borde izquierdo
            const { left } = track.getBoundingClientRect();
            let best = null, bestDist = Infinity;
            items.forEach(it => {
                const dist = Math.abs(it.getBoundingClientRect().left - left);
                if (dist < bestDist) { bestDist = dist; best = it; }
            });
            if (best) best.scrollIntoView({ behavior: 'smooth', inline: 'start' });
        }, 120);
    }, { passive: true });
}

// Stepper automático cada 3 s (cíclico correcto)
(function () {
  const stepsWrap = document.querySelector('.how-it-works .steps');
  if (!stepsWrap) return;
  const steps = [...stepsWrap.querySelectorAll('.step')];
  const total = steps.length;
  let index = 0;
  let timer = null;
  let started = false;

  function clearAll() {
    steps.forEach(s => s.classList.remove('active', 'completed'));
  }

  function showStep(i) {
    clearAll();
    steps[i].classList.add('active');
    const progress = (i / (total - 1)) * 100;
    stepsWrap.style.setProperty('--progress', progress);
    setTimeout(() => {
      steps[i].classList.remove('active');
      steps[i].classList.add('completed');
    }, 1000);
  }

  function cycleSteps() {
    showStep(index);
    index = (index + 1) % total; // al llegar al último, vuelve a 0
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !started) {
        started = true;
        cycleSteps();
        timer = setInterval(cycleSteps, 3000);
      }
    });
  }, { threshold: 0.3 });

  io.observe(stepsWrap);

  window.addEventListener('beforeunload', () => clearInterval(timer));
})();

