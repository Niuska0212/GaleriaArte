<?php
// backend/api/comments.php
require_once __DIR__ . '/../controllers/CommentController.php';

header('Content-Type: application/json');
session_start();

$commentController = new CommentController();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Obtener comentarios de una obra
    $artworkId = $_GET['artwork_id'] ?? 0;
    
    if (empty($artworkId)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID de obra no proporcionado']);
        exit;
    }
    
    $response = $commentController->getCommentsByArtwork($artworkId);
    echo json_encode($response);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Agregar comentario (requiere autenticación)
    if (empty($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'No autorizado']);
        exit;
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (empty($data['artwork_id']) || empty($data['comment_text'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
        exit;
    }
    
    $response = $commentController->addComment(
        $data['artwork_id'],
        $_SESSION['user_id'],
        $data['comment_text']
    );
    
    echo json_encode($response);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    // Eliminar comentario (requiere autenticación)
    if (empty($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'No autorizado']);
        exit;
    }
    
    $commentId = $_GET['id'] ?? 0;
    
    if (empty($commentId)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID de comentario no proporcionado']);
        exit;
    }
    
    $response = $commentController->deleteComment($commentId, $_SESSION['user_id']);
    echo json_encode($response);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Método no permitido']);