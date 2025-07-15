<?php
// backend/api/auth.php
require_once __DIR__ . '/../controllers/AuthController.php';

header('Content-Type: application/json');
session_start();

$authController = new AuthController();

$data = json_decode(file_get_contents('php://input'), true);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_GET['action'] ?? '';
    
    switch ($action) {
        case 'register':
            $response = $authController->register(
                $data['username'] ?? '',
                $data['email'] ?? '',
                $data['password'] ?? ''
            );
            break;
            
        case 'login':
            $response = $authController->login(
                $data['username'] ?? '',
                $data['password'] ?? ''
            );
            break;
            
        case 'logout':
            $response = $authController->logout();
            break;
            
        default:
            $response = ['success' => false, 'message' => 'Acción no válida'];
    }
    
    echo json_encode($response);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Método no permitido']);