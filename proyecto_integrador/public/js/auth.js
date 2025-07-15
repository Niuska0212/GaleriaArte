// public/js/auth.js
document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showLogin = document.getElementById('showLogin');
    const showRegister = document.getElementById('showRegister');
    const loginMessage = document.getElementById('loginMessage');
    const registerMessage = document.getElementById('registerMessage');
    
    // Mostrar formulario de login
    showLogin.addEventListener('click', function(e) {
        e.preventDefault();
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        showLogin.classList.add('active');
        showRegister.classList.remove('active');
        loginMessage.textContent = '';
        registerMessage.textContent = '';
    });
    
    // Mostrar formulario de registro
    showRegister.addEventListener('click', function(e) {
        e.preventDefault();
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
        showRegister.classList.add('active');
        showLogin.classList.remove('active');
        loginMessage.textContent = '';
        registerMessage.textContent = '';
    });
    
    // Manejar login
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        
        // Validación básica
        if (!username || !password) {
            showError(loginMessage, 'Todos los campos son obligatorios');
            return;
        }
        
        try {
            const response = await fetch('/backend/api/auth.php?action=login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });
            
            const data = await response.json();
            
            if (!data.success) {
                showError(loginMessage, data.message);
                return;
            }
            
            // Login exitoso - redirigir o actualizar UI
            showSuccess(loginMessage, 'Inicio de sesión exitoso');
            
            // Redirigir después de 1 segundo
            setTimeout(() => {
                const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || 'index.html';
                window.location.href = redirectUrl;
            }, 1000);
            
        } catch (error) {
            console.error('Error:', error);
            showError(loginMessage, 'Error al conectar con el servidor');
        }
    });
    
    // Manejar registro
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        
        // Validaciones
        if (!username || !email || !password || !confirmPassword) {
            showError(registerMessage, 'Todos los campos son obligatorios');
            return;
        }
        
        if (password !== confirmPassword) {
            showError(registerMessage, 'Las contraseñas no coinciden');
            return;
        }
        
        if (password.length < 6) {
            showError(registerMessage, 'La contraseña debe tener al menos 6 caracteres');
            return;
        }
        
        if (!validateEmail(email)) {
            showError(registerMessage, 'Ingresa un email válido');
            return;
        }
        
        try {
            const response = await fetch('/backend/api/auth.php?action=register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    email: email,
                    password: password
                })
            });
            
            const data = await response.json();
            
            if (!data.success) {
                showError(registerMessage, data.message);
                return;
            }
            
            // Registro exitoso - mostrar mensaje y cambiar a login
            showSuccess(registerMessage, 'Registro exitoso. Por favor inicia sesión.');
            
            // Cambiar al formulario de login después de 2 segundos
            setTimeout(() => {
                loginForm.classList.add('active');
                registerForm.classList.remove('active');
                showLogin.classList.add('active');
                showRegister.classList.remove('active');
                registerMessage.textContent = '';
                
                // Rellenar los campos de login
                document.getElementById('loginUsername').value = username;
                document.getElementById('loginPassword').value = password;
            }, 2000);
            
        } catch (error) {
            console.error('Error:', error);
            showError(registerMessage, 'Error al conectar con el servidor');
        }
    });
    
    // Funciones auxiliares
    function showError(element, message) {
        element.textContent = message;
        element.className = 'message-area error';
    }
    
    function showSuccess(element, message) {
        element.textContent = message;
        element.className = 'message-area success';
    }
    
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    // Verificar si hay parámetros de redirección para mostrar login/register
    const urlParams = new URLSearchParams(window.location.search);
    const show = urlParams.get('show');
    
    if (show === 'register') {
        showRegister.click();
    }
});