// public/js/app.js
document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const styleFilter = document.getElementById('styleFilter');
    const artistFilter = document.getElementById('artistFilter');
    const sortBy = document.getElementById('sortBy');
    const artworksContainer = document.getElementById('artworksContainer');
    const gridView = document.getElementById('gridView');
    const listView = document.getElementById('listView');
    const artworkCount = document.getElementById('artworkCount');
    const pagination = document.getElementById('pagination');
    
    // Variables de estado
    let currentView = 'grid';
    let currentPage = 1;
    const artworksPerPage = 12;
    let totalArtworks = 0;
    
    // Cargar obras al iniciar
    loadArtworks();
    
    // Event listeners
    searchButton.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') handleSearch();
    });
    
    styleFilter.addEventListener('change', loadArtworks);
    artistFilter.addEventListener('change', loadArtworks);
    sortBy.addEventListener('change', loadArtworks);
    
    gridView.addEventListener('click', function() {
        currentView = 'grid';
        gridView.classList.add('active');
        listView.classList.remove('active');
        renderArtworks();
    });
    
    listView.addEventListener('click', function() {
        currentView = 'list';
        listView.classList.add('active');
        gridView.classList.remove('active');
        renderArtworks();
    });
    
    // Funciones
    function handleSearch() {
        currentPage = 1;
        loadArtworks();
    }
    
    async function loadArtworks() {
        try {
            // Mostrar spinner de carga
            artworksContainer.innerHTML = `
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i> Cargando obras...
                </div>
            `;
            
            // Construir parámetros de búsqueda
            const params = new URLSearchParams();
            params.append('page', currentPage);
            
            if (searchInput.value) params.append('search', searchInput.value);
            if (styleFilter.value) params.append('style', styleFilter.value);
            if (artistFilter.value) params.append('artist', artistFilter.value);
            if (sortBy.value) params.append('sort', sortBy.value);
            
            // Hacer la petición al backend
            const response = await fetch(`/backend/api/artworks.php?${params.toString()}`);
            
            if (!response.ok) {
                throw new Error('Error al cargar las obras');
            }
            
            const data = await response.json();
            
            if (!data.artworks || data.artworks.length === 0) {
                artworksContainer.innerHTML = `
                    <div class="no-results">
                        <i class="fas fa-paint-brush"></i>
                        <p>No se encontraron obras de arte</p>
                    </div>
                `;
                return;
            }
            
            // Actualizar estado
            totalArtworks = data.total;
            artworkCount.textContent = totalArtworks;
            
            // Renderizar obras y paginación
            renderArtworks(data.artworks);
            renderPagination(data.totalPages);
            
        } catch (error) {
            console.error('Error:', error);
            artworksContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error al cargar las obras. Por favor, intenta nuevamente.</p>
                </div>
            `;
        }
    }
    
    function renderArtworks(artworks) {
        if (!artworks) {
            artworks = Array.from(artworksContainer.querySelectorAll('.artwork-card'))
                .map(card => {
                    return {
                        id: card.dataset.id,
                        title: card.querySelector('.artwork-title').textContent,
                        artist_name: card.querySelector('.artwork-artist').textContent,
                        image_url: card.querySelector('.artwork-image').src,
                        likes_count: card.querySelector('.likes-count').textContent
                    };
                });
        }
        
        if (currentView === 'grid') {
            artworksContainer.innerHTML = artworks.map(artwork => `
                <div class="artwork-card" data-id="${artwork.id}">
                    <a href="artwork.html?id=${artwork.id}">
                        <img src="${artwork.image_url}" alt="${artwork.title}" class="artwork-image">
                    </a>
                    <div class="artwork-info">
                        <h3 class="artwork-title">${artwork.title}</h3>
                        <p class="artwork-artist">${artwork.artist_name}</p>
                        <div class="artwork-stats">
                            <span class="likes-count">${artwork.likes_count || 0} likes</span>
                        </div>
                        <div class="artwork-actions">
                            <button class="action-button like-button" data-id="${artwork.id}">
                                <i class="far fa-heart"></i> Me gusta
                            </button>
                            <button class="action-button save-button" data-id="${artwork.id}">
                                <i class="far fa-star"></i> Guardar
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            artworksContainer.innerHTML = artworks.map(artwork => `
                <div class="artwork-list-item" data-id="${artwork.id}">
                    <div class="list-item-image">
                        <a href="artwork.html?id=${artwork.id}">
                            <img src="${artwork.image_url}" alt="${artwork.title}">
                        </a>
                    </div>
                    <div class="list-item-info">
                        <h3><a href="artwork.html?id=${artwork.id}">${artwork.title}</a></h3>
                        <p class="artist">${artwork.artist_name}</p>
                        <p class="description">${artwork.description || 'Sin descripción'}</p>
                        <div class="list-item-actions">
                            <button class="action-button like-button" data-id="${artwork.id}">
                                <i class="far fa-heart"></i> ${artwork.likes_count || 0} likes
                            </button>
                            <button class="action-button save-button" data-id="${artwork.id}">
                                <i class="far fa-star"></i> Guardar
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
        
        // Agregar event listeners a los botones de like y favoritos
        document.querySelectorAll('.like-button').forEach(button => {
            button.addEventListener('click', handleLike);
        });
        
        document.querySelectorAll('.save-button').forEach(button => {
            button.addEventListener('click', handleFavorite);
        });
    }
    
    function renderPagination(totalPages) {
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }
        
        let paginationHTML = '';
        
        // Botón Anterior
        if (currentPage > 1) {
            paginationHTML += `
                <button class="page-button" data-page="${currentPage - 1}">
                    <i class="fas fa-chevron-left"></i> Anterior
                </button>
            `;
        }
        
        // Páginas
        for (let i = 1; i <= totalPages; i++) {
            paginationHTML += `
                <button class="page-button ${i === currentPage ? 'active' : ''}" data-page="${i}">
                    ${i}
                </button>
            `;
        }
        
        // Botón Siguiente
        if (currentPage < totalPages) {
            paginationHTML += `
                <button class="page-button" data-page="${currentPage + 1}">
                    Siguiente <i class="fas fa-chevron-right"></i>
                </button>
            `;
        }
        
        pagination.innerHTML = paginationHTML;
        
        // Event listeners para los botones de paginación
        document.querySelectorAll('.page-button').forEach(button => {
            button.addEventListener('click', function() {
                currentPage = parseInt(this.dataset.page);
                loadArtworks();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });
    }
    
    async function handleLike(e) {
        const artworkId = e.currentTarget.dataset.id;
        
        try {
            // Verificar si el usuario está autenticado
            if (!await checkAuth()) {
                showLoginModal();
                return;
            }
            
            const response = await fetch('/backend/api/artworks.php', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `artwork_id=${artworkId}&like=1`
            });
            
            if (!response.ok) {
                throw new Error('Error al procesar el like');
            }
            
            const data = await response.json();
            
            // Actualizar el contador de likes en la UI
            const likeButton = e.currentTarget;
            const likesCountElement = likeButton.closest('.artwork-card, .artwork-list-item')
                .querySelector('.likes-count');
            
            if (likesCountElement) {
                likesCountElement.textContent = `${data.likes_count} likes`;
            }
            
            // Cambiar el icono según la acción
            const icon = likeButton.querySelector('i');
            if (data.action === 'added') {
                icon.classList.replace('far', 'fas');
                likeButton.classList.add('liked');
            } else {
                icon.classList.replace('fas', 'far');
                likeButton.classList.remove('liked');
            }
            
        } catch (error) {
            console.error('Error:', error);
            alert('Error al procesar el like. Por favor, intenta nuevamente.');
        }
    }
    
    async function handleFavorite(e) {
        const artworkId = e.currentTarget.dataset.id;
        
        try {
            // Verificar si el usuario está autenticado
            if (!await checkAuth()) {
                showLoginModal();
                return;
            }
            
            const response = await fetch('/backend/api/artworks.php', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `artwork_id=${artworkId}&favorite=1`
            });
            
            if (!response.ok) {
                throw new Error('Error al procesar el favorito');
            }
            
            const data = await response.json();
            
            // Cambiar el icono según la acción
            const favoriteButton = e.currentTarget;
            const icon = favoriteButton.querySelector('i');
            
            if (data.action === 'added') {
                icon.classList.replace('far', 'fas');
                favoriteButton.classList.add('favorited');
            } else {
                icon.classList.replace('fas', 'far');
                favoriteButton.classList.remove('favorited');
            }
            
            // Mostrar feedback
            showToast(data.action === 'added' ? 'Obra agregada a favoritos' : 'Obra removida de favoritos');
            
        } catch (error) {
            console.error('Error:', error);
            alert('Error al procesar el favorito. Por favor, intenta nuevamente.');
        }
    }
    
    // Función para verificar autenticación
    async function checkAuth() {
        try {
            const response = await fetch('/backend/api/users.php');
            return response.ok;
        } catch (error) {
            return false;
        }
    }
    
    // Mostrar modal de login
    function showLoginModal() {
        // Aquí podrías implementar un modal o redirigir a la página de login
        if (confirm('Debes iniciar sesión para realizar esta acción. ¿Deseas ir a la página de login?')) {
            window.location.href = 'login.html';
        }
    }
    
    // Mostrar notificación toast
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
});