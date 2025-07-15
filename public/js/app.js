// Define la URL base de tu API, apuntando al único punto de entrada (index.php)
// Ruta relativa: sube dos niveles (de js/ a public/, luego a la raíz del proyecto GaleriaArte/)
// y luego baja a backend/index.php
const BASE_API_ENTRYPOINT = '../backend/index.php';

$(document).ready(function() {
    console.log("app.js cargado. Conectando con el backend PHP a través de index.php.");

    const $gallery = $('#artworkGallery');
    const $searchInput = $('#searchInput');
    const $styleFilter = $('#styleFilter');
    const $artistFilter = $('#artistFilter');
    const $authNavLink = $('#authNavLink'); 

    // --- Función para actualizar el enlace de navegación de autenticación ---
    function updateAuthNav() {
        const userToken = localStorage.getItem('userToken');
        if (userToken) {
            $authNavLink.text('Cerrar Sesión');
            $authNavLink.attr('href', '#'); // Cambia el href a '#' o similar para manejar el clic con JS
            $authNavLink.off('click').on('click', function(e) { // Elimina listeners anteriores y añade uno nuevo
                e.preventDefault(); // Previene la navegación
                handleLogout();
            });
        } else {
            $authNavLink.text('Login / Registro');
            $authNavLink.attr('href', 'login.html');
            $authNavLink.off('click'); // Elimina cualquier listener de logout si no está logueado
        }
    }

    // --- Función para manejar el cierre de sesión ---
    function handleLogout() {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        updateAuthNav(); // Actualiza la navegación inmediatamente
        showMessageInModal('Sesión cerrada exitosamente.', 'success'); // Usar función de mensaje
        setTimeout(() => {
            window.location.href = 'index.html'; // Redirigir a la página principal
        }, 1500);
    }

    // --- Función genérica para mostrar mensajes (reemplazo de alert) ---
    function showMessageInModal(message, type = 'info') {
        // Implementación simple de un modal/mensaje en el DOM.
        // Para una aplicación real, usarías un div modal oculto que se muestra y oculta.
        console.log(`Mensaje (${type}): ${message}`);
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


    // --- Función para renderizar las obras de arte en la galería ---
    function renderArtworks(artworksToDisplay) {
        console.log("Artworks a mostrar:", artworksToDisplay); // DEBUG: Ver los datos recibidos
        $gallery.empty(); // Limpia la galería antes de añadir nuevas obras

        if (artworksToDisplay.length === 0) {
            $gallery.append('<p class="loading-message">No se encontraron obras de arte con los criterios seleccionados.</p>');
            return;
        }

        $.each(artworksToDisplay, function(index, artwork) {
            console.log("Procesando obra:", artwork.title, "URL de imagen:", artwork.image_url); // DEBUG: Ver cada obra y su URL
            const artworkCard = `
                <div class="artwork-card" data-id="${artwork.id}">
                    <img src="${artwork.image_url}" alt="${artwork.title}" onerror="this.onerror=null;this.src='https://placehold.co/400x250/cccccc/333333?text=Obra+no+disponible';">
                    <div class="artwork-info">
                        <h3>${artwork.title}</h3>
                        <p>${artwork.artist_name}</p>
                        <p class="artwork-style">${artwork.style || 'N/A'}</p>
                        <div class="artwork-actions">
                            <span class="like-count">❤️ ${artwork.like_count || 0}</span>
                            <!-- Los botones de like/guardar se manejarán en artworkDetail.js -->
                        </div>
                    </div>
                </div>
            `;
            // Añade la tarjeta con un efecto de fade-in para una animación suave
            $(artworkCard).hide().appendTo($gallery).fadeIn(500 + (index * 50)); // Retraso para efecto escalonado
        });
    }

    // --- Función asíncrona para cargar obras de arte desde el backend ---
    async function fetchArtworks(searchTerm = '', styleFilter = '', artistFilter = '') {
        $gallery.html('<p class="loading-message" style="text-align: center; padding: 50px;">Cargando obras de arte...</p>'); // Mensaje de carga

        let url = `${BASE_API_ENTRYPOINT}?resource=artworks`; // Apunta a index.php y especifica el recurso
        const params = new URLSearchParams();

        if (searchTerm) {
            params.append('search', searchTerm);
        }
        if (styleFilter) {
            params.append('style', styleFilter);
        }
        if (artistFilter) {
            params.append('artist', artistFilter);
        }

        if (params.toString()) {
            url += '&' + params.toString(); // Usa '&' porque 'resource' ya es el primer parámetro
        }

        console.log("URL de fetchArtworks:", url); // DEBUG: Ver la URL completa de la petición
        try {
            const response = await fetch(url);
            console.log("Respuesta HTTP de artworks:", response); // DEBUG: Ver el objeto de respuesta HTTP
            if (!response.ok) {
                // Si la respuesta no es OK (ej. 404, 500), intentar leer el error del JSON
                const errorData = await response.json().catch(() => ({ message: 'Error desconocido o respuesta no JSON.' }));
                throw new Error(errorData.message || `Error HTTP: ${response.status} ${response.statusText}`);
            }
            const artworks = await response.json();
            renderArtworks(artworks);
        } catch (error) {
            console.error('Error al cargar las obras de arte:', error);
            $gallery.html(`<p class="error-message" style="text-align: center; padding: 50px;">Error al cargar las obras: ${error.message}. Por favor, verifica la conexión al servidor y la ruta de las imágenes.</p>`);
        }
    }

    // --- Lógica de Búsqueda y Filtros ---
    $('#searchButton').on('click', function() {
        performSearchAndFilter();
    });

    $searchInput.on('keyup', function(event) {
        if (event.key === 'Enter') {
            performSearchAndFilter();
        }
    });

    $styleFilter.on('change', function() {
        performSearchAndFilter();
    });

    $artistFilter.on('change', function() {
        performSearchAndFilter();
    });

    function performSearchAndFilter() {
        const searchTerm = $searchInput.val();
        const selectedStyle = $styleFilter.val();
        const selectedArtist = $artistFilter.val();

        fetchArtworks(searchTerm, selectedStyle, selectedArtist);
    }

    // --- Manejo de Clic en Tarjetas de Obras (para ir a la página de detalle) ---
    // Usamos delegación de eventos para manejar clics en tarjetas creadas dinámicamente
    $gallery.on('click', '.artwork-card', function() {
        const artworkId = $(this).data('id');
        // Redirige a la página de detalle de la obra, pasando el ID en la URL
        window.location.href = `artwork.html?id=${artworkId}`;
    });

    // --- Función para cargar opciones de filtros dinámicamente (Estilos y Artistas) ---
    async function loadFilterOptions() {
        try {
            // Cargar estilos
            const stylesResponse = await fetch(`${BASE_API_ENTRYPOINT}?resource=artworks&action=get_styles`);
            const stylesData = await stylesResponse.json();
            if (stylesResponse.ok && stylesData.length > 0) {
                $styleFilter.empty().append('<option value="">Todos los Estilos</option>');
                $.each(stylesData, function(index, style) {
                    $styleFilter.append(`<option value="${style}">${style}</option>`);
                });
            } else {
                console.warn('No se pudieron cargar los estilos o no hay estilos disponibles.');
            }

            // Cargar artistas
            const artistsResponse = await fetch(`${BASE_API_ENTRYPOINT}?resource=artworks&action=get_artists`);
            const artistsData = await artistsResponse.json();
            if (artistsResponse.ok && artistsData.length > 0) {
                $artistFilter.empty().append('<option value="">Todos los Artistas</option>');
                $.each(artistsData, function(index, artist) {
                    $artistFilter.append(`<option value="${artist}">${artist}</option>`);
                });
            } else {
                console.warn('No se pudieron cargar los artistas o no hay artistas disponibles.');
            }

        } catch (error) {
            console.error('Error al cargar opciones de filtro:', error);
        }
    }


    // --- Inicializar la carga de obras y opciones de filtro al cargar la página ---
    fetchArtworks(); // Carga inicial de todas las obras
    loadFilterOptions(); // Carga las opciones de los filtros
    updateAuthNav(); // Actualiza el estado del botón de login/logout al cargar
});
