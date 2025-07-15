document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const artworksContainer = document.getElementById('artworksContainer');
    const artworkCount = document.getElementById('artworkCount');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const styleFilter = document.getElementById('styleFilter');
    const artistFilter = document.getElementById('artistFilter');
    const sortBy = document.getElementById('sortBy');
    const gridViewBtn = document.getElementById('gridView');
    const listViewBtn = document.getElementById('listView');
    const pagination = document.getElementById('pagination');

    // Variables de estado
    let currentView = 'grid';
    let artworks = [];
    let filteredArtworks = [];
    let currentPage = 1;
    const artworksPerPage = 12;

    // Inicialización
    loadArtworks();
    loadFilters();
    checkAuthStatus();

    // Event listeners
    searchButton.addEventListener('click', filterArtworks);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') filterArtworks();
    });
    
    styleFilter.addEventListener('change', filterArtworks);
    artistFilter.addEventListener('change', filterArtworks);
    sortBy.addEventListener('change', filterArtworks);
    
    gridViewBtn.addEventListener('click', function() {
        currentView = 'grid';
        gridViewBtn.classList.add('active');
        listViewBtn.classList.remove('active');
        renderArtworks();
    });
    
    listViewBtn.addEventListener('click', function() {
        currentView = 'list';
        listViewBtn.classList.add('active');
        gridViewBtn.classList.remove('active');
        renderArtworks();
    });

    // Funciones
    async function loadArtworks() {
        try {
            artworksContainer.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Cargando obras...</div>';
            
            const response = await fetch('/backend/api/artworks.php');
            if (!response.ok) throw new Error('Error al cargar las obras');
            
            artworks = await response.json();
            filteredArtworks = [...artworks];
            
            artworkCount.textContent = artworks.length;
            renderArtworks();
            renderPagination();
        } catch (error) {
            console.error('Error:', error);
            artworksContainer.innerHTML = `<div class="error-message">Error al cargar las obras: ${error.message}</div>`;
        }
    }
    
    async function loadFilters() {
        try {
            // Cargar estilos
            const stylesResponse = await fetch('/backend/api/artworks.php?action=get_styles');
            if (!stylesResponse.ok) throw new Error('Error al cargar estilos');
            const styles = await stylesResponse.json();
            
            styles.forEach(style => {
                const option = document.createElement('option');
                option.value = style;
                option.textContent = style;
                styleFilter.appendChild(option);
            });
            
            // Cargar artistas
            const artistsResponse = await fetch('/backend/api/artworks.php?action=get_artists');
            if (!artistsResponse.ok) throw new Error('Error al cargar artistas');
            const artists = await artistsResponse.json();
            
            artists.forEach(artist => {
                const option = document.createElement('option');
                option.value = artist;
                option.textContent = artist;
                artistFilter.appendChild(option);
            });
        } catch (error) {
            console.error('Error al cargar filtros:', error);
        }
    }
    
    function filterArtworks() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedStyle = styleFilter.value;
        const selectedArtist = artistFilter.value;
        const sortOption = sortBy.value;
        
        filteredArtworks = artworks.filter(artwork => {
            const matchesSearch = 
                artwork.title.toLowerCase().includes(searchTerm) || 
                artwork.artist_name.toLowerCase().includes(searchTerm) ||
                (artwork.description && artwork.description.toLowerCase().includes(searchTerm));
            
            const matchesStyle = !selectedStyle || artwork.style === selectedStyle;
            const matchesArtist = !selectedArtist || artwork.artist_name === selectedArtist;
            
            return matchesSearch && matchesStyle && matchesArtist;
        });
        
        // Ordenar
        switch(sortOption) {
            case 'recent':
                filteredArtworks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
            case 'popular':
                filteredArtworks.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
                break;
            case 'title':
                filteredArtworks.sort((a, b) => a.title.localeCompare(b.title));
                break;
        }
        
        artworkCount.textContent = filteredArtworks.length;
        currentPage = 1;
        renderArtworks();
        renderPagination();
    }
    
    function renderArtworks() {
        const start = (currentPage - 1) * artworksPerPage;
        const end = start + artworksPerPage;
        const artworksToShow = filteredArtworks.slice(start, end);
        
        if (artworksToShow.length === 0) {
            artworksContainer.innerHTML = '<div class="no-results">No se encontraron obras que coincidan con los criterios de búsqueda.</div>';
            return;
        }
        
        if (currentView === 'grid') {
            artworksContainer.innerHTML = artworksToShow.map(artwork => `
                <div class="artwork-card" data-id="${artwork.id}">
                    <div class="artwork-image-container">
                        <img src="${artwork.image_url}" alt="${artwork.title}" class="artwork-image">
                    </div>
                    <div class="artwork-info">
                        <h3 class="artwork-title">${artwork.title}</h3>
                        <p class="artwork-artist">${artwork.artist_name}</p>
                        <div class="artwork-meta">
                            <span class="artwork-style">${artwork.style || 'Sin estilo'}</span>
                            <div class="artwork-actions">
                                <button class="action-btn like-btn" data-id="${artwork.id}">
                                    <i class="fas fa-heart"></i> <span class="like-count">${artwork.like_count || 0}</span>
                                </button>
                                <button class="action-btn save-btn" data-id="${artwork.id}">
                                    <i class="fas fa-bookmark"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            artworksContainer.innerHTML = `
                <div class="artworks-list">
                    ${artworksToShow.map(artwork => `
                        <div class="artwork-list-item" data-id="${artwork.id}">
                            <img src="${artwork.image_url}" alt="${artwork.title}" class="artwork-list-image">
                            <div class="artwork-list-info">
                                <div>
                                    <h3 class="artwork-list-title">${artwork.title}</h3>
                                    <p class="artwork-list-artist">${artwork.artist_name}</p>
                                </div>
                                <div class="artwork-list-meta">
                                    <span class="artwork-list-style">${artwork.style || 'Sin estilo'}</span>
                                    <div class="artwork-list-actions">
                                        <button class="action-btn like-btn" data-id="${artwork.id}">
                                            <i class="fas fa-heart"></i> <span class="like-count">${artwork.like_count || 0}</span>
                                        </button>
                                        <button class="action-btn save-btn" data-id="${artwork.id}">
                                            <i class="fas fa-bookmark"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        // Agregar event listeners
        addArtworkEventListeners();
    }
    
    function addArtworkEventListeners() {
        // Likes
        document.querySelectorAll('.like-btn').forEach(btn => {
            btn.addEventListener('click', handleLike);
        });
        
        // Favoritos
        document.querySelectorAll('.save-btn').forEach(btn => {
            btn.addEventListener('click', handleSave);
        });
        
        // Click en la tarjeta
        document.querySelectorAll('.artwork-card, .artwork-list-item').forEach(card => {
            card.addEventListener('click', function(e) {
                if (!e.target.closest('.action-btn')) {
                    window.location.href = `artwork.html?id=${this.dataset.id}`;
                }
            });
        });
    }
    
    function renderPagination() {
        const totalPages = Math.ceil(filteredArtworks.length / artworksPerPage);
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }
        
        let paginationHTML = '';
        
        if (currentPage > 1) {
            paginationHTML += `<button class="page-btn prev-btn" data-page="${currentPage - 1}"><i class="fas fa-chevron-left"></i> Anterior</button>`;
        }
        
        // Mostrar máximo 5 páginas alrededor de la actual
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);
        
        if (startPage > 1) {
            paginationHTML += `<button class="page-btn" data-page="1">1</button>`;
            if (startPage > 2) {
                paginationHTML += `<span class="page-dots">...</span>`;
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += `<span class="page-dots">...</span>`;
            }
            paginationHTML += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
        }
        
        if (currentPage < totalPages) {
            paginationHTML += `<button class="page-btn next-btn" data-page="${currentPage + 1}">Siguiente <i class="fas fa-chevron-right"></i></button>`;
        }
        
        pagination.innerHTML = paginationHTML;
        
        // Event listeners para paginación
        document.querySelectorAll('.page-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                currentPage = parseInt(this.dataset.page);
                renderArtworks();
                renderPagination();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });
    }
    
    async function handleLike(e) {
        e.stopPropagation();
        const artworkId = this.dataset.id;
        const token = localStorage.getItem('token');
        
        if (!token) {
            window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname);
            return;
        }
        
        try {
            const userId = JSON.parse(localStorage.getItem('user')).id;
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
                // Actualizar todos los botones de like para esta obra
                document.querySelectorAll(`.like-btn[data-id="${artworkId}"]`).forEach(btn => {
                    const icon = btn.querySelector('i');
                    const countSpan = btn.querySelector('.like-count');
                    
                    if (result.is_liked) {
                        icon.style.color = '#e63946';
                        btn.classList.add('liked');
                    } else {
                        icon.style.color = '';
                        btn.classList.remove('liked');
                    }
                    
                    countSpan.textContent = ` ${result.like_count}`;
                });
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al actualizar like');
        }
    }
    
    async function handleSave(e) {
        e.stopPropagation();
        const artworkId = this.dataset.id;
        const token = localStorage.getItem('token');
        
        if (!token) {
            window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname);
            return;
        }
        
        try {
            const userId = JSON.parse(localStorage.getItem('user')).id;
            const isFavorite = this.classList.contains('saved');
            
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
                // Actualizar todos los botones de guardar para esta obra
                document.querySelectorAll(`.save-btn[data-id="${artworkId}"]`).forEach(btn => {
                    if (isFavorite) {
                        btn.classList.remove('saved');
                        btn.querySelector('i').style.color = '';
                    } else {
                        btn.classList.add('saved');
                        btn.querySelector('i').style.color = '#6d6875';
                    }
                });
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al actualizar favoritos');
        }
    }
    
    function checkAuthStatus() {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        if (token && user) {
            // Usuario autenticado - actualizar estado de likes y favoritos
            updateArtworkStatuses();
        }
    }
    
    async function updateArtworkStatuses() {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        
        if (!token || !user) return;
        
        try {
            // Obtener likes del usuario
            const likesResponse = await fetch(`/backend/api/users.php?id=${user.id}&action=likes`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!likesResponse.ok) throw new Error('Error al cargar likes');
            const likedArtworks = await likesResponse.json();
            
            // Obtener favoritos del usuario
            const favoritesResponse = await fetch(`/backend/api/users.php?id=${user.id}&action=favorites`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!favoritesResponse.ok) throw new Error('Error al cargar favoritos');
            const favoriteArtworks = await favoritesResponse.json();
            
            // Actualizar la interfaz
            likedArtworks.forEach(artwork => {
                document.querySelectorAll(`.like-btn[data-id="${artwork.id}"]`).forEach(btn => {
                    btn.classList.add('liked');
                    btn.querySelector('i').style.color = '#e63946';
                });
            });
            
            favoriteArtworks.forEach(artwork => {
                document.querySelectorAll(`.save-btn[data-id="${artwork.id}"]`).forEach(btn => {
                    btn.classList.add('saved');
                    btn.querySelector('i').style.color = '#6d6875';
                });
            });
            
        } catch (error) {
            console.error('Error al cargar estados:', error);
        }
    }
});