<?php
// backend/index.php - Punto de entrada único y procedural para la API

// Establece las cabeceras para permitir CORS y especificar el tipo de contenido JSON
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS"); // Métodos HTTP permitidos
header("Access-Control-Max-Age: 3600"); // Cache preflight request por 1 hora
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Si es una petición OPTIONS (preflight), responde con 200 OK y termina
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Incluye la configuración de la base de datos (que ahora establece $conn directamente)
require_once __DIR__ . '/config/database.php'; // Este archivo ahora contiene la variable $conn

// Incluye todos los archivos de controlador (que ahora contienen funciones)
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/ArtworkController.php';
require_once __DIR__ . '/controllers/UserController.php';
require_once __DIR__ . '/controllers/CommentController.php';

// La variable $conn ya está disponible aquí gracias a la inclusión de config/database.php

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

// Obtiene el recurso solicitado de la URL (ej. ?resource=auth, ?resource=artworks)
$resource = isset($_GET['resource']) ? $_GET['resource'] : '';
$method = $_SERVER['REQUEST_METHOD'];
$input_data = json_decode(file_get_contents("php://input"), true); // Para POST/PUT con JSON body

// --- Lógica de Enrutamiento ---
switch ($resource) {
    case 'auth':
        if ($method === 'POST') {
            handleAuthRequest($conn, $input_data); // Llama a la función del controlador de autenticación
        } else {
            http_response_code(405); // Method Not Allowed
            echo json_encode(["message" => "Método no permitido para autenticación."]);
        }
        break;

    case 'artworks':
        // Las peticiones GET a artworks no requieren autenticación
        if ($method === 'GET') {
            handleArtworkGetRequest($conn, $_GET); // Llama a la función del controlador de obras
        } elseif ($method === 'POST') {
            // Las peticiones POST (subir obra, toggle like, eliminar, actualizar) sí requieren autenticación
            $token = getBearerToken();
            if (!validateAuthToken($token)) { // Usando la función de validación de token
                http_response_code(401);
                echo json_encode(["message" => "Acceso no autorizado. Token inválido o ausente."]);
                exit();
            }

            // Determinar la acción del request. Primero buscar en JSON (para delete/toggle_like), luego en POST (para upload/update).
            $action = $input_data['action'] ?? ($_POST['action'] ?? null);

            if ($action === 'toggle_like') {
                handleArtworkPostRequest($conn, $input_data, $_POST, $_FILES); // Reutiliza la función para toggle_like
            } elseif ($action === 'upload_artwork') {
                handleArtworkPostRequest($conn, $input_data, $_POST, $_FILES); // Reutiliza la función para upload_artwork
            } elseif ($action === 'delete_artwork') { // NEW: Acción para eliminar obra
                handleArtworkPostRequest($conn, $input_data, $_POST, $_FILES); // Reutiliza la función para delete_artwork
            } elseif ($action === 'update_artwork') { // NEW: Acción para actualizar obra
                handleArtworkPostRequest($conn, $input_data, $_POST, $_FILES); // Reutiliza la función para update_artwork
            } else {
                http_response_code(400);
                echo json_encode(["message" => "Acción POST no válida para obras de arte."]);
            }
        } else {
            http_response_code(405); // Method Not Allowed
            echo json_encode(["message" => "Método no permitido para obras de arte."]);
        }
        break;

    case 'users':
        // Las peticiones a users siempre requieren autenticación
        $token = getBearerToken();
        if (!validateAuthToken($token)) { // Usando la función de validación de token
            http_response_code(401);
            echo json_encode(["message" => "Acceso no autorizado. Token inválido o ausente."]);
            exit();
        }
        if ($method === 'GET') {
            handleUserGetRequest($conn, $_GET); // Llama a la función del controlador de usuarios
        } elseif ($method === 'POST') {
            handleUserPostRequest($conn, $input_data); // Llama a la función del controlador de usuarios
        } else {
            http_response_code(405); // Method Not Allowed
            echo json_encode(["message" => "Método no permitido para usuarios."]);
        }
        break;

    case 'comments':
        if ($method === 'GET') {
            handleCommentGetRequest($conn, $_GET); // Llama a la función del controlador de comentarios
        } elseif ($method === 'POST') {
            // Las peticiones POST (añadir comentario) sí requieren autenticación
            $token = getBearerToken();
            if (!validateAuthToken($token)) { // Usando la función de validación de token
                http_response_code(401);
                echo json_encode(["message" => "Acceso no autorizado. Token inválido o ausente."]);
                exit();
            }
            handleCommentPostRequest($conn, $input_data); // Llama a la función del controlador de comentarios
        } else {
            http_response_code(405); // Method Not Allowed
            echo json_encode(["message" => "Método no permitido para comentarios."]);
        }
        break;

    default:
        http_response_code(404); // Not Found
        echo json_encode(["message" => "Recurso no encontrado."]);
        break;
}

// No es necesario cerrar la conexión explícitamente aquí, PDO lo maneja.
?>
