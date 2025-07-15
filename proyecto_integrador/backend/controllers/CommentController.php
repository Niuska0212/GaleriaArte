<?php
// proyecto_integrador/backend/controllers/CommentController.php

// Ya no necesitamos requerir Database.php aquí, solo se usa la conexión PDO que se pasa.

class CommentController {
    private $conn;
    private $comments_table = "comments";
    private $users_table = "users"; // Para obtener el nombre de usuario

    // El constructor ahora recibe directamente la conexión PDO
    public function __construct(PDO $db) {
        $this->conn = $db;
    }

    /**
     * Obtiene todos los comentarios para una obra de arte específica.
     * Incluye el nombre de usuario del autor del comentario.
     * @param int $artworkId ID de la obra de arte.
     * @return array Array de comentarios.
     */
    public function getCommentsByArtworkId($artworkId) {
        $query = "SELECT c.id, c.comment_text, c.created_at, u.username
                  FROM " . $this->comments_table . " c
                  JOIN " . $this->users_table . " u ON c.user_id = u.id
                  WHERE c.artwork_id = :artwork_id
                  ORDER BY c.created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':artwork_id', $artworkId, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Añade un nuevo comentario a una obra de arte.
     * @param int $artworkId ID de la obra de arte.
     * @param int $userId ID del usuario que comenta.
     * @param string $commentText El texto del comentario.
     * @return array Resultado de la operación.
     */
    public function addComment($artworkId, $userId, $commentText) {
        $query = "INSERT INTO " . $this->comments_table . " (artwork_id, user_id, comment_text) VALUES (:artwork_id, :user_id, :comment_text)";
        $stmt = $this->conn->prepare($query);

        $commentText = htmlspecialchars(strip_tags(trim($commentText))); // Limpiar y trim() el texto

        $stmt->bindParam(':artwork_id', $artworkId, PDO::PARAM_INT);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindParam(':comment_text', $commentText);

        try {
            if ($stmt->execute()) {
                return ["success" => true, "message" => "Comentario añadido exitosamente."];
            }
        } catch (PDOException $e) {
            error_log("Error de base de datos al añadir comentario: " . $e->getMessage());
            return ["success" => false, "message" => "Error interno del servidor al añadir el comentario."];
        }
        return ["success" => false, "message" => "No se pudo añadir el comentario."];
    }

    // Aquí se pueden añadir métodos para actualizar o eliminar comentarios (con validación de usuario)
}
?>
