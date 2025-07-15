<?php
// backend/api/artworks.php
require_once __DIR__ . '/../controllers/ArtworkController.php';

header('Content-Type: application/json');
session_start();

$artworkController = new ArtworkController();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Obtener parámetros
    $filters = [
        'style' => $_GET['style'] ?? '',
        'artist' => $_GET['artist'] ?? '',
        'sort' => $_GET['sort'] ?? 'recent'
    ];
    
    $page = max(1, intval($_GET['page'] ?? 1));
    $perPage = 12;
    
    // Obtener todas las obras con filtros
    if (empty($_GET['id'])) {
        $response = $artworkController->getAllArtworks($filters, $page, $perPage);
        echo json_encode($response);
        exit;
    }
    
    // Obtener una obra específica
    $artworkId = intval($_GET['id']);
    $response = $artworkController->getArtworkById($artworkId);
    echo json_encode($response);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Subir una nueva obra (requiere autenticación)
    if (empty($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'No autorizado']);
        exit;
    }
    
    // Manejar la subida de la imagen
    if (isset($_FILES['artwork_image'])) {
        $uploadDir = __DIR__ . '/../../public/img/uploaded_artworks/';
        $filename = uniqid() . '_' . basename($_FILES['artwork_image']['name']);
        $targetPath = $uploadDir . $filename;
        
        if (move_uploaded_file($_FILES['artwork_image']['tmp_name'], $targetPath)) {
            $imageUrl = 'img/uploaded_artworks/' . $filename;
            
            $response = $artworkController->uploadArtwork(
                $_POST,
                $imageUrl,
                $_SESSION['user_id']
            );
            
            echo json_encode($response);
            exit;
        }
    }
    
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Error al subir la imagen']);
    exit;
}

// Acciones con like/favoritos
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    parse_str(file_get_contents('php://input'), $data);
    
    if (empty($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'No autorizado']);
        exit;
    }
    
    $artworkId = intval($data['artwork_id'] ?? 0);
    $userId = $_SESSION['user_id'];
    
    if (isset($data['like'])) {
        $response = $artworkController->toggleLike($artworkId, $userId);
    } elseif (isset($data['favorite'])) {
        $response = $artworkController->toggleFavorite($artworkId, $userId);
    } else {
        $response = ['success' => false, 'message' => 'Acción no válida'];
    }
    
    echo json_encode($response);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Método no permitido']);