<?php
// backend/controllers/UserController.php

require_once __DIR__ . '/../models/Database.php';

class UserController {
    private $conn;
    private $users_table = "users";
    private $artworks_table = "artworks";
    private $favorites_table = "favorites";

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Obtiene la información de un usuario por su ID.
     * @param int $userId ID del usuario.
     * @return array|false Datos del usuario o false si no se encuentra.
     */
    public function getUserById($userId) {
        $query = "SELECT id, username, email, created_at FROM " . $this->users_table . " WHERE id = :id LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $userId, PDO::PARAM_INT);
        $stmt->execute();

        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        // No devolver el password_hash
        if ($user) {
            unset($user['password_hash']);
            return $user;
        }
        return false;
    }

    /**
     * Obtiene las obras de arte favoritas de un usuario.
     * @param int $userId ID del usuario.
     * @return array Un array de obras de arte favoritas.
     */
    public function getUserFavoriteArtworks($userId) {
        $query = "SELECT a.id, a.title, a.artist_name, a.image_url, a.style
                  FROM " . $this->favorites_table . " f
                  JOIN " . $this->artworks_table . " a ON f.artwork_id = a.id
                  WHERE f.user_id = :user_id
                  ORDER BY f.created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Añade una obra de arte a los favoritos de un usuario.
     * @param int $userId ID del usuario.
     * @param int $artworkId ID de la obra de arte.
     * @return array Resultado de la operación.
     */
    public function addFavoriteArtwork($userId, $artworkId) {
        // Primero, verificar si ya es favorito para evitar duplicados
        $checkQuery = "SELECT COUNT(*) FROM " . $this->favorites_table . " WHERE user_id = :user_id AND artwork_id = :artwork_id";
        $checkStmt = $this->conn->prepare($checkQuery);
        $checkStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $checkStmt->bindParam(':artwork_id', $artworkId, PDO::PARAM_INT);
        $checkStmt->execute();

        if ($checkStmt->fetchColumn() > 0) {
            return ["success" => false, "message" => "Esta obra ya está en tus favoritos."];
        }

        $query = "INSERT INTO " . $this->favorites_table . " (user_id, artwork_id) VALUES (:user_id, :artwork_id)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindParam(':artwork_id', $artworkId, PDO::PARAM_INT);

        if ($stmt->execute()) {
            return ["success" => true, "message" => "Obra añadida a favoritos."];
        }
        return ["success" => false, "message" => "Error al añadir a favoritos."];
    }

    /**
     * Elimina una obra de arte de los favoritos de un usuario.
     * @param int $userId ID del usuario.
     * @param int $artworkId ID de la obra de arte.
     * @return array Resultado de la operación.
     */
    public function removeFavoriteArtwork($userId, $artworkId) {
        $query = "DELETE FROM " . $this->favorites_table . " WHERE user_id = :user_id AND artwork_id = :artwork_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindParam(':artwork_id', $artworkId, PDO::PARAM_INT);

        if ($stmt->execute()) {
            if ($stmt->rowCount() > 0) {
                return ["success" => true, "message" => "Obra eliminada de favoritos."];
            } else {
                return ["success" => false, "message" => "La obra no estaba en tus favoritos o no se pudo encontrar."];
            }
        }
        return ["success" => false, "message" => "Error al eliminar de favoritos."];
    }

    // Aquí se pueden añadir más métodos para actualizar perfil, cambiar contraseña, etc.
}
?>
