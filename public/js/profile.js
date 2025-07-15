
const BASE_API_ENTRYPOINT = '../backend/index.php'; 

$(document).ready(function() {
    console.log("profile.js cargado.");

    const $profileContent = $('#profileContent');
    const $favoriteArtworks = $('#favoriteArtworks');
    const $uploadedArtworks = $('#uploadedArtworks'); // Nuevo: Contenedor para obras subidas
    const $profileMessage = $('#profileMessage');
    const $logoutButton = $('#logoutButton');
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
        // Reemplazar alert con un modal o mensaje en el DOM para producción
        // alert('Sesión cerrada exitosamente.');
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

    // --- Cargar datos del perfil del usuario y sus obras ---
    async function loadUserProfile() {
        if (!checkLoginStatus()) {
            return;
        }

        const userId = localStorage.getItem('userId');
        const userToken = localStorage.getItem('userToken');
        const username = localStorage.getItem('username'); // Obtener el username para mostrar

        if (!userId || !userToken) {
            showMessage($profileMessage, 'Datos de usuario incompletos. Por favor, inicia sesión de nuevo.', 'error');
            window.location.href = 'login.html';
            return;
        }

        // Mostrar datos básicos del perfil
        $('#profileUsername').text(username || 'N/A');
        $('#profileEmail').text('Cargando...');
        $('#profileMemberSince').text('Cargando...');

        $profileContent.find('p').css('opacity', 0.5); // Efecto de carga
        $favoriteArtworks.html('<p class="loading-message">Cargando obras favoritas...</p>');
        $uploadedArtworks.html('<p class="loading-message">Cargando obras subidas...</p>');

        try {
            // Petición para obtener datos del usuario
            const userResponse = await fetch(`${BASE_API_ENTRYPOINT}?resource=users&id=${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + userToken
                }
            });

            const userData = await userResponse.json();

            if (userResponse.ok) {
                $('#profileUsername').text(userData.username);
                $('#profileEmail').text(userData.email);
                $('#profileMemberSince').text(new Date(userData.created_at).toLocaleDateString());
                $profileContent.find('p').css('opacity', 1); // Restaurar opacidad

                // Petición para obtener obras favoritas
                const favoritesResponse = await fetch(`${BASE_API_ENTRYPOINT}?resource=users&action=favorites&id=${userId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + userToken
                    }
                });
                const favoriteData = await favoritesResponse.json();
                renderArtworksInGrid($favoriteArtworks, favoriteData, 'favorite'); // Usar la función genérica

                // Petición para obtener obras subidas por el usuario
                const uploadedResponse = await fetch(`${BASE_API_ENTRYPOINT}?resource=users&action=uploaded_artworks&id=${userId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + userToken
                    }
                });
                const uploadedData = await uploadedResponse.json();
                renderArtworksInGrid($uploadedArtworks, uploadedData, 'uploaded'); // Usar la función genérica

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

    // --- Función genérica para renderizar obras en una cuadrícula (tipo Pinterest) ---
    function renderArtworksInGrid(containerElement, artworksToDisplay, type) {
        containerElement.empty(); // Limpia antes de añadir

        if (!artworksToDisplay || artworksToDisplay.length === 0) {
            containerElement.html(`<p class="loading-message">Aún no tienes obras ${type === 'favorite' ? 'favoritas' : 'subidas'}.</p>`);
            return;
        }

        $.each(artworksToDisplay, function(index, artwork) {
            const artworkCard = `
                <div class="artwork-card" data-id="${artwork.id}">
                    <img src="${artwork.image_url}" alt="${artwork.title}" onerror="this.onerror=null;this.src='https://placehold.co/200x${Math.floor(Math.random() * (300 - 150 + 1) + 150)}/cccccc/333333?text=Obra+no+disponible';">
                    <div class="artwork-info">
                        <h3>${artwork.title}</h3>
                        <p>${artwork.artist_name}</p>
                        ${type === 'favorite' ? `<div class="artwork-actions"><button class="action-button remove-favorite-button" data-artwork-id="${artwork.id}">🗑️ Quitar</button></div>` : ''}
                    </div>
                </div>
            `;
            $(artworkCard).hide().appendTo(containerElement).fadeIn(500 + (index * 50));
        });

        // Añadir event listener para quitar favoritos si es la sección de favoritos
        if (type === 'favorite') {
            containerElement.off('click', '.remove-favorite-button').on('click', '.remove-favorite-button', async function() {
                const artworkId = $(this).data('artwork-id');
                const userId = localStorage.getItem('userId');
                const userToken = localStorage.getItem('userToken');

                if (!confirm('¿Estás seguro de que quieres quitar esta obra de tus favoritos?')) {
                    return;
                }

                try {
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

        // Manejo de clic para ir al detalle de la obra desde las tarjetas
        containerElement.off('click', '.artwork-card').on('click', '.artwork-card', function(e) {
            // Evitar que el clic en el botón de quitar favorito también redirija
            if ($(e.target).hasClass('remove-favorite-button')) {
                return;
            }
            const artworkId = $(this).data('id');
            window.location.href = `artwork.html?id=${artworkId}`;
        });
    }

    // --- Manejo del botón de Cerrar Sesión (desde el perfil) ---
    $logoutButton.on('click', handleLogout);

    // --- Inicializar la carga del perfil al cargar la página ---
    loadUserProfile();
    updateAuthNav(); // Actualiza el estado del botón de login/logout al cargar
});
