$(document).ready(function() {
    console.log("auth.js cargado.");

    // --- Variables DOM ---
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
        }, 5000); // El mensaje desaparece después de 5 segundos
    }

    // --- Alternar entre formularios de Login y Registro ---
    $showLoginButton.on('click', function() {
        $loginForm.removeClass('hidden').addClass('active').show();
        $registerForm.removeClass('active').addClass('hidden').hide();
        $showLoginButton.addClass('active');
        $showRegisterButton.removeClass('active');
        $loginMessage.empty(); // Limpiar mensajes al cambiar
        $registerMessage.empty();
    });

    $showRegisterButton.on('click', function() {
        $registerForm.removeClass('hidden').addClass('active').show();
        $loginForm.removeClass('active').addClass('hidden').hide();
        $showRegisterButton.addClass('active');
        $showLoginButton.removeClass('active');
        $loginMessage.empty(); // Limpiar mensajes al cambiar
        $registerMessage.empty();
    });

    // --- Manejo del Formulario de Registro ---
    $registerForm.on('submit', async function(event) {
        event.preventDefault(); // Previene el envío tradicional del formulario

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

        // Deshabilitar botón y mostrar carga
        const $submitButton = $(this).find('button[type="submit"]');
        $submitButton.prop('disabled', true).text('Registrando...');
        $registerMessage.empty();

        try {
            const response = await fetch('backend/api/auth.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'register', // Indicar al backend que es una acción de registro
                    username: username,
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (response.ok) { // Si la respuesta HTTP es 2xx
                showMessage($registerMessage, data.message, 'success');
                // Opcional: Redirigir al login o iniciar sesión automáticamente
                setTimeout(() => {
                    $showLoginButton.trigger('click'); // Cambiar al formulario de login
                    $('#loginUsername').val(username); // Rellenar username para facilitar el login
                }, 2000);
            } else {
                // Si la respuesta HTTP es un error (4xx, 5xx)
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
        event.preventDefault(); // Previene el envío tradicional del formulario

        const username = $('#loginUsername').val();
        const password = $('#loginPassword').val();

        // Deshabilitar botón y mostrar carga
        const $submitButton = $(this).find('button[type="submit"]');
        $submitButton.prop('disabled', true).text('Iniciando Sesión...');
        $loginMessage.empty();

        try {
            const response = await fetch('backend/api/auth.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'login', // Indicar al backend que es una acción de login
                    username: username,
                    password: password
                })
            });

            const data = await response.json();

            if (response.ok) { // Si la respuesta HTTP es 2xx
                showMessage($loginMessage, data.message, 'success');
                // Guardar el token de autenticación y el ID de usuario en localStorage
                localStorage.setItem('userToken', data.token);
                localStorage.setItem('userId', data.user.id);
                localStorage.setItem('username', data.user.username); // Opcional: guardar username para mostrar en perfil

                // Redirigir al perfil o a la página principal
                setTimeout(() => {
                    window.location.href = 'profile.html'; // Redirigir al perfil
                }, 1500);
            } else {
                // Si la respuesta HTTP es un error (4xx, 5xx)
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
