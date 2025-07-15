document.addEventListener('DOMContentLoaded', function() {
    // Elementos comunes
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showLogin = document.getElementById('showLogin');
    const showRegister = document.getElementById('showRegister');
    const loginMessage = document.getElementById('loginMessage');
    const registerMessage = document.getElementById('registerMessage');
    
    // Elementos específicos de login
    const loginUsername = document.getElementById('loginUsername');
    const loginPassword = document.getElementById('loginPassword');
    
    // Elementos específicos de registro
    const registerUsername = document.getElementById('registerUsername');
    const registerEmail = document.getElementById('registerEmail');
    const registerPassword = document.getElementById('registerPassword');
    const registerConfirmPassword = document.getElementById('registerConfirmPassword');
    
    // Toggle entre formularios
    if (showLogin && showRegister) {
        showLogin.addEventListener('click', function(e) {
            e.preventDefault();
            loginForm.classList.add('active');
            registerForm.classList.remove('active');
            showLogin.classList.add('active');
            showRegister.classList.remove('active');
        });
        
        showRegister.addEventListener('click', function(e) {
            e.preventDefault();
            registerForm.classList.add('active');
            loginForm.classList.remove('active');
            showRegister.classList.add('active');
            showLogin.classList.remove('active');
        });
    }
    
    // Manejar login
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = loginUsername.value.trim();
            const password = loginPassword.value.trim();
            
            if (!username || !password) {
                showMessage(loginMessage, 'Por favor completa todos los campos', 'error');
                return;
            }
            
            try {
                const response = await fetch('/backend/api/auth.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'login',
                        username: username,
                        password: password
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // Guardar token y datos de usuario
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    
                    showMessage(loginMessage, data.message, 'success');
                    
                    // Redirigir después de 1 segundo
                    setTimeout(() => {
                        const urlParams = new URLSearchParams(window.location.search);
                        const redirect = urlParams.get('redirect') || 'index.html';
                        window.location.href = redirect;
                    }, 1000);
                } else {
                    showMessage(loginMessage, data.message, 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showMessage(loginMessage, 'Error de conexión con el servidor', 'error');
            }
        });
    }
    
    // Manejar registro
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = registerUsername.value.trim();
            const email = registerEmail.value.trim();
            const password = registerPassword.value.trim();
            const confirmPassword = registerConfirmPassword.value.trim();
            
            // Validaciones
            if (!username || !email || !password || !confirmPassword) {
                showMessage(registerMessage, 'Por favor completa todos los campos', 'error');
                return;
            }
            
            if (password !== confirmPassword) {
                showMessage(registerMessage, 'Las contraseñas no coinciden', 'error');
                return;
            }
            
            if (password.length < 6) {
                showMessage(registerMessage, 'La contraseña debe tener al menos 6 caracteres', 'error');
                return;
            }
            
            try {
                const response = await fetch('/backend/api/auth.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'register',
                        username: username,
                        email: email,
                        password: password
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showMessage(registerMessage, data.message, 'success');
                    
                    // Limpiar formulario
                    registerForm.reset();
                    
                    // Cambiar a pestaña de login después de 2 segundos
                    setTimeout(() => {
                        if (showLogin && showRegister) {
                            showLogin.click();
                        }
                    }, 2000);
                } else {
                    showMessage(registerMessage, data.message, 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showMessage(registerMessage, 'Error de conexión con el servidor', 'error');
            }
        });
    }
    
    // Verificar si hay un token válido al cargar la página
    checkAuthStatus();
    
    // Cerrar sesión
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'index.html';
        });
    }
    
    // Función para mostrar mensajes
    function showMessage(element, message, type) {
        if (!element) return;
        
        element.textContent = message;
        element.className = `message ${type}`;
        element.style.display = 'block';
        
        setTimeout(() => {
            element.style.display = 'none';
        }, 3000);
    }
    
    // Verificar estado de autenticación
    function checkAuthStatus() {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        const loginLink = document.getElementById('login-link');
        const profileLink = document.getElementById('profile-link');
        const uploadLink = document.getElementById('upload-link');
        
        if (token && user) {
            // Usuario autenticado
            if (loginLink) loginLink.style.display = 'none';
            if (profileLink) profileLink.style.display = 'block';
            if (uploadLink) uploadLink.style.display = 'block';
        } else {
            // Usuario no autenticado
            if (loginLink) loginLink.style.display = 'block';
            if (profileLink) profileLink.style.display = 'none';
            if (uploadLink) uploadLink.style.display = 'none';
        }
    }
});