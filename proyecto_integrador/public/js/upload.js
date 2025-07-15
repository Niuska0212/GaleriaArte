// public/js/upload.js
document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const uploadForm = document.getElementById('uploadForm');
    const artworkImage = document.getElementById('artworkImage');
    const uploadMessage = document.getElementById('uploadMessage');
    const imagePreview = document.createElement('div');
    imagePreview.className = 'image-preview';
    uploadForm.insertBefore(imagePreview, artworkImage.parentNode.nextSibling);
    
    // Verificar autenticación al cargar la página
    checkAuth();
    
    // Mostrar vista previa de la imagen
    artworkImage.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        if (!file.type.match('image.*')) {
            showError(uploadMessage, 'El archivo debe ser una imagen');
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) { // 5MB
            showError(uploadMessage, 'La imagen no debe exceder los 5MB');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.innerHTML = `
                <img src="${e.target.result}" alt="Vista previa">
                <button type="button" class="remove-image">×</button>
            `;
            
            // Botón para eliminar la imagen seleccionada
            imagePreview.querySelector('.remove-image').addEventListener('click', function() {
                artworkImage.value = '';
                imagePreview.innerHTML = '';
                imagePreview.style.display = 'none';
            });
            
            imagePreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    });
    
    // Manejar envío del formulario
    uploadForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validar campos obligatorios
        const title = document.getElementById('artworkTitle').value;
        const artist = document.getElementById('artworkArtist').value;
        const description = document.getElementById('artworkDescription').value;
        const imageFile = artworkImage.files[0];
        
        if (!title || !artist || !imageFile) {
            showError(uploadMessage, 'Título, artista e imagen son obligatorios');
            return;
        }
        
        // Validar tipo de archivo
        if (!imageFile.type.match('image.*')) {
            showError(uploadMessage, 'El archivo debe ser una imagen (JPG, PNG, GIF)');
            return;
        }
        
        // Validar tamaño de archivo
        if (imageFile.size > 5 * 1024 * 1024) { // 5MB
            showError(uploadMessage, 'La imagen no debe exceder los 5MB');
            return;
        }
        
        try {
            // Crear FormData para enviar el archivo
            const formData = new FormData();
            formData.append('title', title);
            formData.append('artist_name', artist);
            formData.append('description', description);
            formData.append('creation_year', document.getElementById('artworkYear').value);
            formData.append('style', document.getElementById('artworkStyle').value);
            formData.append('artwork_image', imageFile);
            
            // Mostrar spinner de carga
            const submitButton = uploadForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo...';
            submitButton.disabled = true;
            
            // Enviar datos al servidor
            const response = await fetch('/backend/api/artworks.php', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Error al subir la obra');
            }
            
            // Éxito - mostrar mensaje y redirigir
            showSuccess(uploadMessage, 'Obra subida exitosamente');
            
            // Redirigir a la página de la obra después de 2 segundos
            setTimeout(() => {
                window.location.href = `artwork.html?id=${data.artwork_id}`;
            }, 2000);
            
        } catch (error) {
            console.error('Error:', error);
            showError(uploadMessage, error.message || 'Error al subir la obra');
        } finally {
            // Restaurar botón
            if (submitButton) {
                submitButton.innerHTML = originalButtonText;
                submitButton.disabled = false;
            }
        }
    });
    
    // Función para verificar autenticación
    async function checkAuth() {
        try {
            const response = await fetch('/backend/api/users.php');
            
            if (!response.ok) {
                if (response.status === 401) {
                    // No autenticado - redirigir a login
                    window.location.href = 'login.html?redirect=upload.html';
                    return false;
                }
                throw new Error('Error al verificar autenticación');
            }
            
            return true;
            
        } catch (error) {
            console.error('Error:', error);
            window.location.href = 'login.html?redirect=upload.html';
            return false;
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
    }
});