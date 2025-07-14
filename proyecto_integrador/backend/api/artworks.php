<?php
// backend/api/artworks.php

// Establece las cabeceras para permitir CORS y especificar el tipo de contenido JSON
header("Access-Control-Allow-Origin: *"); // Permite peticiones desde cualquier origen (para desarrollo)
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS"); // Métodos HTTP permitidos
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Incluye la clase de la base de datos
require_once __DIR__ . '/../models/Database.php';

// Crea una instancia de la base de datos
$database = new Database();
$db = $database->getConnection();

// Lógica para manejar las peticiones HTTP
$request_method = $_SERVER["REQUEST_METHOD"];

switch ($request_method) {
    case 'GET':
        // Lógica para obtener obras de arte
        if (!empty($_GET["id"])) {
            // Obtener una obra de arte específica por ID
            $id = intval($_GET["id"]);
            getArtworkById($db, $id);
        } else {
            // Obtener todas las obras de arte
            getAllArtworks($db);
        }
        break;
    case 'POST':
        // Lógica para crear una nueva obra de arte (requerirá autenticación)
        // createArtwork($db);
        http_response_code(501); // Not Implemented
        echo json_encode(["message" => "Método POST para obras no implementado aún."]);
        break;
    case 'PUT':
        // Lógica para actualizar una obra de arte (requerirá autenticación)
        // updateArtwork($db);
        http_response_code(501); // Not Implemented
        echo json_encode(["message" => "Método PUT para obras no implementado aún."]);
        break;
    case 'DELETE':
        // Lógica para eliminar una obra de arte (requerirá autenticación)
        // deleteArtwork($db);
        http_response_code(501); // Not Implemented
        echo json_encode(["message" => "Método DELETE para obras no implementado aún."]);
        break;
    case 'OPTIONS':
        // Manejo de peticiones OPTIONS (preflight requests para CORS)
        http_response_code(200);
        break;
    default:
        // Método no permitido
        http_response_code(405); // Method Not Allowed
        echo json_encode(["message" => "Método no permitido."]);
        break;
}

/**
 * Función para obtener todas las obras de arte.
 * @param PDO $db Conexión a la base de datos.
 */
function getAllArtworks($db) {
    $query = "SELECT id, title, artist_name, description, image_url, creation_year, style FROM artworks ORDER BY created_at DESC";
    $stmt = $db->prepare($query);
    $stmt->execute();

    $artworks = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if ($artworks) {
        http_response_code(200); // OK
        echo json_encode($artworks);
    } else {
        http_response_code(404); // Not Found
        echo json_encode(["message" => "No se encontraron obras de arte."]);
    }
}

/**
 * Función para obtener una obra de arte por su ID.
 * @param PDO $db Conexión a la base de datos.
 * @param int $id ID de la obra de arte.
 */
function getArtworkById($db, $id) {
    $query = "SELECT id, title, artist_name, description, image_url, creation_year, style FROM artworks WHERE id = :id LIMIT 0,1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $id);
    $stmt->execute();

    $artwork = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($artwork) {
        http_response_code(200); // OK
        echo json_encode($artwork);
    } else {
        http_response_code(404); // Not Found
        echo json_encode(["message" => "Obra de arte no encontrada."]);
    }
}

// Aquí irían otras funciones como createArtwork, updateArtwork, deleteArtwork,
// que se implementarán más adelante con la lógica de los controladores y modelos.

?>
