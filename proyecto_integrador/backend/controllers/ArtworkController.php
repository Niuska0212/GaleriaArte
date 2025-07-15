<?php
// backend/controllers/ArtworkController.php (Procedural)

// Definir el directorio de subida como una constante global para este archivo
define('UPLOAD_ARTWORK_DIR', __DIR__ . '/../../public/img/uploaded_artworks/');

// Asegurarse de que el directorio de subida exista
if (!is_dir(UPLOAD_ARTWORK_DIR)) {
    mkdir(UPLOAD_ARTWORK_DIR, 0777, true); // Crea el directorio con permisos de escritura
}

/**
 * Maneja las peticiones GET para obras de arte.
 * @param PDO $conn Conexión a la base de datos.
 * @param array $params Parámetros GET (ej. id, search, style, artist, action).
 */
function handleArtworkGetRequest(PDO $conn, $params) {
    if (isset($params["action"])) {
        $action = $params["action"];
        switch ($action) {
            case 'get_styles':
                $styles = getAllStylesFunc($conn);
                http_response_code(200);
                echo json_encode($styles);
                break;
            case 'get_artists':
                $artists = getAllArtistsFunc($conn);
                http_response_code(200);
                echo json_encode($artists);
                break;
            case 'get_like_status':
                if (empty($params['artwork_id']) || empty($params['user_id'])) {
                    http_response_code(400);
                    echo json_encode(["message" => "Faltan IDs para verificar like."]);
                    return;
                }
                $artworkId = intval($params['artwork_id']);
                $userId = intval($params['user_id']);
                $isLiked = checkLikeStatusFunc($conn, $artworkId, $userId);
                $likeCount = getLikeCountFunc($conn, $artworkId);
                http_response_code(200);
                echo json_encode(["is_liked" => $isLiked, "like_count" => $likeCount]);
                break;
            default:
                http_response_code(400);
                echo json_encode(["message" => "Acción GET no válida para obras."]);
                break;
        }
    } elseif (isset($params["id"])) {
        $id = intval($params["id"]);
        $artwork = getArtworkByIdFunc($conn, $id);
        if ($artwork) {
            http_response_code(200);
            echo json_encode($artwork);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Obra de arte no encontrada."]);
        }
    } else {
        $searchTerm = isset($params['search']) ? $params['search'] : '';
        $styleFilter = isset($params['style']) ? $params['style'] : '';
        $artistFilter = isset($params['artist']) ? $params['artist'] : '';
        $artworks = getAllArtworksFunc($conn, $searchTerm, $styleFilter, $artistFilter);
        if ($artworks) {
            http_response_code(200);
            echo json_encode($artworks);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "No se encontraron obras de arte."]);
        }
    }
}

/**
 * Maneja las peticiones POST para obras de arte (subir obra, toggle like).
 * @param PDO $conn Conexión a la base de datos.
 * @param array $json_data Datos del cuerpo JSON (para toggle_like).
 * @param array $post_data Datos de POST (para upload_artwork).
 * @param array $file_data Datos de archivos subidos ($_FILES, para upload_artwork).
 */
function handleArtworkPostRequest(PDO $conn, $json_data, $post_data, $file_data) {
    if (isset($json_data['action']) && $json_data['action'] === 'toggle_like') {
        if (empty($json_data['artwork_id']) || empty($json_data['user_id'])) {
            http_response_code(400);
            echo json_encode(["message" => "Faltan IDs para la acción de like."]);
            return;
        }
        $artworkId = intval($json_data['artwork_id']);
        $userId = intval($json_data['user_id']);
        $result = toggleLikeFunc($conn, $artworkId, $userId);
        if ($result['success']) {
            http_response_code(200);
            echo json_encode($result);
        } else {
            http_response_code(500);
            echo json_encode(["message" => $result['message']]);
        }
    } elseif (isset($post_data['action']) && $post_data['action'] === 'upload_artwork') {
        if (empty($file_data['artwork_image'])) {
            http_response_code(400);
            echo json_encode(["message" => "No se ha subido ningún archivo de imagen."]);
            return;
        }

        $result = addArtworkFunc($conn, $post_data, $file_data['artwork_image']);
        if ($result['success']) {
            http_response_code(201); // Created
            echo json_encode(["message" => $result['message'], "artwork_id" => $result['artwork_id'], "image_url" => $result['image_url']]);
        } else {
            http_response_code(400); // Bad Request o Internal Server Error
            echo json_encode(["message" => $result['message']]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["message" => "Acción POST no válida o formato de datos incorrecto para obras."]);
    }
}

/**
 * Obtiene todas las obras de arte, con opciones de búsqueda y filtrado.
 * @param PDO $conn Conexión a la base de datos.
 * @param string $searchTerm Término de búsqueda opcional.
 * @param string $styleFilter Filtro por estilo opcional.
 * @param string $artistFilter Filtro por artista opcional.
 * @return array Array de obras de arte.
 */
function getAllArtworksFunc(PDO $conn, $searchTerm = '', $styleFilter = '', $artistFilter = '') {
    $artworks_table = "artworks";
    $likes_table = "likes";

    $query = "SELECT a.id, a.title, a.artist_name, a.description, a.image_url, a.creation_year, a.style,
                     COUNT(l.id) AS like_count
              FROM " . $artworks_table . " a
              LEFT JOIN " . $likes_table . " l ON a.id = l.artwork_id
              WHERE 1=1";

    $params = [];
    if (!empty($searchTerm)) {
        $query .= " AND (a.title LIKE :searchTerm OR a.artist_name LIKE :searchTerm OR a.description LIKE :searchTerm)";
        $params[':searchTerm'] = '%' . $searchTerm . '%';
    }
    if (!empty($styleFilter)) {
        $query .= " AND a.style = :styleFilter";
        $params[':styleFilter'] = $styleFilter;
    }
    if (!empty($artistFilter)) {
        $query .= " AND a.artist_name LIKE :artistFilter";
        $params[':artistFilter'] = '%' . $artistFilter . '%';
    }
    $query .= " GROUP BY a.id ORDER BY a.created_at DESC";

    $stmt = $conn->prepare($query);
    $stmt->execute($params);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

/**
 * Obtiene una obra de arte específica por su ID.
 * @param PDO $conn Conexión a la base de datos.
 * @param int $id ID de la obra de arte.
 * @return array|false Datos de la obra o false si no se encuentra.
 */
function getArtworkByIdFunc(PDO $conn, $id) {
    $artworks_table = "artworks";
    $likes_table = "likes";

    $query = "SELECT a.id, a.title, a.artist_name, a.description, a.image_url, a.creation_year, a.style,
                     COUNT(l.id) AS like_count
              FROM " . $artworks_table . " a
              LEFT JOIN " . $likes_table . " l ON a.id = l.artwork_id
              WHERE a.id = :id
              GROUP BY a.id LIMIT 0,1";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':id', $id, PDO::PARAM_INT);
    $stmt->execute();
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

/**
 * Añade una nueva obra de arte, incluyendo la subida del archivo de imagen.
 * @param PDO $conn Conexión a la base de datos.
 * @param array $data Datos de la obra (title, artist_name, description, style, creation_year, owner_id).
 * @param array $file_data Datos del archivo de imagen subido ($_FILES['artwork_image']).
 * @return array Resultado de la operación (success, message, artwork_id, image_url).
 */
function addArtworkFunc(PDO $conn, $data, $file_data) {
    $artworks_table = "artworks";

    if (empty($data['title']) || empty($data['artist_name']) || empty($file_data['name'])) {
        return ["success" => false, "message" => "Título, artista e imagen son campos obligatorios."];
    }

    $allowed_types = ['image/jpeg', 'image/png', 'image/gif'];
    $max_size = 5 * 1024 * 1024; // 5 MB

    if (!in_array($file_data['type'], $allowed_types)) {
        return ["success" => false, "message" => "Tipo de archivo no permitido. Solo JPG, PNG, GIF."];
    }
    if ($file_data['size'] > $max_size) {
        return ["success" => false, "message" => "El tamaño del archivo excede el límite de 5MB."];
    }
    if ($file_data['error'] !== UPLOAD_ERR_OK) {
        return ["success" => false, "message" => "Error al subir el archivo: " . $file_data['error']];
    }

    $file_extension = pathinfo($file_data['name'], PATHINFO_EXTENSION);
    $new_file_name = uniqid('artwork_', true) . '.' . $file_extension;
    $destination_path = UPLOAD_ARTWORK_DIR . $new_file_name; // Usar la constante
    $image_url_for_db = 'public/img/uploaded_artworks/' . $new_file_name;

    if (!move_uploaded_file($file_data['tmp_name'], $destination_path)) {
        return ["success" => false, "message" => "No se pudo mover el archivo subido al directorio de destino. Verifique permisos."];
    }

    $query = "INSERT INTO " . $artworks_table . " (title, artist_name, description, image_url, creation_year, style, owner_id)
              VALUES (:title, :artist_name, :description, :image_url, :creation_year, :style, :owner_id)";
    $stmt = $conn->prepare($query);

    $title = htmlspecialchars(strip_tags(trim($data['title'])));
    $artist_name = htmlspecialchars(strip_tags(trim($data['artist_name'])));
    $description = isset($data['description']) ? htmlspecialchars(strip_tags(trim($data['description']))) : null;
    $style = isset($data['style']) ? htmlspecialchars(strip_tags(trim($data['style']))) : null;
    $creation_year = isset($data['creation_year']) && is_numeric($data['creation_year']) ? intval($data['creation_year']) : null;
    $owner_id = isset($data['owner_id']) && is_numeric($data['owner_id']) ? intval($data['owner_id']) : null;

    $stmt->bindParam(":title", $title);
    $stmt->bindParam(":artist_name", $artist_name);
    $stmt->bindParam(":description", $description);
    $stmt->bindParam(":image_url", $image_url_for_db);
    $stmt->bindParam(":creation_year", $creation_year, PDO::PARAM_INT);
    $stmt->bindParam(":style", $style);
    $stmt->bindParam(":owner_id", $owner_id, PDO::PARAM_INT);

    try {
        if ($stmt->execute()) {
            return [
                "success" => true,
                "message" => "Obra de arte subida exitosamente.",
                "artwork_id" => $conn->lastInsertId(),
                "image_url" => $image_url_for_db
            ];
        }
    } catch (PDOException $e) {
        if (file_exists($destination_path)) {
            unlink($destination_path);
        }
        error_log("Error de base de datos al añadir obra: " . $e->getMessage());
        return ["success" => false, "message" => "Error interno del servidor al guardar la obra."];
    }
    return ["success" => false, "message" => "No se pudo subir la obra de arte."];
}

/**
 * Alterna el estado de "me gusta" para una obra de arte por un usuario.
 * @param PDO $conn Conexión a la base de datos.
 * @param int $artworkId ID de la obra de arte.
 * @param int $userId ID del usuario.
 * @return array Resultado de la operación (incluye si ahora le gusta o no, y el nuevo conteo de likes).
 */
function toggleLikeFunc(PDO $conn, $artworkId, $userId) {
    $likes_table = "likes";

    $checkQuery = "SELECT id FROM " . $likes_table . " WHERE artwork_id = :artwork_id AND user_id = :user_id LIMIT 0,1";
    $checkStmt = $conn->prepare($checkQuery);
    $checkStmt->bindParam(':artwork_id', $artworkId, PDO::PARAM_INT);
    $checkStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $checkStmt->execute();
    $existingLike = $checkStmt->fetch(PDO::FETCH_ASSOC);

    $isLiked = false;
    $message = "";

    if ($existingLike) {
        $deleteQuery = "DELETE FROM " . $likes_table . " WHERE id = :id";
        $deleteStmt = $conn->prepare($deleteQuery);
        $deleteStmt->bindParam(':id', $existingLike['id'], PDO::PARAM_INT);
        $deleteStmt->execute();
        $message = "Me gusta eliminado.";
        $isLiked = false;
    } else {
        $insertQuery = "INSERT INTO " . $likes_table . " (artwork_id, user_id) VALUES (:artwork_id, :user_id)";
        $insertStmt = $conn->prepare($insertQuery);
        $insertStmt->bindParam(':artwork_id', $artworkId, PDO::PARAM_INT);
        $insertStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $insertStmt->execute();
        $message = "Me gusta añadido.";
        $isLiked = true;
    }

    $likeCountQuery = "SELECT COUNT(*) AS like_count FROM " . $likes_table . " WHERE artwork_id = :artwork_id";
    $likeCountStmt = $conn->prepare($likeCountQuery);
    $likeCountStmt->bindParam(':artwork_id', $artworkId, PDO::PARAM_INT);
    $likeCountStmt->execute();
    $likeCount = $likeCountStmt->fetch(PDO::FETCH_ASSOC)['like_count'];

    return ["success" => true, "message" => $message, "is_liked" => $isLiked, "like_count" => $likeCount];
}

/**
 * Verifica si un usuario ha dado "me gusta" a una obra específica.
 * @param PDO $conn Conexión a la base de datos.
 * @param int $artworkId ID de la obra de arte.
 * @param int $userId ID del usuario.
 * @return bool True si le gusta, false en caso contrario.
 */
function checkLikeStatusFunc(PDO $conn, $artworkId, $userId) {
    $likes_table = "likes";
    $query = "SELECT COUNT(*) FROM " . $likes_table . " WHERE artwork_id = :artwork_id AND user_id = :user_id";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':artwork_id', $artworkId, PDO::PARAM_INT);
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    return $stmt->fetchColumn() > 0;
}

/**
 * Obtiene el conteo de likes para una obra específica.
 * @param PDO $conn Conexión a la base de datos.
 * @param int $artworkId ID de la obra de arte.
 * @return int El número de likes.
 */
function getLikeCountFunc(PDO $conn, $artworkId) {
    $likes_table = "likes";
    $query = "SELECT COUNT(*) FROM " . $likes_table . " WHERE artwork_id = :artwork_id";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':artwork_id', $artworkId, PDO::PARAM_INT);
    $stmt->execute();
    return $stmt->fetchColumn();
}

/**
 * Obtiene una lista de todos los estilos de obras de arte únicos.
 * @param PDO $conn Conexión a la base de datos.
 * @return array Array de estilos.
 */
function getAllStylesFunc(PDO $conn) {
    $artworks_table = "artworks";
    $query = "SELECT DISTINCT style FROM " . $artworks_table . " WHERE style IS NOT NULL AND style != '' ORDER BY style ASC";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_COLUMN, 0);
}

/**
 * Obtiene una lista de todos los nombres de artistas únicos.
 * @param PDO $conn Conexión a la base de datos.
 * @return array Array de nombres de artistas.
 */
function getAllArtistsFunc(PDO $conn) {
    $artworks_table = "artworks";
    $query = "SELECT DISTINCT artist_name FROM " . $artworks_table . " WHERE artist_name IS NOT NULL AND artist_name != '' ORDER BY artist_name ASC";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_COLUMN, 0);
}
