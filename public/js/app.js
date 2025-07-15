// Define la URL base de tu API, apuntando al único punto de entrada (index.php)
const BASE_API_ENTRYPOINT = 'backend/index.php'; // Ruta relativa desde la raíz del proyecto

$(document).ready(function() {
    console.log("app.js cargado. Conectando con el backend PHP a través de index.php.");

    const $gallery = $('#artworkGallery');
    const $searchInput = $('#searchInput');
    const $styleFilter = $('#styleFilter');
    const $artistFilter = $('#artistFilter');

    // --- Función para renderizar las obras de arte en la galería ---
    function renderArtworks(artworksToDisplay) {
        $gallery.empty(); // Limpia la galería antes de añadir nuevas obras

        if (artworksToDisplay.length === 0) {
            $gallery.append('<p class="loading-message">No se encontraron obras de arte con los criterios seleccionados.</p>');
            return;
        }

        $.each(artworksToDisplay, function(index, artwork) {
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

        try {
            const response = await fetch(url);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al cargar las obras de arte.');
            }
            const artworks = await response.json();
            renderArtworks(artworks);
        } catch (error) {
            console.error('Error al cargar las obras de arte:', error);
            $gallery.html(`<p class="error-message" style="text-align: center; padding: 50px;">Error al cargar las obras: ${error.message}. Por favor, verifica la conexión al servidor.</p>`);
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
    $gallery.on('click', '.artwork-card', function() {
        const artworkId = $(this).data('id');
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
});
