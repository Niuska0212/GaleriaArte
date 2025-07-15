// Define la URL base de tu API, apuntando al único punto de entrada (index.php)
const BASE_API_ENTRYPOINT = 'backend/index.php'; // Ruta relativa desde la raíz del proyecto

$(document).ready(function() {
    console.log("upload.js cargado.");

    const $uploadForm = $('#uploadForm');
    const $uploadMessage = $('#uploadMessage');

    // --- Función para mostrar mensajes ---
    function showMessage(element, message, type = 'error') {
        element.text(message).removeClass('success error').addClass(type).fadeIn(300);
        setTimeout(() => {
            element.fadeOut(300, function() {
                $(this).empty();
            });
        }, 5000);
    }

    // --- Función para verificar el estado de login ---
    function isUserLoggedIn() {
        return localStorage.getItem('userToken') !== null && localStorage.getItem('userId') !== null;
    }

    // --- Redirigir si no está logueado ---
    if (!isUserLoggedIn()) {
        showMessage($uploadMessage, 'Debes iniciar sesión para subir obras. Redirigiendo...', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }

    // --- Manejo del Formulario de Subida ---
    $uploadForm.on('submit', async function(event) {
        event.preventDefault();

        const userId = localStorage.getItem('userId');
        const userToken = localStorage.getItem('userToken');

        if (!userId || !userToken) {
            showMessage($uploadMessage, 'Error de autenticación. Por favor, inicia sesión de nuevo.', 'error');
            return;
        }

        const formData = new FormData(this);
        formData.append('owner_id', userId);
        formData.append('action', 'upload_artwork');

        const $submitButton = $(this).find('button[type="submit"]');
        $submitButton.prop('disabled', true).text('Subiendo...');
        $uploadMessage.empty();

        try {
            // Apunta al único punto de entrada y especifica el recurso
            const response = await fetch(`${BASE_API_ENTRYPOINT}?resource=artworks`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + userToken
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                showMessage($uploadMessage, data.message, 'success');
                $uploadForm[0].reset();
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            } else {
                showMessage($uploadMessage, data.message || 'Error al subir la obra.', 'error');
            }
        } catch (error) {
            console.error('Error de red o del servidor:', error);
            showMessage($uploadMessage, 'Error de conexión. Inténtalo de nuevo más tarde.', 'error');
        } finally {
            $submitButton.prop('disabled', false).text('Subir Obra');
        }
    });
});
