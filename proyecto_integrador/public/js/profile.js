document.addEventListener('DOMContentLoaded', function() {
    const profileContent = document.getElementById('profileContent');
    const favoriteArtworks = document.getElementById('favoriteArtworks');
    const logoutButton = document.getElementById('logoutButton');
    const profileMessage = document.getElementById('profileMessage');
    
    // Verificar autenticación
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
        window.location.href = 'login.html?redirect=profile.html';
        return;
    }
    
    // Cargar datos del perfil
    loadProfile();
    loadFavoriteArtworks();
    
    // Event listeners
    if (logoutButton) {
        logoutButton.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'index.html';
        });
    }
    
    // Funciones
    async function loadProfile() {
        try {
            const userData = JSON.parse(user);
            renderProfile(userData);
        } catch (error) {
            console.error('Error:', error);
            profileContent.innerHTML = '<p class="error-message">Error al cargar el perfil</p>';
        }
    }
    
    function renderProfile(userData) {
        profileContent.innerHTML = `
            <div class="profile-header">
                <img src="${userData.profile_image_url || 'https://placehold.co/150x150/cccccc/333333?text=User'}" alt="Foto de perfil" class="profile-image">
                <div class="profile-info">
                    <h2>${userData.username}</h2>
                    <p>${userData.email}</p>
                    <p>Miembro desde: ${new Date(userData.created_at).toLocaleDateString()}</p>
                </div>
            </div>
        `;
    }
    
    async function loadFavoriteArtworks() {
        try {
            const userData = JSON.parse(user);
            const response = await fetch(`/backend/api/users.php?id=${userData.id}&action=favorites`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) throw new Error('Error al cargar favoritos');
            
            const favorites = await response.json();
            renderFavoriteArtworks(favorites);
        } catch (error) {
            console.error('Error:', error);
            favoriteArtworks.innerHTML = '<p class="error-message">Error al cargar obras favoritas</p>';
        }
    }
    
    function renderFavoriteArtworks(artworks) {
        if (artworks.length === 0) {
            favoriteArtworks.innerHTML = '<p class="no-results">No tienes obras favoritas aún.</p>';
            return;
        }
        
        favoriteArtworks.innerHTML = artworks.map(artwork => `
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
                            <button class="action-btn remove-favorite-btn" data-id="${artwork.id}">
                                <i class="fas fa-trash-alt"></i> Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Agregar event listeners para eliminar favoritos
        document.querySelectorAll('.remove-favorite-btn').forEach(btn => {
            btn.addEventListener('click', async function(e) {
                e.stopPropagation();
                const artworkId = this.dataset.id;
                
                try {
                    const userData = JSON.parse(user);
                    const response = await fetch('/backend/api/users.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            action: 'remove_favorite',
                            userId: userData.id,
                            artworkId: artworkId
                        })
                    });
                    
                    if (!response.ok) throw new Error('Error al eliminar favorito');
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        showMessage('Obra eliminada de favoritos', 'success');
                        loadFavoriteArtworks();
                    }
                } catch (error) {
                    console.error('Error:', error);
                    showMessage('Error al eliminar favorito', 'error');
                }
            });
        });
        
        // Agregar event listener para ir al detalle de la obra
        document.querySelectorAll('.artwork-card').forEach(card => {
            card.addEventListener('click', function(e) {
                if (!e.target.closest('.action-btn')) {
                    window.location.href = `artwork.html?id=${this.dataset.id}`;
                }
            });
        });
    }
    
    function showMessage(message, type) {
        profileMessage.textContent = message;
        profileMessage.className = `message ${type}`;
        profileMessage.style.display = 'block';
        
        setTimeout(() => {
            profileMessage.style.display = 'none';
        }, 3000);
    }
});