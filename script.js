// CONFIGURACIÓN SUPABASE - REEMPLAZAR CON TUS PROPIAS CREDENCIALES
const SUPABASE_URL = 'https://mogtzwibejrrlpwdghop.supabase.co'; // Reemplazar con tu URL de Supabase
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vZ3R6d2liZWpycmxwd2RnaG9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMTY5MjMsImV4cCI6MjA3NDY5MjkyM30.bfI6lV2ON6RSM8sPybC25dup-oYDfpLVcsDVEP2nObw'; // Reemplazar con tu clave anónima de Supabase

// Lista de emails administradores
const ADMIN_EMAILS = ["tomas.yevenesc@gmail.com"];

// Variables globales
let supabase;
let currentUser = null;
let capsulesData = [];

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async function () {
    await initSupabase();
    initEventListeners();
    checkAuthState();
    loadCapsules();
    initFAQ();
    initScrollEffects();
});

// Inicializar cliente Supabase
async function initSupabase() {
    try {
        // Importar dinámicamente el cliente Supabase
        const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');

        // Crear cliente
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

    // Formulario de subida de cápsulas
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

// Cargar cápsulas desde Supabase
async function loadCapsules() {
    const capsulesGrid = document.getElementById('capsulas-grid');

    try {
        // Mostrar estado de carga
        capsulesGrid.innerHTML = '<div class="loading">Cargando cápsulas...</div>';

        // Intentar cargar desde la tabla capsules
        let { data: capsules, error } = await supabase
            .from('capsules')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.warn('No se pudo cargar desde la tabla capsules, usando datos de ejemplo:', error);
            capsules = getMockCapsulas();
        }

        // Si no hay cápsulas, usar datos de ejemplo
        if (!capsules || capsules.length === 0) {
            capsules = getMockCapsulas();
        }

        capsulesData = capsules;
        renderCapsules(capsules);

    } catch (error) {
        console.error('Error cargando cápsulas:', error);
        capsulesData = getMockCapsulas();
        renderCapsules(capsulesData);
        showToast('Usando datos de ejemplo', 'info');
    }
}

// Obtener cápsulas de ejemplo (mock)
function getMockCapsulas() {
    return [];
}

// Renderizar cápsulas en el grid
// Actualiza la función renderCapsules:
function renderCapsules(capsules) {
    const capsulesGrid = document.getElementById('capsulas-grid');

    if (!capsulesGrid) return;

    if (capsules.length === 0) {
        capsulesGrid.innerHTML = '<div class="loading">No se encontraron cápsulas que coincidan con tu búsqueda</div>';
        return;
    }

    capsulesGrid.innerHTML = capsules.map(capsule => {
        const isVideo = capsule.file_type === 'video' ||
            (capsule.public_url && /\.(mp4|mov|avi)$/i.test(capsule.public_url));

        return `
        <div class="capsula-card" data-category="${capsule.category}">
            <div class="capsula-image">
                ${isVideo ? '🎥' : getCategoryIcon(capsule.category)}
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
                                data-video-url="${capsule.public_url}">
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

    // Agregar event listeners para los botones de video
    document.querySelectorAll('.play-video-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const videoUrl = this.getAttribute('data-video-url');
            openVideoModal(videoUrl);
        });
    });

    // Aplicar animaciones
    setTimeout(() => {
        animateOnScroll();
    }, 100);
}

// Función para abrir modal de video
function openVideoModal(videoUrl) {
    // Crear modal de video
    const videoModal = document.createElement('div');
    videoModal.className = 'modal active';
    videoModal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <button class="modal-close" onclick="this.parentElement.parentElement.remove()">×</button>
            <div class="video-container">
                <video controls style="width: 100%; border-radius: 8px;">
                    <source src="${videoUrl}" type="video/mp4">
                    Tu navegador no soporta el elemento de video.
                </video>
            </div>
            <div style="text-align: center; margin-top: 1rem;">
                <a href="${videoUrl}" class="btn btn-outline" download>Descargar Video</a>
            </div>
        </div>
    `;

    document.body.appendChild(videoModal);

    // Cerrar modal al hacer clic fuera
    videoModal.addEventListener('click', (e) => {
        if (e.target === videoModal) {
            videoModal.remove();
        }
    });
}

// Obtener icono por categoría
function getCategoryIcon(category) {
    const icons = {
        'educacion_fisica': '💪',
        'salud_mental': '🧠',
        'medicina': '🩺'
    };

    return icons[category] || '📄';
}

// Obtener nombre legible de categoría
function getCategoryName(category) {
    const names = {
        'educacion_fisica': 'Educación Física',
        'salud_mental': 'Salud Mental',
        'medicina': 'Medicina'
    };

    return names[category] || category;
}

// Filtrar cápsulas
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
function handleContact(e) {
    e.preventDefault();

    // Mostrar estado de carga
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Enviando...';
    submitBtn.disabled = true;

    // Simular envío (en una implementación real, aquí se enviaría a un backend)
    setTimeout(() => {
        showToast('Mensaje enviado correctamente. Te contactaremos pronto.', 'success');
        e.target.reset();

        // Restaurar botón
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }, 1500);
}

// Manejar subida de cápsula
// Reemplaza la función handleUpload actual con esta versión mejorada:
async function handleUpload(e) {
    e.preventDefault();

    if (!currentUser) {
        showToast('Debes iniciar sesión para subir cápsulas', 'error');
        return;
    }

    const title = document.getElementById('capsule-title').value;
    const category = document.getElementById('capsule-category').value;
    const description = document.getElementById('capsule-description').value;
    const duration = document.getElementById('capsule-duration').value;
    const fileInput = document.getElementById('capsule-file');
    const file = fileInput.files[0];

    if (!file) {
        showToast('Selecciona un archivo', 'error');
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

    const maxSize = 100 * 1024 * 1024; // 100MB máximo para videos

    if (!allowedTypes.includes(file.type)) {
        showToast('Tipo de archivo no permitido. Usa PDF, MP4, MOV, AVI, JPG o PNG.', 'error');
        return;
    }

    if (file.size > maxSize) {
        showToast('El archivo es demasiado grande. Máximo 100MB.', 'error');
        return;
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

        // Subir archivo a Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('capsulas')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            throw uploadError;
        }

        // Obtener URL pública
        const { data: urlData } = supabase.storage
            .from('capsulas')
            .getPublicUrl(filePath);

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
                    file_type: contentType,
                    file_size: file.size,
                    owner: currentUser.id
                }
            ])
            .select();

        if (capsuleError) {
            throw capsuleError;
        }

        // Actualizar lista de cápsulas
        loadCapsules();
        loadUserFiles();

        // Limpiar formulario
        e.target.reset();

        showToast('Cápsula subida correctamente', 'success');

    } catch (error) {
        console.error('Error subiendo cápsula:', error);
        showToast('Error al subir cápsula: ' + error.message, 'error');
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
            filesList.innerHTML = '<p>No has subido ninguna cápsula aún.</p>';
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
supabase?.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
        currentUser = session.user;
        updateUIForAuthenticatedUser();
    } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        updateUIForUnauthenticatedUser();
    }
});

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

// Llama a esta función en initEventListeners()