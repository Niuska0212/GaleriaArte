<?php
// proyecto_integrador/backend/api/artworks.php

// Establece las cabeceras para permitir CORS y especificar el tipo de contenido JSON
header("Access-Control-Allow-Origin: *"); // Permite peticiones desde cualquier origen (para desarrollo)
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS"); // Métodos HTTP permitidos
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Si es una petición OPTIONS (preflight), responde con 200 OK
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Incluye la clase Database desde config/database.php y los controladores
require_once __DIR__ . '/../config/database.php'; // Ahora incluye la clase Database
require_once __DIR__ . '/../controllers/ArtworkController.php';
require_once __DIR__ . '/../controllers/AuthController.php'; // Para validar el token

// Obtiene la conexión a la base de datos
$database = new Database(); // Instancia la clase Database
$db = $database->getConnection(); // Obtiene la conexión PDO

// Crea instancias de los controladores, pasándoles la conexión PDO
$artworkController = new ArtworkController($db);
$authController = new AuthController($db);

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
        // Lógica para obtener obras de arte, estilos o artistas
        if (isset($_GET["action"])) {
            $action = $_GET["action"];
            switch ($action) {
                case 'get_styles':
                    $styles = $artworkController->getAllStyles();
                    http_response_code(200);
                    echo json_encode($styles);
                    break;
                case 'get_artists':
                    $artists = $artworkController->getAllArtists();
                    http_response_code(200);
                    echo json_encode($artists);
                    break;
                case 'get_like_status':
                    // Requiere autenticación para verificar el estado de like de un usuario
                    $token = getBearerToken();
                    if (!$authController->validateToken($token)) {
                        http_response_code(401);
                        echo json_encode(["message" => "Acceso no autorizado. Token inválido o ausente."]);
                        exit();
                    }
                    if (empty($_GET['artwork_id']) || empty($_GET['user_id'])) {
                        http_response_code(400);
                        echo json_encode(["message" => "Faltan IDs para verificar like."]);
                        exit();
                    }
                    $artworkId = intval($_GET['artwork_id']);
                    $userId = intval($_GET['user_id']);
                    $isLiked = $artworkController->checkLikeStatus($artworkId, $userId);
                    $likeCount = $artworkController->getLikeCount($artworkId);
                    http_response_code(200);
                    echo json_encode(["is_liked" => $isLiked, "like_count" => $likeCount]);
                    break;
                default:
                    http_response_code(400);
                    echo json_encode(["message" => "Acción GET no válida."]);
                    break;
            }
        } elseif (!empty($_GET["id"])) {
            // Obtener una obra de arte específica por ID
            $id = intval($_GET["id"]);
            $artwork = $artworkController->getArtworkById($id);
            if ($artwork) {
                http_response_code(200);
                echo json_encode($artwork);
            } else {
                http_response_code(404);
                echo json_encode(["message" => "Obra de arte no encontrada."]);
            }
        } else {
            // Obtener todas las obras de arte con filtros
            $searchTerm = isset($_GET['search']) ? $_GET['search'] : '';
            $styleFilter = isset($_GET['style']) ? $_GET['style'] : '';
            $artistFilter = isset($_GET['artist']) ? $_GET['artist'] : '';
            $artworks = $artworkController->getAllArtworks($searchTerm, $styleFilter, $artistFilter);
            if ($artworks) {
                http_response_code(200);
                echo json_encode($artworks);
            } else {
                http_response_code(404);
                echo json_encode(["message" => "No se encontraron obras de arte."]);
            }
        }
        break;

    case 'POST':
        // Lógica para crear una nueva obra de arte o alternar like
        $token = getBearerToken();
        if (!$authController->validateToken($token)) {
            http_response_code(401);
            echo json_encode(["message" => "Acceso no autorizado. Token inválido o ausente."]);
            exit();
        }

        // Determinar si es una subida de archivo (multipart/form-data) o un JSON (toggle_like)
        // $_POST estará poblado para multipart/form-data, file_get_contents("php://input") para JSON
        $input_data = json_decode(file_get_contents("php://input"), true); // Intenta decodificar JSON

        if (isset($input_data['action']) && $input_data['action'] === 'toggle_like') {
            // Manejar toggle_like (viene como JSON)
            if (empty($input_data['artwork_id']) || empty($input_data['user_id'])) {
                http_response_code(400);
                echo json_encode(["message" => "Faltan IDs para la acción de like."]);
                exit();
            }
            $artworkId = intval($input_data['artwork_id']);
            $userId = intval($input_data['user_id']);
            $result = $artworkController->toggleLike($artworkId, $userId);
            if ($result['success']) {
                http_response_code(200);
                echo json_encode($result);
            } else {
                http_response_code(500);
                echo json_encode(["message" => $result['message']]);
            }
        } elseif (isset($_POST['action']) && $_POST['action'] === 'upload_artwork') {
            // Manejar subida de obra (viene como FormData)
            if (empty($_FILES['artwork_image'])) {
                http_response_code(400);
                echo json_encode(["message" => "No se ha subido ningún archivo de imagen."]);
                exit();
            }

            $result = $artworkController->addArtwork($_POST, $_FILES['artwork_image']);
            if ($result['success']) {
                http_response_code(201); // Created
                echo json_encode(["message" => $result['message'], "artwork_id" => $result['artwork_id'], "image_url" => $result['image_url']]);
            } else {
                http_response_code(400); // Bad Request o Internal Server Error
                echo json_encode(["message" => $result['message']]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Acción POST no válida o formato de datos incorrecto."]);
        }
        break;

    case 'PUT':
        // Lógica para actualizar una obra de arte (requerirá autenticación)
        http_response_code(501); // Not Implemented
        echo json_encode(["message" => "Método PUT para obras no implementado aún."]);
        break;
    case 'DELETE':
        // Lógica para eliminar una obra de arte (requerirá autenticación)
        http_response_code(501); // Not Implemented
        echo json_encode(["message" => "Método DELETE para obras no implementado aún."]);
        break;
    default:
        // Método no permitido
        http_response_code(405); // Method Not Allowed
        echo json_encode(["message" => "Método no permitido."]);
        break;
}

// No es necesario cerrar la conexión explícitamente aquí, PDO lo maneja.
?>
