<?php
// backend/api/users.php


header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS"); // GET para perfil, POST para añadir/quitar favoritos
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Si es una petición OPTIONS (preflight), responde con 200 OK
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Incluye las clases necesarias
require_once __DIR__ . '/../models/Database.php';
require_once __DIR__ . '/../controllers/AuthController.php'; // Para validar el token
require_once __DIR__ . '/../controllers/UserController.php';

// Crea instancias de la base de datos y controladores
$database = new Database();
$db = $database->getConnection();
$authController = new AuthController($db);
$userController = new UserController($db);

// Función para obtener el token de la cabecera Authorization
function getBearerToken() {
    $headers = getallheaders(); // Obtiene todas las cabeceras HTTP
    if (isset($headers['Authorization'])) {
        $matches = [];
        // Busca un token que empiece con "Bearer "
        if (preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches)) {
            return $matches[1];
        }
    }
    return null;
}

// Obtener el token de la cabecera
$token = getBearerToken();

// Validar el token antes de proceder con peticiones que requieren autenticación
// NOTA: La validación de token en AuthController.php es MUY BÁSICA para este ejemplo.
// En un entorno real, aquí se decodificaría y validaría un JWT.
if (!$authController->validateToken($token)) {
    http_response_code(401); // Unauthorized
    echo json_encode(["message" => "Acceso no autorizado. Token inválido o ausente."]);
    exit();
}

$request_method = $_SERVER["REQUEST_METHOD"];

switch ($request_method) {
    case 'GET':
        // Lógica para obtener datos del usuario o sus favoritos
        if (isset($_GET["id"])) {
            $userId = intval($_GET["id"]);

            if (isset($_GET["action"]) && $_GET["action"] === "favorites") {
                // Obtener obras favoritas del usuario
                $favorites = $userController->getUserFavoriteArtworks($userId);
                if ($favorites !== false) {
                    http_response_code(200);
                    echo json_encode($favorites);
                } else {
                    http_response_code(404);
                    echo json_encode(["message" => "No se encontraron favoritos para este usuario."]);
                }
            } else {
                // Obtener datos del perfil del usuario
                $user = $userController->getUserById($userId);
                if ($user) {
                    http_response_code(200);
                    echo json_encode($user);
                } else {
                    http_response_code(404);
                    echo json_encode(["message" => "Usuario no encontrado."]);
                }
            }
        } else {
            http_response_code(400); // Bad Request
            echo json_encode(["message" => "ID de usuario no especificado."]);
        }
        break;

    case 'POST':
        // Lógica para añadir/quitar favoritos
        $data = json_decode(file_get_contents("php://input"));

        if (!isset($data->action) || !isset($data->userId) || !isset($data->artworkId)) {
            http_response_code(400);
            echo json_encode(["message" => "Faltan datos para la acción de favoritos."]);
            exit();
        }

        $userId = intval($data->userId);
        $artworkId = intval($data->artworkId);

        if ($data->action === "add_favorite") {
            $result = $userController->addFavoriteArtwork($userId, $artworkId);
            if ($result['success']) {
                http_response_code(200);
                echo json_encode(["message" => $result['message']]);
            } else {
                http_response_code(409); // Conflict
                echo json_encode(["message" => $result['message']]);
            }
        } elseif ($data->action === "remove_favorite") {
            $result = $userController->removeFavoriteArtwork($userId, $artworkId);
            if ($result['success']) {
                http_response_code(200);
                echo json_encode(["message" => $result['message']]);
            } else {
                http_response_code(404); // Not Found o Conflict
                echo json_encode(["message" => $result['message']]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Acción de favoritos no válida."]);
        }
        break;

    default:
        http_response_code(405); // Method Not Allowed
        echo json_encode(["message" => "Método no permitido."]);
        break;
}

// Cierra la conexión a la base de datos
$database->closeConnection();
?>
