// Define la URL base de tu API.
// Asegúrate de que esta URL coincida con la forma en que accedes a tu proyecto en XAMPP.
const BASE_API_URL = 'backend/api/'; // Ruta relativa desde la raíz del proyecto

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
        return; // Detener la ejecución del script
    }

    // --- Manejo del Formulario de Subida ---
    $uploadForm.on('submit', async function(event) {
        event.preventDefault(); // Previene el envío tradicional del formulario

        const userId = localStorage.getItem('userId');
        const userToken = localStorage.getItem('userToken');

        if (!userId || !userToken) {
            showMessage($uploadMessage, 'Error de autenticación. Por favor, inicia sesión de nuevo.', 'error');
            return;
        }

        // Crear un objeto FormData para enviar los datos del formulario, incluyendo el archivo
        const formData = new FormData(this);
        formData.append('owner_id', userId); // Añadir el ID del usuario logueado
        formData.append('action', 'upload_artwork'); // Indicar al backend la acción

        // Deshabilitar botón y mostrar carga
        const $submitButton = $(this).find('button[type="submit"]');
        $submitButton.prop('disabled', true).text('Subiendo...');
        $uploadMessage.empty();

        try {
            const response = await fetch(BASE_API_URL + 'artworks.php', {
                method: 'POST',
                // No es necesario establecer 'Content-Type' para FormData, el navegador lo hace automáticamente
                headers: {
                    'Authorization': 'Bearer ' + userToken // Enviar el token de autenticación
                },
                body: formData // Enviar el objeto FormData
            });

            const data = await response.json();

            if (response.ok) { // Si la respuesta HTTP es 2xx
                showMessage($uploadMessage, data.message, 'success');
                $uploadForm[0].reset(); // Limpiar el formulario
                // Opcional: Redirigir a la página de detalle de la obra subida o a la galería
                setTimeout(() => {
                    window.location.href = 'index.html'; // Redirigir a la galería
                }, 2000);
            } else {
                // Si la respuesta HTTP es un error (4xx, 5xx)
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
