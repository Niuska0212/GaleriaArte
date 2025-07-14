<?php
// backend/controllers/ArtworkController.php

require_once __DIR__ . '/../models/Database.php';

class ArtworkController {
    private $conn;
    private $artworks_table = "artworks";
    private $likes_table = "likes";

    public function __construct($db) {
        $this->conn = $db;
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

    // Aquí se pueden añadir métodos para crear, actualizar, eliminar obras de arte.
}
?>
