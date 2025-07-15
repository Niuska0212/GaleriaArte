<?php
// backend/controllers/CommentController.php
require_once __DIR__ . '/../config/database.php';

class CommentController {
    private $conn;

    public function __construct() {
        global $conn;
        $this->conn = $conn;
    }

    public function getCommentsByArtwork($artworkId) {
        $stmt = $this->conn->prepare("
            SELECT c.*, u.username, u.profile_image_url 
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.artwork_id = ?
            ORDER BY c.created_at DESC
        ");
        $stmt->execute([$artworkId]);
        $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return ['success' => true, 'comments' => $comments];
    }

    public function addComment($artworkId, $userId, $commentText) {
        if (empty($commentText)) {
            return ['success' => false, 'message' => 'El comentario no puede estar vacío'];
        }

        $stmt = $this->conn->prepare("
            INSERT INTO comments (artwork_id, user_id, comment_text)
            VALUES (?, ?, ?)
        ");
        $stmt->execute([$artworkId, $userId, $commentText]);

        // Obtener el comentario recién creado con información del usuario
        $commentId = $this->conn->lastInsertId();
        $stmt = $this->conn->prepare("
            SELECT c.*, u.username, u.profile_image_url 
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.id = ?
        ");
        $stmt->execute([$commentId]);
        $comment = $stmt->fetch(PDO::FETCH_ASSOC);

        return ['success' => true, 'comment' => $comment];
    }

    public function deleteComment($commentId, $userId) {
        // Verificar que el comentario pertenece al usuario
        $stmt = $this->conn->prepare("SELECT id FROM comments WHERE id = ? AND user_id = ?");
        $stmt->execute([$commentId, $userId]);

        if ($stmt->rowCount() === 0) {
            return ['success' => false, 'message' => 'No tienes permiso para eliminar este comentario'];
        }

        $stmt = $this->conn->prepare("DELETE FROM comments WHERE id = ?");
        $stmt->execute([$commentId]);

        return ['success' => true, 'message' => 'Comentario eliminado correctamente'];
    }
}