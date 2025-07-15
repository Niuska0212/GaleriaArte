<?php
// proyecto_integrador/backend/api/auth.php



// Si es una petición OPTIONS (preflight), responde con 200 OK
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Incluye la clase Database desde config/database.php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../controllers/AuthController.php';

// Obtiene la conexión a la base de datos
$database = new Database(); // Instancia la clase Database
$db = $database->getConnection(); // Obtiene la conexión PDO

// Crea una instancia del controlador de autenticación, pasándole la conexión PDO
$authController = new AuthController($db);

// Obtiene los datos de la petición (JSON)
$data = json_decode(file_get_contents("php://input"));

// --- INICIO DE DEPURACIÓN ---
// Puedes descomentar estas líneas para ver qué datos recibe el backend
// error_log("Datos recibidos en auth.php: " . print_r($data, true));
// --- FIN DE DEPURACIÓN ---

// Verifica que los datos necesarios estén presentes
if (!isset($data->action)) {
    http_response_code(400); // Bad Request
    echo json_encode(["message" => "Acción no especificada."]);
    exit();
}

switch ($data->action) {
    case 'register':
        if (empty($data->username) || empty($data->email) || empty($data->password)) {
            http_response_code(400);
            echo json_encode(["message" => "Faltan datos para el registro."]);
            exit();
        }
        $result = $authController->register($data->username, $data->email, $data->password);
        if ($result['success']) {
            http_response_code(201); // Created
            echo json_encode(["message" => $result['message']]);
        } else {
            http_response_code(409); // Conflict (si ya existe usuario/email) o 500 Internal Server Error
            echo json_encode(["message" => $result['message']]);
        }
        break;

    case 'login':
        if (empty($data->username) || empty($data->password)) {
            http_response_code(400);
            echo json_encode(["message" => "Faltan credenciales para el inicio de sesión."]);
            exit();
        }
        $result = $authController->login($data->username, $data->password);

        // --- INICIO DE DEPURACIÓN ---
        // Descomenta para ver el resultado de la función login en los logs de Apache
        // error_log("Resultado de AuthController->login: " . print_r($result, true));
        // --- FIN DE DEPURACIÓN ---

        if ($result['success']) {
            http_response_code(200); // OK
            echo json_encode([
                "message" => $result['message'],
                "user" => $result['user'],
                "token" => $result['token']
            ]);
        } else {
            http_response_code(401); // Unauthorized
            echo json_encode(["message" => $result['message']]);
        }
        break;

    default:
        http_response_code(400); // Bad Request
        echo json_encode(["message" => "Acción no válida."]);
        break;
}

// No es necesario cerrar la conexión explícitamente aquí, ya que PDO lo maneja automáticamente al finalizar el script.
?>
