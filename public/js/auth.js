// Define la URL base de tu API, apuntando al único punto de entrada (index.php)
const BASE_API_ENTRYPOINT = '../backend/index.php'; // Ruta relativa desde la raíz del proyecto

$(document).ready(function() {
    console.log("auth.js cargado.");

    const $loginForm = $('#loginForm');
    const $registerForm = $('#registerForm');
    const $loginMessage = $('#loginMessage');
    const $registerMessage = $('#registerMessage');
    const $showLoginButton = $('#showLogin');
    const $showRegisterButton = $('#showRegister');
    const $authNavLink = $('#authNavLink'); // Nuevo: Referencia al enlace de autenticación

    // --- Función para actualizar el enlace de navegación de autenticación ---
    function updateAuthNav() {
        const userToken = localStorage.getItem('userToken');
        if (userToken) {
            $authNavLink.text('Cerrar Sesión');
            $authNavLink.attr('href', '#');
            $authNavLink.off('click').on('click', function(e) {
                e.preventDefault();
                handleLogout();
            });
        } else {
            $authNavLink.text('Login / Registro');
            $authNavLink.attr('href', 'login.html');
            $authNavLink.off('click');
        }
    }

    // --- Función para manejar el cierre de sesión (centralizada) ---
    function handleLogout() {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        updateAuthNav(); // Actualiza la navegación
        alert('Sesión cerrada exitosamente.'); // Usar alert solo para depuración rápida, reemplazar con modal
        window.location.href = 'index.html'; // Redirigir
    }

    // --- Función para mostrar mensajes ---
    function showMessage(element, message, type = 'error') {
        element.text(message).removeClass('success error').addClass(type).fadeIn(300);
        setTimeout(() => {
            element.fadeOut(300, function() {
                $(this).empty();
            });
        }, 5000);
    }

    // --- Alternar entre formularios de Login y Registro ---
    $showLoginButton.on('click', function() {
        $loginForm.removeClass('hidden').addClass('active').show();
        $registerForm.removeClass('active').addClass('hidden').hide();
        $showLoginButton.addClass('active');
        $showRegisterButton.removeClass('active');
        $loginMessage.empty();
        $registerMessage.empty();
    });

    $showRegisterButton.on('click', function() {
        $registerForm.removeClass('hidden').addClass('active').show();
        $loginForm.removeClass('active').addClass('hidden').hide();
        $showRegisterButton.addClass('active');
        $showLoginButton.removeClass('active');
        $loginMessage.empty();
        $registerMessage.empty();
    });

    // --- Manejo del Formulario de Registro ---
    $registerForm.on('submit', async function(event) {
        event.preventDefault();

        const username = $('#registerUsername').val();
        const email = $('#registerEmail').val();
        const password = $('#registerPassword').val();
        const confirmPassword = $('#registerConfirmPassword').val();

        if (password !== confirmPassword) {
            showMessage($registerMessage, 'Las contraseñas no coinciden.', 'error');
            return;
        }

        if (password.length < 6) {
            showMessage($registerMessage, 'La contraseña debe tener al menos 6 caracteres.', 'error');
            return;
        }

        const $submitButton = $(this).find('button[type="submit"]');
        $submitButton.prop('disabled', true).text('Registrando...');
        $registerMessage.empty();

        try {
            const response = await fetch(`${BASE_API_ENTRYPOINT}?resource=auth`, {
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

            if (response.ok) {
                showMessage($registerMessage, data.message, 'success');
                setTimeout(() => {
                    $showLoginButton.trigger('click');
                    $('#loginUsername').val(username);
                }, 2000);
            } else {
                showMessage($registerMessage, data.message || 'Error en el registro.', 'error');
            }
        } catch (error) {
            console.error('Error de red o del servidor:', error);
            showMessage($registerMessage, 'Error de conexión. Inténtalo de nuevo más tarde.', 'error');
        } finally {
            $submitButton.prop('disabled', false).text('Registrarse');
        }
    });

    // --- Manejo del Formulario de Inicio de Sesión ---
    $loginForm.on('submit', async function(event) {
        event.preventDefault();

        const username = $('#loginUsername').val();
        const password = $('#loginPassword').val();

        const $submitButton = $(this).find('button[type="submit"]');
        $submitButton.prop('disabled', true).text('Iniciando Sesión...');
        $loginMessage.empty();

        try {
            const response = await fetch(`${BASE_API_ENTRYPOINT}?resource=auth`, {
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

            if (response.ok) {
                showMessage($loginMessage, data.message, 'success');
                localStorage.setItem('userToken', data.token);
                localStorage.setItem('userId', data.user.id);
                localStorage.setItem('username', data.user.username);

                updateAuthNav(); // Actualiza la navegación después de un login exitoso

                setTimeout(() => {
                    window.location.href = 'profile.html';
                }, 1500);
            } else {
                showMessage($loginMessage, data.message || 'Error al iniciar sesión.', 'error');
            }
        } catch (error) {
            console.error('Error de red o del servidor:', error);
            showMessage($loginMessage, 'Error de conexión. Inténtalo de nuevo más tarde.', 'error');
        } finally {
            $submitButton.prop('disabled', false).text('Iniciar Sesión');
        }
    });

    updateAuthNav(); // Llama al cargar la página para establecer el estado inicial del botón
});
