<?php
// proyecto_integrador/backend/api/comments.php

// Establece las cabeceras para permitir CORS y especificar el tipo de contenido JSON
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Si es una petición OPTIONS (preflight), responde con 200 OK
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Incluye la clase Database desde config/database.php y los controladores
require_once __DIR__ . '/../config/database.php'; // Ahora incluye la clase Database
require_once __DIR__ . '/../controllers/AuthController.php'; // Para validar el token
require_once __DIR__ . '/../controllers/CommentController.php';

// Obtiene la conexión a la base de datos
$database = new Database(); // Instancia la clase Database
$db = $database->getConnection(); // Obtiene la conexión PDO

// Crea instancias de los controladores
$authController = new AuthController($db);
$commentController = new CommentController($db);

// Función para obtener el token de la cabecera Authorization
function getBearerToken() {
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        $matches = [];
        if (preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches)) {
            return $matches[1];
        }
    }
    return null;
}

$request_method = $_SERVER["REQUEST_METHOD"];

switch ($request_method) {
    case 'GET':
        // Obtener comentarios para una obra específica
        if (isset($_GET["artwork_id"])) {
            $artworkId = intval($_GET["artwork_id"]);
            $comments = $commentController->getCommentsByArtworkId($artworkId);
            if ($comments !== false) {
                http_response_code(200);
                echo json_encode($comments);
            } else {
                http_response_code(404);
                echo json_encode(["message" => "No se encontraron comentarios para esta obra."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "ID de obra de arte no especificado para comentarios."]);
        }
        break;

    case 'POST':
        // Añadir un nuevo comentario (requiere autenticación)
        $token = getBearerToken();
        if (!$authController->validateToken($token)) {
            http_response_code(401);
            echo json_encode(["message" => "Acceso no autorizado. Token inválido o ausente."]);
            exit();
        }

        $data = json_decode(file_get_contents("php://input"));

        if (empty($data->artwork_id) || empty($data->user_id) || empty($data->comment_text)) {
            http_response_code(400);
            echo json_encode(["message" => "Faltan datos para el comentario."]);
            exit();
        }

        $artworkId = intval($data->artwork_id);
        $userId = intval($data->user_id);
        $commentText = $data->comment_text;

        $result = $commentController->addComment($artworkId, $userId, $commentText);
        if ($result['success']) {
            http_response_code(201); // Created
            echo json_encode(["message" => $result['message']]);
        } else {
            http_response_code(500); // Internal Server Error
            echo json_encode(["message" => $result['message']]);
        }
        break;

    default:
        http_response_code(405); // Method Not Allowed
        echo json_encode(["message" => "Método no permitido."]);
        break;
}

// No es necesario cerrar la conexión explícitamente aquí.
?>
