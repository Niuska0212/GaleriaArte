// Define la URL base de tu API, apuntando al único punto de entrada (index.php)
const BASE_API_ENTRYPOINT = 'backend/index.php'; // Ruta relativa desde la raíz del proyecto

$(document).ready(function() {
    console.log("profile.js cargado.");

    const $profileContent = $('#profileContent');
    const $favoriteArtworks = $('#favoriteArtworks');
    const $profileMessage = $('#profileMessage');
    const $logoutButton = $('#logoutButton');

    // --- Función para mostrar mensajes ---
    function showMessage(element, message, type = 'error') {
        element.text(message).removeClass('success error').addClass(type).fadeIn(300);
        setTimeout(() => {
            element.fadeOut(300, function() {
                $(this).empty();
            });
        }, 5000);
    }

    // --- Verificar si el usuario está logueado ---
    function checkLoginStatus() {
        const userToken = localStorage.getItem('userToken');
        if (!userToken) {
            showMessage($profileMessage, 'No has iniciado sesión. Redirigiendo...', 'error');
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }

    // --- Cargar datos del perfil del usuario ---
    async function loadUserProfile() {
        if (!checkLoginStatus()) {
            return;
        }

        const userId = localStorage.getItem('userId');
        const userToken = localStorage.getItem('userToken');

        if (!userId || !userToken) {
            showMessage($profileMessage, 'Datos de usuario incompletos. Por favor, inicia sesión de nuevo.', 'error');
            window.location.href = 'login.html';
            return;
        }

        $profileContent.html('<p>Cargando información del perfil...</p>');
        $favoriteArtworks.html('<p class="loading-message">Cargando obras favoritas...</p>');

        try {
            // Apunta al único punto de entrada y especifica el recurso
            const userResponse = await fetch(`${BASE_API_ENTRYPOINT}?resource=users&id=${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + userToken
                }
            });

            const userData = await userResponse.json();

            if (userResponse.ok) {
                $profileContent.html(`
                    <p><strong>Nombre de Usuario:</strong> ${userData.username}</p>
                    <p><strong>Email:</strong> ${userData.email}</p>
                    <p><strong>Miembro desde:</strong> ${new Date(userData.created_at).toLocaleDateString()}</p>
                `);

                // Apunta al único punto de entrada y especifica el recurso
                const favoritesResponse = await fetch(`${BASE_API_ENTRYPOINT}?resource=users&action=favorites&id=${userId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + userToken
                    }
                });

                const favoriteData = await favoritesResponse.json();

                if (favoritesResponse.ok && favoriteData.length > 0) {
                    renderFavoriteArtworks(favoriteData);
                } else {
                    $favoriteArtworks.html('<p class="loading-message">Aún no tienes obras favoritas.</p>');
                }

            } else {
                showMessage($profileMessage, userData.message || 'Error al cargar el perfil.', 'error');
                if (userResponse.status === 401 || userResponse.status === 403) {
                    handleLogout();
                }
            }
        } catch (error) {
            console.error('Error de red o del servidor al cargar el perfil:', error);
            showMessage($profileMessage, 'Error de conexión. Inténtalo de nuevo más tarde.', 'error');
        }
    }

    // --- Función para renderizar obras favoritas ---
    function renderFavoriteArtworks(artworksToDisplay) {
        $favoriteArtworks.empty();

        $.each(artworksToDisplay, function(index, artwork) {
            const artworkCard = `
                <div class="artwork-card" data-id="${artwork.id}">
                    <img src="${artwork.image_url}" alt="${artwork.title}" onerror="this.onerror=null;this.src='https://placehold.co/400x250/cccccc/333333?text=Obra+no+disponible';">
                    <div class="artwork-info">
                        <h3>${artwork.title}</h3>
                        <p>${artwork.artist_name}</p>
                        <div class="artwork-actions">
                            <button class="action-button remove-favorite-button" data-artwork-id="${artwork.id}">🗑️ Quitar</button>
                        </div>
                    </div>
                </div>
            `;
            $(artworkCard).hide().appendTo($favoriteArtworks).fadeIn(500 + (index * 100));
        });

        $favoriteArtworks.off('click', '.remove-favorite-button').on('click', '.remove-favorite-button', async function() { // Usar off() para evitar duplicados
            const artworkId = $(this).data('artwork-id');
            const userId = localStorage.getItem('userId');
            const userToken = localStorage.getItem('userToken');

            if (!confirm('¿Estás seguro de que quieres quitar esta obra de tus favoritos?')) {
                return;
            }

            try {
                // Apunta al único punto de entrada y especifica el recurso
                const response = await fetch(`${BASE_API_ENTRYPOINT}?resource=users`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + userToken
                    },
                    body: JSON.stringify({ action: 'remove_favorite', userId: userId, artworkId: artworkId })
                });

                const data = await response.json();

                if (response.ok) {
                    showMessage($profileMessage, data.message, 'success');
                    loadUserProfile();
                } else {
                    showMessage($profileMessage, data.message || 'Error al quitar de favoritos.', 'error');
                }
            } catch (error) {
                console.error('Error al quitar de favoritos:', error);
                showMessage($profileMessage, 'Error de conexión al quitar de favoritos.', 'error');
            }
        });
    }

    // --- Manejo del botón de Cerrar Sesión ---
    function handleLogout() {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');

        showMessage($profileMessage, 'Sesión cerrada exitosamente. Redirigiendo...', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    }

    $logoutButton.on('click', handleLogout);

    // --- Inicializar la carga del perfil al cargar la página ---
    loadUserProfile();
});
