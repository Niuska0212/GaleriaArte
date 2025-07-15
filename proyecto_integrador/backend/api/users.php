<?php
// backend/api/users.php
require_once __DIR__ . '/../controllers/UserController.php';

header('Content-Type: application/json');
session_start();

$userController = new UserController();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Obtener perfil de usuario
    $userId = $_GET['id'] ?? ($_SESSION['user_id'] ?? 0);
    
    if (empty($userId)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID de usuario no proporcionado']);
        exit;
    }
    
    $response = $userController->getUserProfile($userId);
    echo json_encode($response);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    // Actualizar perfil (requiere autenticación)
    if (empty($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'No autorizado']);
        exit;
    }
    
    parse_str(file_get_contents('php://input'), $data);
    $response = $userController->updateProfile($_SESSION['user_id'], $data);
    echo json_encode($response);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Método no permitido']);