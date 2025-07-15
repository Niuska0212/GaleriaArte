// Define la URL base de tu API, apuntando al único punto de entrada (index.php)
const BASE_API_ENTRYPOINT = 'backend/index.php'; // Ruta relativa desde la raíz del proyecto

$(document).ready(function() {
    console.log("artworkDetail.js cargado.");

    const $artworkDetailContent = $('#artworkDetailContent');
    const $likeButton = $('#likeButton');
    const $likeCount = $('#likeCount');
    const $saveButton = $('#saveButton');
    const $commentsList = $('#commentsList');
    const $commentForm = $('#commentForm');
    const $commentText = $('#commentText');
    const $commentMessage = $('#commentMessage');

    let currentArtworkId = null;

    // --- Función para obtener el ID de la obra de la URL ---
    function getArtworkIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

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

    // --- Cargar detalles de la obra ---
    async function loadArtworkDetails() {
        currentArtworkId = getArtworkIdFromUrl();

        if (!currentArtworkId) {
            $artworkDetailContent.html('<p class="error">ID de obra de arte no especificado.</p>');
            return;
        }

        $artworkDetailContent.html('<p class="loading-message">Cargando detalles de la obra...</p>');
        $commentsList.html('<p class="loading-message">Cargando comentarios...</p>');

        try {
            // Apunta al único punto de entrada y especifica el recurso
            const artworkResponse = await fetch(`${BASE_API_ENTRYPOINT}?resource=artworks&id=${currentArtworkId}`);
            const artworkData = await artworkResponse.json();

            if (artworkResponse.ok) {
                renderArtworkDetails(artworkData);
                loadComments(currentArtworkId);
                checkLikeAndFavoriteStatus(currentArtworkId);
            } else {
                $artworkDetailContent.html(`<p class="error-message">${artworkData.message || 'Obra de arte no encontrada.'}</p>`);
            }
        } catch (error) {
            console.error('Error al cargar detalles de la obra:', error);
            $artworkDetailContent.html('<p class="error-message">Error de conexión al cargar la obra.</p>');
        }
    }

    // --- Renderizar detalles de la obra ---
    function renderArtworkDetails(artwork) {
        $artworkDetailContent.empty();
        const detailHtml = `
            <div class="artwork-main-info">
                <img src="${artwork.image_url}" alt="${artwork.title}" class="artwork-detail-img" onerror="this.onerror=null;this.src='https://placehold.co/800x600/cccccc/333333?text=Imagen+no+disponible';">
                <div class="artwork-text-info">
                    <h2>${artwork.title}</h2>
                    <p class="artist-name">Artista: <strong>${artwork.artist_name}</strong></p>
                    <p class="artwork-style">Estilo: ${artwork.style || 'N/A'}</p>
                    <p class="creation-year">Año: ${artwork.creation_year || 'N/A'}</p>
                    <p class="artwork-description">${artwork.description || 'Sin descripción disponible.'}</p>
                </div>
            </div>
        `;
        $artworkDetailContent.html(detailHtml);
    }

    // --- Cargar comentarios ---
    async function loadComments(artworkId) {
        $commentsList.empty();
        try {
            // Apunta al único punto de entrada y especifica el recurso
            const response = await fetch(`${BASE_API_ENTRYPOINT}?resource=comments&artwork_id=${artworkId}`);
            const commentsData = await response.json();

            if (response.ok && commentsData.length > 0) {
                $.each(commentsData, function(index, comment) {
                    const commentHtml = `
                        <div class="comment-item">
                            <p class="comment-author"><strong>${comment.username}</strong> <span class="comment-date">(${new Date(comment.created_at).toLocaleString()})</span></p>
                            <p class="comment-text">${comment.comment_text}</p>
                        </div>
                    `;
                    $(commentHtml).hide().appendTo($commentsList).fadeIn(300);
                });
            } else {
                $commentsList.html('<p class="no-comments">Sé el primero en comentar esta obra.</p>');
            }
        } catch (error) {
            console.error('Error al cargar comentarios:', error);
            $commentsList.html('<p class="error-message">Error de conexión al cargar comentarios.</p>');
        }
    }

    // --- Enviar nuevo comentario ---
    $commentForm.on('submit', async function(event) {
        event.preventDefault();

        if (!isUserLoggedIn()) {
            showMessage($commentMessage, 'Debes iniciar sesión para comentar.', 'error');
            return;
        }

        const commentText = $commentText.val().trim();
        if (commentText === "") {
            showMessage($commentMessage, 'El comentario no puede estar vacío.', 'error');
            return;
        }

        const userId = localStorage.getItem('userId');
        const userToken = localStorage.getItem('userToken');

        const $submitButton = $(this).find('button[type="submit"]');
        $submitButton.prop('disabled', true).text('Publicando...');
        $commentMessage.empty();

        try {
            // Apunta al único punto de entrada y especifica el recurso
            const response = await fetch(`${BASE_API_ENTRYPOINT}?resource=comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + userToken
                },
                body: JSON.stringify({
                    artwork_id: currentArtworkId,
                    user_id: userId,
                    comment_text: commentText
                })
            });

            const data = await response.json();

            if (response.ok) {
                showMessage($commentMessage, data.message, 'success');
                $commentText.val('');
                loadComments(currentArtworkId);
            } else {
                showMessage($commentMessage, data.message || 'Error al publicar comentario.', 'error');
            }
        } catch (error) {
            console.error('Error de red o del servidor al enviar comentario:', error);
            showMessage($commentMessage, 'Error de conexión. Inténtalo de nuevo más tarde.', 'error');
        } finally {
            $submitButton.prop('disabled', false).text('Publicar Comentario');
        }
    });

    // --- Manejo de Likes ---
    $likeButton.on('click', async function() {
        if (!isUserLoggedIn()) {
            showMessage($commentMessage, 'Debes iniciar sesión para dar "Me gusta".', 'error');
            return;
        }

        const userId = localStorage.getItem('userId');
        const userToken = localStorage.getItem('userToken');

        $likeButton.prop('disabled', true);

        try {
            // Apunta al único punto de entrada y especifica el recurso
            const response = await fetch(`${BASE_API_ENTRYPOINT}?resource=artworks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + userToken
                },
                body: JSON.stringify({
                    action: 'toggle_like',
                    artwork_id: currentArtworkId,
                    user_id: userId
                })
            });

            const data = await response.json();

            if (response.ok) {
                showMessage($commentMessage, data.message, 'success');
                if (data.is_liked !== undefined) {
                    $likeButton.toggleClass('liked', data.is_liked);
                    $likeButton.text(data.is_liked ? '❤️ Me gusta (Ya te gusta)' : '♡ Me gusta');
                }
                if (data.like_count !== undefined) {
                    $likeCount.text(data.like_count);
                } else {
                    loadArtworkDetails();
                }

            } else {
                showMessage($commentMessage, data.message || 'Error al procesar el "Me gusta".', 'error');
            }
        } catch (error) {
            console.error('Error de red o del servidor al dar like:', error);
            showMessage($commentMessage, 'Error de conexión. Inténtalo de nuevo más tarde.', 'error');
        } finally {
            $likeButton.prop('disabled', false);
        }
    });

    // --- Manejo de Guardar en Favoritos ---
    $saveButton.on('click', async function() {
        if (!isUserLoggedIn()) {
            showMessage($commentMessage, 'Debes iniciar sesión para guardar en favoritos.', 'error');
            return;
        }

        const userId = localStorage.getItem('userId');
        const userToken = localStorage.getItem('userToken');

        $saveButton.prop('disabled', true);

        try {
            // Apunta al único punto de entrada y especifica el recurso
            const response = await fetch(`${BASE_API_ENTRYPOINT}?resource=users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + userToken
                },
                body: JSON.stringify({
                    action: 'add_favorite',
                    userId: userId,
                    artworkId: currentArtworkId
                })
            });

            const data = await response.json();

            if (response.ok) {
                showMessage($commentMessage, data.message, 'success');
                $saveButton.text('⭐ Guardado en Favoritos (Ya guardado)');
                $saveButton.addClass('saved');
            } else {
                showMessage($commentMessage, data.message || 'Error al guardar en favoritos.', 'error');
            }
        } catch (error) {
            console.error('Error de red o del servidor al guardar en favoritos:', error);
            showMessage($commentMessage, 'Error de conexión. Inténtalo de nuevo más tarde.', 'error');
        } finally {
            $saveButton.prop('disabled', false);
        }
    });

    // --- Verificar si el usuario ya dio like o guardó esta obra ---
    async function checkLikeAndFavoriteStatus(artworkId) {
        if (!isUserLoggedIn()) {
            $likeButton.text('♡ Me gusta (Inicia sesión)');
            $saveButton.text('⭐ Guardar (Inicia sesión)');
            $likeButton.prop('disabled', false);
            $saveButton.prop('disabled', false);
            return;
        }

        const userId = localStorage.getItem('userId');
        const userToken = localStorage.getItem('userToken');

        try {
            // Verificar estado de Like
            const likeStatusResponse = await fetch(`${BASE_API_ENTRYPOINT}?resource=artworks&action=get_like_status&artwork_id=${artworkId}&user_id=${userId}`, {
                headers: { 'Authorization': 'Bearer ' + userToken }
            });
            const likeStatusData = await likeStatusResponse.json();

            if (likeStatusResponse.ok && likeStatusData.is_liked) {
                $likeButton.text('❤️ Me gusta (Ya te gusta)');
                $likeButton.addClass('liked');
            } else {
                $likeButton.text('♡ Me gusta');
                $likeButton.removeClass('liked');
            }
            if (likeStatusData.like_count !== undefined) {
                $likeCount.text(likeStatusData.like_count);
            }


            // Verificar estado de Favorito
            const favoriteStatusResponse = await fetch(`${BASE_API_ENTRYPOINT}?resource=users&action=check_favorite&artwork_id=${artworkId}&user_id=${userId}`, {
                headers: { 'Authorization': 'Bearer ' + userToken }
            });
            const favoriteStatusData = await favoriteStatusResponse.json();

            if (favoriteStatusResponse.ok && favoriteStatusData.is_favorite) {
                $saveButton.text('⭐ Guardado en Favoritos (Ya guardado)');
                $saveButton.addClass('saved');
            } else {
                $saveButton.text('⭐ Guardar en Favoritos');
                $saveButton.removeClass('saved');
            }

        } catch (error) {
            console.error('Error al verificar estado de like/favorito:', error);
        } finally {
            $likeButton.prop('disabled', false);
            $saveButton.prop('disabled', false);
        }
    }

    // --- Inicializar la carga de detalles de la obra al cargar la página ---
    loadArtworkDetails();
});
