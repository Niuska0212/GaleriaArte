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
            // Si no hay token, redirigir inmediatamente al login
            showMessage($profileMessage, 'No has iniciado sesión. Redirigiendo...', 'error');
            window.location.href = 'login.html'; // Redirección inmediata
            return false; // Detener la ejecución de la función loadUserProfile
        }
        return true;
    }

    // --- Cargar datos del perfil del usuario ---
    async function loadUserProfile() {
        // Si checkLoginStatus() devuelve false (no logueado), no continuar con la carga del perfil
        if (!checkLoginStatus()) {
            return;
        }

        const userId = localStorage.getItem('userId');
        const userToken = localStorage.getItem('userToken');

        if (!userId || !userToken) {
            // Esto debería ser capturado por checkLoginStatus, pero es una doble verificación
            showMessage($profileMessage, 'Datos de usuario incompletos. Por favor, inicia sesión de nuevo.', 'error');
            window.location.href = 'login.html'; // Redirección inmediata
            return;
        }

        $profileContent.html('<p>Cargando información del perfil...</p>');
        $favoriteArtworks.html('<p class="loading-message">Cargando obras favoritas...</p>');

        try {
            // Petición para obtener datos del usuario (ruta relativa)
            const userResponse = await fetch(`backend/api/users.php?id=${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + userToken // Enviar el token en la cabecera Authorization
                }
            });

            const userData = await userResponse.json();

            if (userResponse.ok) {
                // Mostrar información del perfil
                $profileContent.html(`
                    <p><strong>Nombre de Usuario:</strong> ${userData.username}</p>
                    <p><strong>Email:</strong> ${userData.email}</p>
                    <p><strong>Miembro desde:</strong> ${new Date(userData.created_at).toLocaleDateString()}</p>
                `);

                // Petición para obtener obras favoritas (ruta relativa)
                const favoritesResponse = await fetch(`backend/api/users.php?action=favorites&id=${userId}`, {
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
                // Si el token es inválido o expirado, forzar logout
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
        $favoriteArtworks.empty(); // Limpia antes de añadir

        $.each(artworksToDisplay, function(index, artwork) {
            const artworkCard = `
                <div class="artwork-card" data-id="${artwork.id}">
                    <img src="${artwork.image_url}" alt="${artwork.title}" onerror="this.onerror=null;this.src='https://placehold.co/400x250/cccccc/333333?text=Obra+no+disponible';">
                    <div class="artwork-info">
                        <h3>${artwork.title}</h3>
                        <p>${artwork.artist_name}</p>
                        <div class="artwork-actions">
                            <!-- Puedes añadir un botón para quitar de favoritos aquí -->
                            <button class="action-button remove-favorite-button" data-artwork-id="${artwork.id}">🗑️ Quitar</button>
                        </div>
                    </div>
                </div>
            `;
            $(artworkCard).hide().appendTo($favoriteArtworks).fadeIn(500 + (index * 100));
        });

        // Event listener para quitar favoritos (ejemplo, necesitará backend)
        $favoriteArtworks.on('click', '.remove-favorite-button', async function() {
            const artworkId = $(this).data('artwork-id');
            const userId = localStorage.getItem('userId');
            const userToken = localStorage.getItem('userToken');

            if (!confirm('¿Estás seguro de que quieres quitar esta obra de tus favoritos?')) {
                return;
            }

            try {
                const response = await fetch(`backend/api/users.php`, { // Usamos el endpoint de users para favoritos (ruta relativa)
                    method: 'POST', // O DELETE si tu API lo soporta
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + userToken
                    },
                    body: JSON.stringify({ action: 'remove_favorite', userId: userId, artworkId: artworkId })
                });

                const data = await response.json();

                if (response.ok) {
                    showMessage($profileMessage, data.message, 'success');
                    loadUserProfile(); // Recargar el perfil para actualizar la lista
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
        localStorage.removeItem('username'); // Limpiar todos los datos de sesión

        showMessage($profileMessage, 'Sesión cerrada exitosamente. Redirigiendo...', 'success');
        setTimeout(() => {
            window.location.href = 'index.html'; // Redirigir a la página principal
        }, 1500);
    }

    $logoutButton.on('click', handleLogout);

    // --- Inicializar la carga del perfil al cargar la página ---
    loadUserProfile();
});
