// public/js/profile.js
document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const profileContent = document.getElementById('profileContent');
    const favoriteArtworks = document.getElementById('favoriteArtworks');
    const logoutButton = document.getElementById('logoutButton');
    const profileMessage = document.getElementById('profileMessage');
    
    // Cargar perfil al iniciar
    loadProfile();
    
    // Event listener para logout
    logoutButton.addEventListener('click', async function(e) {
        e.preventDefault();
        
        try {
            const response = await fetch('/backend/api/auth.php?action=logout', {
                method: 'POST'
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Redirigir a la página principal
                window.location.href = 'index.html';
            } else {
                showError(profileMessage, 'Error al cerrar sesión');
            }
            
        } catch (error) {
            console.error('Error:', error);
            showError(profileMessage, 'Error al conectar con el servidor');
        }
    });
    
    // Funciones
    async function loadProfile() {
        try {
            // Mostrar spinner de carga
            profileContent.innerHTML = `
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i> Cargando perfil...
                </div>
            `;
            
            // Obtener datos del perfil
            const response = await fetch('/backend/api/users.php');
            
            if (!response.ok) {
                if (response.status === 401) {
                    // No autenticado - redirigir a login
                    window.location.href = 'login.html?redirect=profile.html';
                    return;
                }
                throw new Error('Error al cargar el perfil');
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Error al cargar el perfil');
            }
            
            // Renderizar perfil
            renderProfile(data.user);
            
            // Renderizar obras favoritas
            if (data.favorites && data.favorites.length > 0) {
                renderFavorites(data.favorites);
            } else {
                favoriteArtworks.innerHTML = `
                    <p class="no-favorites">
                        <i class="far fa-star"></i>
                        No tienes obras favoritas aún
                    </p>
                `;
            }
            
        } catch (error) {
            console.error('Error:', error);
            profileContent.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>${error.message || 'Error al cargar el perfil'}</p>
                    <a href="login.html" class="button">Iniciar sesión</a>
                </div>
            `;
        }
    }
    
    function renderProfile(user) {
        profileContent.innerHTML = `
            <div class="profile-header">
                <img src="${user.profile_image_url || 'https://placehold.co/150x150/cccccc/333333?text=User'}" 
                     alt="${user.username}" class="profile-avatar">
                <div class="profile-info">
                    <h3>${user.username}</h3>
                    <p>Miembro desde ${new Date(user.created_at).toLocaleDateString()}</p>
                </div>
            </div>
            <div class="profile-details">
                <div class="detail-item">
                    <h4>Email</h4>
                    <p>${user.email}</p>
                </div>
                <div class="detail-item">
                    <h4>Nombre de usuario</h4>
                    <p>${user.username}</p>
                </div>
            </div>
            <button id="editProfileButton" class="submit-button">Editar Perfil</button>
        `;
        
        // Agregar event listener al botón de editar perfil
        document.getElementById('editProfileButton').addEventListener('click', showEditProfileForm);
    }
    
    function renderFavorites(favorites) {
        favoriteArtworks.innerHTML = favorites.map(artwork => `
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
                            <i class="fas fa-heart"></i> Me gusta
                        </button>
                        <button class="action-button save-button favorited" data-id="${artwork.id}">
                            <i class="fas fa-star"></i> Guardado
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Agregar event listeners a los botones
        document.querySelectorAll('.like-button').forEach(button => {
            button.addEventListener('click', handleLike);
        });
        
        document.querySelectorAll('.save-button').forEach(button => {
            button.addEventListener('click', handleFavorite);
        });
    }
    
    function showEditProfileForm() {
        profileContent.innerHTML = `
            <h3>Editar Perfil</h3>
            <form id="editProfileForm" class="edit-form">
                <div class="form-group">
                    <label for="editUsername">Nombre de usuario</label>
                    <input type="text" id="editUsername" required>
                </div>
                <div class="form-group">
                    <label for="editEmail">Email</label>
                    <input type="email" id="editEmail" required>
                </div>
                <div class="form-group">
                    <label for="editPassword">Nueva contraseña (dejar en blanco para no cambiar)</label>
                    <input type="password" id="editPassword">
                </div>
                <div class="form-group">
                    <label for="editConfirmPassword">Confirmar nueva contraseña</label>
                    <input type="password" id="editConfirmPassword">
                </div>
                <button type="submit" class="submit-button">Guardar Cambios</button>
                <button type="button" id="cancelEdit" class="cancel-button">Cancelar</button>
            </form>
        `;
        
        // Rellenar formulario con datos actuales
        fetch('/backend/api/users.php')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    document.getElementById('editUsername').value = data.user.username;
                    document.getElementById('editEmail').value = data.user.email;
                }
            });
        
        // Event listeners
        document.getElementById('editProfileForm').addEventListener('submit', handleProfileUpdate);
        document.getElementById('cancelEdit').addEventListener('click', loadProfile);
    }
    
    async function handleProfileUpdate(e) {
        e.preventDefault();
        
        const username = document.getElementById('editUsername').value;
        const email = document.getElementById('editEmail').value;
        const password = document.getElementById('editPassword').value;
        const confirmPassword = document.getElementById('editConfirmPassword').value;
        
        // Validaciones
        if (!username || !email) {
            showError(profileMessage, 'Nombre de usuario y email son obligatorios');
            return;
        }
        
        if (password && password !== confirmPassword) {
            showError(profileMessage, 'Las contraseñas no coinciden');
            return;
        }
        
        try {
            const response = await fetch('/backend/api/users.php', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    email: email,
                    password: password || undefined
                })
            });
            
            const data = await response.json();
            
            if (!data.success) {
                showError(profileMessage, data.message);
                return;
            }
            
            // Actualización exitosa
            showSuccess(profileMessage, 'Perfil actualizado correctamente');
            
            // Recargar perfil después de 1 segundo
            setTimeout(loadProfile, 1000);
            
        } catch (error) {
            console.error('Error:', error);
            showError(profileMessage, 'Error al actualizar el perfil');
        }
    }
    
    async function handleLike(e) {
        const artworkId = e.currentTarget.dataset.id;
        
        try {
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
            const likesCountElement = likeButton.closest('.artwork-card')
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
            showError(profileMessage, 'Error al procesar el like');
        }
    }
    
    async function handleFavorite(e) {
        const artworkId = e.currentTarget.dataset.id;
        
        try {
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
            
            // Si se removió de favoritos, quitar la tarjeta de la vista
            if (data.action === 'removed') {
                e.currentTarget.closest('.artwork-card').remove();
                
                // Si no quedan favoritos, mostrar mensaje
                if (document.querySelectorAll('.artwork-card').length === 0) {
                    favoriteArtworks.innerHTML = `
                        <p class="no-favorites">
                            <i class="far fa-star"></i>
                            No tienes obras favoritas aún
                        </p>
                    `;
                }
            }
            
            // Mostrar feedback
            showToast(data.action === 'added' ? 'Obra agregada a favoritos' : 'Obra removida de favoritos');
            
        } catch (error) {
            console.error('Error:', error);
            showError(profileMessage, 'Error al procesar el favorito');
        }
    }
    
    function showError(element, message) {
        element.textContent = message;
        element.className = 'message-area error';
        element.style.display = 'block';
        
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
    
    function showSuccess(element, message) {
        element.textContent = message;
        element.className = 'message-area success';
        element.style.display = 'block';
        
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
    
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