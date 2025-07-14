# GaleriaArte

Estrucutra de archivos

GaleriaArte/
├── backend/
│   ├── config/
│   │   └── database.php         ← Configuración de la conexión a la base de datos
│   ├── controllers/
│   │   ├── AuthController.php   ← Lógica para autenticación (login, registro)
│   │   ├── ArtworkController.php← Lógica para obras de arte (CRUD, likes, favoritos)
│   │   ├── UserController.php   ← Lógica para usuarios (perfil, gestión)
│   │   └── CommentController.php← Lógica para comentarios
│   ├── models/
│   │   └── Database.php         ← Clase para gestionar la conexión y consultas SQL
│   ├── api/
│   │   ├── auth.php             ← Endpoints para autenticación
│   │   ├── artworks.php         ← Endpoints para obras de arte
│   │   ├── users.php            ← Endpoints para usuarios
│   │   └── comments.php         ← Endpoints para comentarios
│   └── index.php                ← Punto de entrada principal del backend (manejo de rutas, actualmente vacío)
│
├── database/
│   └── schema.sql               ← Estructura de la base de datos (tablas, relaciones)
│
├── public/
│   ├── css/
│   │   └── style.css            ← Estilos generales y específicos (minimalista, tonos neutros)
│   ├── js/
│   │   ├── app.js               ← Lógica principal: carga galería, filtros, búsqueda
│   │   ├── auth.js              ← Manejo de login y registro (interacción con PHP)
│   │   ├── profile.js           ← Gestión de perfil y favoritos (interacción con PHP)
│   │   ├── artworkDetail.js     ← Lógica para la página de detalle de obra (likes, comentarios)
│   │   └── upload.js            ← Lógica para subir nuevas obras de arte
│   │   └── lib/                 ← Opcional: para librerías de terceros (ej. jQuery)
│   │       └── jquery-3.7.1.min.js
│   ├── img/                     ← Imágenes de obras, logos, iconos
│   │   └── logo.png
│   │   └── uploaded_artworks/   ← Directorio para las imágenes de obras subidas por usuarios
│   ├── index.html               ← Página principal (galería pública)
│   ├── login.html               ← Formulario de inicio de sesión / registro
│   ├── profile.html             ← Perfil del usuario logueado
│   ├── artwork.html             ← Detalle de una obra
│   └── upload.html              ← Formulario para subir una nueva obra



#Estrucutra de la base de datos
-- Base de datos: galeria_arte
-- Asegúrate de crear la base de datos primero si no existe:
-- CREATE DATABASE IF NOT EXISTS galeria_arte;
-- USE galeria_arte;

-- Tabla para usuarios
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL, -- Almacenar hash de la contraseña, no la contraseña en texto plano
    profile_image_url VARCHAR(255) DEFAULT 'https://placehold.co/150x150/cccccc/333333?text=User', -- URL de la imagen de perfil
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para obras de arte
CREATE TABLE IF NOT EXISTS artworks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    artist_name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(255) NOT NULL, -- URL de la imagen de la obra
    creation_year INT,
    style VARCHAR(100),
    owner_id INT, -- Si las obras pueden ser subidas por usuarios
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Tabla para comentarios en obras de arte
CREATE TABLE IF NOT EXISTS comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    artwork_id INT NOT NULL,
    user_id INT NOT NULL,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabla para "likes" en obras de arte
CREATE TABLE IF NOT EXISTS likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    artwork_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (artwork_id, user_id), -- Un usuario solo puede dar un like por obra
    FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabla para obras de arte favoritas de los usuarios
CREATE TABLE IF NOT EXISTS favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    artwork_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, artwork_id), -- Un usuario solo puede tener una obra como favorita una vez
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE
);

-- Opcional: Tabla para categorías/estilos de arte (si quieres una lista predefinida)
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);