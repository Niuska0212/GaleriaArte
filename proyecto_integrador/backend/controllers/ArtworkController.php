<?php
// backend/controllers/ArtworkController.php

// Ya no necesitamos requerir Database.php aquí, solo se usa la conexión PDO que se pasa.

class ArtworkController {
    private $conn;
    private $artworks_table = "artworks";
    private $likes_table = "likes";
    private $upload_dir = __DIR__ . '/../../public/img/uploaded_artworks/'; // Directorio para guardar imágenes subidas

    // El constructor ahora recibe directamente la conexión PDO
    public function __construct(PDO $db) {
        $this->conn = $db;
        // Asegurarse de que el directorio de subida exista
        if (!is_dir($this->upload_dir)) {
            mkdir($this->upload_dir, 0777, true); // Crea el directorio con permisos de escritura
        }
    }

    /**
     * Obtiene todas las obras de arte, con opciones de búsqueda y filtrado.
     * También incluye el conteo de likes para cada obra.
     * @param string $searchTerm Término de búsqueda opcional.
     * @param string $styleFilter Filtro por estilo opcional.
     * @param string $artistFilter Filtro por artista opcional.
     * @return array Array de obras de arte.
     */
    public function getAllArtworks($searchTerm = '', $styleFilter = '', $artistFilter = '') {
        $query = "SELECT a.id, a.title, a.artist_name, a.description, a.image_url, a.creation_year, a.style,
                         COUNT(l.id) AS like_count
                  FROM " . $this->artworks_table . " a
                  LEFT JOIN " . $this->likes_table . " l ON a.id = l.artwork_id
                  WHERE 1=1"; // Cláusula WHERE base

        $params = [];

        if (!empty($searchTerm)) {
            $query .= " AND (a.title LIKE :searchTerm OR a.artist_name LIKE :searchTerm OR a.description LIKE :searchTerm)";
            $params[':searchTerm'] = '%' . $searchTerm . '%';
        }
        if (!empty($styleFilter)) {
            $query .= " AND a.style = :styleFilter";
            $params[':styleFilter'] = $styleFilter;
        }
        if (!empty($artistFilter)) {
            $query .= " AND a.artist_name LIKE :artistFilter"; // Usar LIKE si quieres búsqueda parcial de artista
            $params[':artistFilter'] = '%' . $artistFilter . '%';
        }

        $query .= " GROUP BY a.id ORDER BY a.created_at DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Obtiene una obra de arte específica por su ID.
     * También incluye el conteo de likes.
     * @param int $id ID de la obra de arte.
     * @return array|false Datos de la obra o false si no se encuentra.
     */
    public function getArtworkById($id) {
        $query = "SELECT a.id, a.title, a.artist_name, a.description, a.image_url, a.creation_year, a.style,
                         COUNT(l.id) AS like_count
                  FROM " . $this->artworks_table . " a
                  LEFT JOIN " . $this->likes_table . " l ON a.id = l.artwork_id
                  WHERE a.id = :id
                  GROUP BY a.id LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Añade una nueva obra de arte, incluyendo la subida del archivo de imagen.
     * @param array $data Datos de la obra (title, artist_name, description, style, creation_year, owner_id).
     * @param array $file_data Datos del archivo de imagen subido ($_FILES['artwork_image']).
     * @return array Resultado de la operación (success, message, artwork_id, image_url).
     */
    public function addArtwork($data, $file_data) {
        // Validar datos básicos
        if (empty($data['title']) || empty($data['artist_name']) || empty($file_data['name'])) {
            return ["success" => false, "message" => "Título, artista e imagen son campos obligatorios."];
        }

        // Validar y mover la imagen
        $allowed_types = ['image/jpeg', 'image/png', 'image/gif'];
        $max_size = 5 * 1024 * 1024; // 5 MB

        if (!in_array($file_data['type'], $allowed_types)) {
            return ["success" => false, "message" => "Tipo de archivo no permitido. Solo JPG, PNG, GIF."];
        }
        if ($file_data['size'] > $max_size) {
            return ["success" => false, "message" => "El tamaño del archivo excede el límite de 5MB."];
        }
        if ($file_data['error'] !== UPLOAD_ERR_OK) {
            return ["success" => false, "message" => "Error al subir el archivo: " . $file_data['error']];
        }

        $file_extension = pathinfo($file_data['name'], PATHINFO_EXTENSION);
        $new_file_name = uniqid('artwork_', true) . '.' . $file_extension;
        $destination_path = $this->upload_dir . $new_file_name;
        $image_url_for_db = 'public/img/uploaded_artworks/' . $new_file_name; // Ruta relativa para la DB y el frontend

        if (!move_uploaded_file($file_data['tmp_name'], $destination_path)) {
            return ["success" => false, "message" => "No se pudo mover el archivo subido al directorio de destino. Verifique permisos."];
        }

        // Insertar datos en la base de datos
        $query = "INSERT INTO " . $this->artworks_table . " (title, artist_name, description, image_url, creation_year, style, owner_id)
                  VALUES (:title, :artist_name, :description, :image_url, :creation_year, :style, :owner_id)";
        $stmt = $this->conn->prepare($query);

        // Limpiar y enlazar parámetros
        $title = htmlspecialchars(strip_tags(trim($data['title'])));
        $artist_name = htmlspecialchars(strip_tags(trim($data['artist_name'])));
        $description = isset($data['description']) ? htmlspecialchars(strip_tags(trim($data['description']))) : null;
        $style = isset($data['style']) ? htmlspecialchars(strip_tags(trim($data['style']))) : null;
        $creation_year = isset($data['creation_year']) && is_numeric($data['creation_year']) ? intval($data['creation_year']) : null;
        $owner_id = isset($data['owner_id']) && is_numeric($data['owner_id']) ? intval($data['owner_id']) : null;

        $stmt->bindParam(":title", $title);
        $stmt->bindParam(":artist_name", $artist_name);
        $stmt->bindParam(":description", $description);
        $stmt->bindParam(":image_url", $image_url_for_db);
        $stmt->bindParam(":creation_year", $creation_year, PDO::PARAM_INT);
        $stmt->bindParam(":style", $style);
        $stmt->bindParam(":owner_id", $owner_id, PDO::PARAM_INT);

        try {
            if ($stmt->execute()) {
                return [
                    "success" => true,
                    "message" => "Obra de arte subida exitosamente.",
                    "artwork_id" => $this->conn->lastInsertId(),
                    "image_url" => $image_url_for_db
                ];
            }
        } catch (PDOException $e) {
            // Si hay un error en la DB, intentar eliminar el archivo subido
            if (file_exists($destination_path)) {
                unlink($destination_path);
            }
            error_log("Error de base de datos al añadir obra: " . $e->getMessage());
            return ["success" => false, "message" => "Error interno del servidor al guardar la obra."];
        }

        return ["success" => false, "message" => "No se pudo subir la obra de arte."];
    }

    /**
     * Alterna el estado de "me gusta" para una obra de arte por un usuario.
     * Si ya le gusta, lo quita; si no, lo añade.
     * @param int $artworkId ID de la obra de arte.
     * @param int $userId ID del usuario.
     * @return array Resultado de la operación (incluye si ahora le gusta o no, y el nuevo conteo de likes).
     */
    public function toggleLike($artworkId, $userId) {
        // Verificar si el usuario ya dio like a esta obra
        $checkQuery = "SELECT id FROM " . $this->likes_table . " WHERE artwork_id = :artwork_id AND user_id = :user_id LIMIT 0,1";
        $checkStmt = $this->conn->prepare($checkQuery);
        $checkStmt->bindParam(':artwork_id', $artworkId, PDO::PARAM_INT);
        $checkStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $checkStmt->execute();
        $existingLike = $checkStmt->fetch(PDO::FETCH_ASSOC);

        $isLiked = false;
        $message = "";

        if ($existingLike) {
            // Si ya existe, eliminar el like
            $deleteQuery = "DELETE FROM " . $this->likes_table . " WHERE id = :id";
            $deleteStmt = $this->conn->prepare($deleteQuery);
            $deleteStmt->bindParam(':id', $existingLike['id'], PDO::PARAM_INT);
            $deleteStmt->execute();
            $message = "Me gusta eliminado.";
            $isLiked = false;
        } else {
            // Si no existe, añadir el like
            $insertQuery = "INSERT INTO " . $this->likes_table . " (artwork_id, user_id) VALUES (:artwork_id, :user_id)";
            $insertStmt = $this->conn->prepare($insertQuery);
            $insertStmt->bindParam(':artwork_id', $artworkId, PDO::PARAM_INT);
            $insertStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $insertStmt->execute();
            $message = "Me gusta añadido.";
            $isLiked = true;
        }

        // Obtener el nuevo conteo de likes para la obra
        $likeCountQuery = "SELECT COUNT(*) AS like_count FROM " . $this->likes_table . " WHERE artwork_id = :artwork_id";
        $likeCountStmt = $this->conn->prepare($likeCountQuery);
        $likeCountStmt->bindParam(':artwork_id', $artworkId, PDO::PARAM_INT);
        $likeCountStmt->execute();
        $likeCount = $likeCountStmt->fetch(PDO::FETCH_ASSOC)['like_count'];

        return ["success" => true, "message" => $message, "is_liked" => $isLiked, "like_count" => $likeCount];
    }

    /**
     * Verifica si un usuario ha dado "me gusta" a una obra específica.
     * @param int $artworkId ID de la obra de arte.
     * @param int $userId ID del usuario.
     * @return bool True si le gusta, false en caso contrario.
     */
    public function checkLikeStatus($artworkId, $userId) {
        $query = "SELECT COUNT(*) FROM " . $this->likes_table . " WHERE artwork_id = :artwork_id AND user_id = :user_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':artwork_id', $artworkId, PDO::PARAM_INT);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchColumn() > 0;
    }

    /**
     * Obtiene el conteo de likes para una obra específica.
     * @param int $artworkId ID de la obra de arte.
     * @return int El número de likes.
     */
    public function getLikeCount($artworkId) {
        $query = "SELECT COUNT(*) FROM " . $this->likes_table . " WHERE artwork_id = :artwork_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':artwork_id', $artworkId, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchColumn();
    }

    /**
     * Obtiene una lista de todos los estilos de obras de arte únicos.
     * @return array Array de estilos.
     */
    public function getAllStyles() {
        $query = "SELECT DISTINCT style FROM " . $this->artworks_table . " WHERE style IS NOT NULL AND style != '' ORDER BY style ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_COLUMN, 0); // Devuelve un array simple de valores
    }

    /**
     * Obtiene una lista de todos los nombres de artistas únicos.
     * @return array Array de nombres de artistas.
     */
    public function getAllArtists() {
        $query = "SELECT DISTINCT artist_name FROM " . $this->artworks_table . " WHERE artist_name IS NOT NULL AND artist_name != '' ORDER BY artist_name ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_COLUMN, 0); // Devuelve un array simple de valores
    }
}
?>
