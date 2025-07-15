document.addEventListener('DOMContentLoaded', function() {
    const artworkDetailContent = document.getElementById('artworkDetailContent');
    const likeButton = document.getElementById('likeButton');
    const saveButton = document.getElementById('saveButton');
    const likeCount = document.getElementById('likeCount');
    const commentsList = document.getElementById('commentsList');
    const commentForm = document.getElementById('commentForm');
    const commentText = document.getElementById('commentText');
    const commentMessage = document.getElementById('commentMessage');
    
    // Obtener ID de la obra de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const artworkId = urlParams.get('id');
    
    if (!artworkId) {
        window.location.href = 'index.html';
        return;
    }
    
    // Cargar datos de la obra
    loadArtworkDetail();
    loadComments();
    checkAuthStatus();
    
    // Event listeners
    likeButton.addEventListener('click', handleLike);
    saveButton.addEventListener('click', handleSave);
    commentForm.addEventListener('submit', handleCommentSubmit);
    
    // Funciones
    async function loadArtworkDetail() {
        try {
            const response = await fetch(`/backend/api/artworks.php?id=${artworkId}`);
            if (!response.ok) throw new Error('Obra no encontrada');
            
            const artwork = await response.json();
            renderArtworkDetail(artwork);
            
            // Verificar estado de like/favorito si el usuario está autenticado
            const token = localStorage.getItem('token');
            const user = localStorage.getItem('user');
            
            if (token && user) {
                const userId = JSON.parse(user).id;
                
                // Verificar like
                const likeResponse = await fetch(`/backend/api/artworks.php?action=get_like_status&artwork_id=${artworkId}&user_id=${userId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (likeResponse.ok) {
                    const likeData = await likeResponse.json();
                    if (likeData.is_liked) {
                        likeButton.classList.add('liked');
                    }
                    likeCount.textContent = likeData.like_count || 0;
                }
                
                // Verificar favorito
                const favoriteResponse = await fetch(`/backend/api/users.php?id=${userId}&action=check_favorite&artwork_id=${artworkId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (favoriteResponse.ok) {
                    const favoriteData = await favoriteResponse.json();
                    if (favoriteData.is_favorite) {
                        saveButton.classList.add('saved');
                    }
                }
            }
        } catch (error) {
            console.error('Error:', error);
            artworkDetailContent.innerHTML = `
                <div class="error-message">
                    <p>Error al cargar los detalles de la obra.</p>
                    <a href="index.html" class="btn-primary">Volver a la galería</a>
                </div>
            `;
        }
    }
    
    function renderArtworkDetail(artwork) {
        artworkDetailContent.innerHTML = `
            <div class="artwork-main-info">
                <div class="artwork-image-container">
                    <img src="${artwork.image_url}" alt="${artwork.title}" class="artwork-detail-img">
                </div>
                <div class="artwork-text-info">
                    <h2 class="artwork-detail-title">${artwork.title}</h2>
                    <p class="artwork-detail-artist">${artwork.artist_name}</p>
                    
                    ${artwork.description ? `<div class="artwork-description">${artwork.description}</div>` : ''}
                    
                    <div class="artwork-detail-meta">
                        ${artwork.style ? `<span><strong>Estilo:</strong> ${artwork.style}</span>` : ''}
                        ${artwork.creation_year ? `<span><strong>Año:</strong> ${artwork.creation_year}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }
    
    async function loadComments() {
        try {
            const response = await fetch(`/backend/api/comments.php?artwork_id=${artworkId}`);
            if (!response.ok) throw new Error('Error al cargar comentarios');
            
            const comments = await response.json();
            renderComments(comments);
        } catch (error) {
            console.error('Error:', error);
            commentsList.innerHTML = '<p class="error-message">Error al cargar los comentarios</p>';
        }
    }
    
    function renderComments(comments) {
        if (comments.length === 0) {
            commentsList.innerHTML = '<p class="no-comments">No hay comentarios aún. ¡Sé el primero en comentar!</p>';
            return;
        }
        
        commentsList.innerHTML = comments.map(comment => `
            <div class="comment-item">
                <div class="comment-header">
                    <span class="comment-author">${comment.username}</span>
                    <span class="comment-date">${new Date(comment.created_at).toLocaleString()}</span>
                </div>
                <div class="comment-text">${comment.comment_text}</div>
            </div>
        `).join('');
    }
    
    async function handleLike() {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        if (!token || !user) {
            window.location.href = `login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
            return;
        }
        
        try {
            const userId = JSON.parse(user).id;
            const response = await fetch('/backend/api/artworks.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: 'toggle_like',
                    artwork_id: artworkId,
                    user_id: userId
                })
            });
            
            if (!response.ok) throw new Error('Error al actualizar like');
            
            const result = await response.json();
            
            if (result.success) {
                if (result.is_liked) {
                    likeButton.classList.add('liked');
                } else {
                    likeButton.classList.remove('liked');
                }
                likeCount.textContent = result.like_count;
            }
        } catch (error) {
            console.error('Error:', error);
            showMessage('Error al actualizar like', 'error');
        }
    }
    
    async function handleSave() {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        if (!token || !user) {
            window.location.href = `login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
            return;
        }
        
        try {
            const userId = JSON.parse(user).id;
            const isFavorite = saveButton.classList.contains('saved');
            
            const response = await fetch('/backend/api/users.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: isFavorite ? 'remove_favorite' : 'add_favorite',
                    userId: userId,
                    artworkId: artworkId
                })
            });
            
            if (!response.ok) throw new Error('Error al actualizar favoritos');
            
            const result = await response.json();
            
            if (result.success) {
                if (isFavorite) {
                    saveButton.classList.remove('saved');
                } else {
                    saveButton.classList.add('saved');
                }
            }
        } catch (error) {
            console.error('Error:', error);
            showMessage('Error al actualizar favoritos', 'error');
        }
    }
    
    async function handleCommentSubmit(e) {
        e.preventDefault();
        
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        if (!token || !user) {
            window.location.href = `login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
            return;
        }
        
        const comment = commentText.value.trim();
        
        if (!comment) {
            showMessage('Por favor escribe un comentario', 'error');
            return;
        }
        
        try {
            const userId = JSON.parse(user).id;
            const response = await fetch('/backend/api/comments.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    artwork_id: artworkId,
                    user_id: userId,
                    comment_text: comment
                })
            });
            
            if (!response.ok) throw new Error('Error al publicar comentario');
            
            const result = await response.json();
            
            if (result.success) {
                commentText.value = '';
                showMessage('Comentario publicado', 'success');
                loadComments();
            }
        } catch (error) {
            console.error('Error:', error);
            showMessage('Error al publicar comentario', 'error');
        }
    }
    
    function checkAuthStatus() {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        if (token && user) {
            // Mostrar formulario de comentarios
            commentForm.style.display = 'block';
        } else {
            // Ocultar formulario de comentarios
            commentForm.style.display = 'none';
            commentsList.insertAdjacentHTML('afterend', '<p class="auth-message">Inicia sesión para dejar un comentario</p>');
        }
    }
    
    function showMessage(message, type) {
        commentMessage.textContent = message;
        commentMessage.className = `message ${type}`;
        commentMessage.style.display = 'block';
        
        setTimeout(() => {
            commentMessage.style.display = 'none';
        }, 3000);
    }
});