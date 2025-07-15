// Define la URL base de tu API, apuntando al único punto de entrada (index.php)
const BASE_API_ENTRYPOINT = 'backend/index.php'; // Ruta relativa desde la raíz del proyecto

$(document).ready(function() {
    console.log("auth.js cargado.");

    const $loginForm = $('#loginForm');
    const $registerForm = $('#registerForm');
    const $loginMessage = $('#loginMessage');
    const $registerMessage = $('#registerMessage');
    const $showLoginButton = $('#showLogin');
    const $showRegisterButton = $('#showRegister');

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
            // Apunta al único punto de entrada y especifica el recurso
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
            // Apunta al único punto de entrada y especifica el recurso
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
});
