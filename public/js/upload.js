// Define la URL base de tu API, apuntando al único punto de entrada (index.php)
const BASE_API_ENTRYPOINT = '../backend/index.php'; // Ruta relativa desde la raíz del proyecto

// El código se ejecutará una vez que el DOM esté listo, gracias al atributo 'defer' en la etiqueta script.
console.log("upload.js cargado.");

const $uploadForm = $('#uploadForm');
const $uploadMessage = $('#uploadMessage');
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
    showMessageInModal('Sesión cerrada exitosamente.', 'success'); // Usar función de mensaje
    setTimeout(() => {
        window.location.href = 'index.html'; // Redirigir
    }, 1500);
}

// --- Función genérica para mostrar mensajes (reemplazo de alert) ---
function showMessageInModal(message, type = 'info') {
    let $messageDiv = $('#globalMessageModal');
    if ($messageDiv.length === 0) {
        $messageDiv = $('<div id="globalMessageModal" style="position: fixed; top: 20px; left: 50%; transform: translateX(-50%); padding: 15px 30px; border-radius: 8px; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: none; font-weight: bold;"></div>');
        $('body').append($messageDiv);
    }
    $messageDiv.text(message).removeClass('success error info').addClass(type);

    if (type === 'success') {
        $messageDiv.css({'background-color': '#d4edda', 'color': '#155724', 'border': '1px solid #c3e6cb'});
    } else if (type === 'error') {
        $messageDiv.css({'background-color': '#f8d7da', 'color': '#721c24', 'border': '1px solid #f5c6cb'});
    } else { // info
        $messageDiv.css({'background-color': '#e2e3e5', 'color': '#383d41', 'border': '1px solid #d6d8db'});
    }

    $messageDiv.fadeIn(300);
    setTimeout(() => {
        $messageDiv.fadeOut(300, function() {
            $(this).empty();
        });
    }, 3000);
}

// --- Función para mostrar mensajes en el formulario específico ---
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
    throw new Error("Usuario no autenticado. Redirigiendo a la página de login.");
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

updateAuthNav(); // Llama al cargar la página para establecer el estado inicial del botón
