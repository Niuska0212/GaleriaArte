document.addEventListener('DOMContentLoaded', function() {
    const uploadForm = document.getElementById('uploadForm');
    const artworkImage = document.getElementById('artworkImage');
    const uploadMessage = document.getElementById('uploadMessage');
    
    // Verificar autenticación
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html?redirect=upload.html';
        return;
    }
    
    // Configurar área de subida de archivos
    setupFileUpload();
    
    // Event listener para el formulario
    uploadForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validar formulario
        if (!validateForm()) {
            return;
        }
        
        const formData = new FormData(this);
        const submitButton = this.querySelector('button[type="submit"]');
        
        // Deshabilitar botón durante el envío
        submitButton.disabled = true;
        submitButton.textContent = 'Subiendo...';
        
        try {
            const response = await fetch('/backend/api/artworks.php', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                showMessage(data.message, 'success');
                uploadForm.reset();
                resetFileInput();
                
                // Redirigir después de 2 segundos
                setTimeout(() => {
                    window.location.href = `artwork.html?id=${data.artwork_id}`;
                }, 2000);
            } else {
                showMessage(data.message, 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showMessage('Error al subir la obra', 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Subir Obra';
        }
    });
    
    // Funciones auxiliares
    function setupFileUpload() {
        const fileInputContainer = artworkImage.parentNode;
        
        // Crear elementos para la interfaz de arrastrar y soltar
        const dropArea = document.createElement('div');
        dropArea.className = 'drop-area';
        dropArea.innerHTML = `
            <div class="drop-content">
                <i class="fas fa-cloud-upload-alt"></i>
                <p>Arrastra tu imagen aquí o haz clic para seleccionar</p>
                <small>Formatos aceptados: JPG, PNG, GIF. Tamaño máximo: 5MB</small>
            </div>
        `;
        
        const previewContainer = document.createElement('div');
        previewContainer.className = 'preview-container';
        
        fileInputContainer.appendChild(dropArea);
        fileInputContainer.appendChild(previewContainer);
        
        // Ocultar el input de archivo original
        artworkImage.style.display = 'none';
        
        // Event listeners para el área de drop
        dropArea.addEventListener('click', () => artworkImage.click());
        
        dropArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropArea.classList.add('dragover');
        });
        
        dropArea.addEventListener('dragleave', () => {
            dropArea.classList.remove('dragover');
        });
        
        dropArea.addEventListener('drop', (e) => {
            e.preventDefault();
            dropArea.classList.remove('dragover');
            
            if (e.dataTransfer.files.length) {
                artworkImage.files = e.dataTransfer.files;
                handleFileSelect(e.dataTransfer.files[0]);
            }
        });
        
        artworkImage.addEventListener('change', () => {
            if (artworkImage.files.length) {
                handleFileSelect(artworkImage.files[0]);
            }
        });
    }
    
    function handleFileSelect(file) {
        // Validar el archivo
        const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
        const maxSize = 5 * 1024 * 1024; // 5MB
        
        if (!validTypes.includes(file.type)) {
            showMessage('Solo se permiten archivos JPG, PNG o GIF', 'error');
            resetFileInput();
            return;
        }
        
        if (file.size > maxSize) {
            showMessage('El tamaño máximo permitido es 5MB', 'error');
            resetFileInput();
            return;
        }
        
        // Mostrar vista previa
        const reader = new FileReader();
        reader.onload = (e) => {
            const previewContainer = document.querySelector('.preview-container');
            previewContainer.innerHTML = `
                <div class="preview-image">
                    <img src="${e.target.result}" alt="Vista previa">
                    <button class="remove-image-btn" title="Eliminar imagen">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            
            // Event listener para el botón de eliminar
            document.querySelector('.remove-image-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                resetFileInput();
            });
        };
        reader.readAsDataURL(file);
    }
    
    function resetFileInput() {
        artworkImage.value = '';
        document.querySelector('.preview-container').innerHTML = '';
        document.querySelector('.drop-area').style.display = 'flex';
    }
    
    function validateForm() {
        let isValid = true;
        const title = document.getElementById('artworkTitle').value.trim();
        const artist = document.getElementById('artworkArtist').value.trim();
        const image = artworkImage.files[0];
        
        // Limpiar errores anteriores
        document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
        document.querySelectorAll('.error-message').forEach(el => el.remove());
        
        // Validar título
        if (!title) {
            markError('artworkTitle', 'El título es obligatorio');
            isValid = false;
        }
        
        // Validar artista
        if (!artist) {
            markError('artworkArtist', 'El nombre del artista es obligatorio');
            isValid = false;
        }
        
        // Validar imagen
        if (!image) {
            showMessage('Debes seleccionar una imagen', 'error');
            isValid = false;
        }
        
        return isValid;
    }
    
    function markError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const formGroup = field.closest('.form-group');
        
        formGroup.classList.add('error');
        
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = message;
        formGroup.appendChild(errorMessage);
    }
    
    function showMessage(message, type) {
        uploadMessage.textContent = message;
        uploadMessage.className = `message ${type}`;
        uploadMessage.style.display = 'block';
        
        setTimeout(() => {
            uploadMessage.style.display = 'none';
        }, 3000);
    }
});