<?php
// backend/controllers/UserController.php (Procedural)

/**
 * Maneja las peticiones GET para usuarios (perfil, favoritos, check favorito, obras subidas).
 * @param PDO $conn Conexión a la base de datos.
 * @param array $params Parámetros GET.
 */
function handleUserGetRequest(PDO $conn, $params) {
    if (!isset($params["id"])) {
        http_response_code(400);
        echo json_encode(["message" => "ID de usuario no especificado."]);
        return;
    }
    $userId = intval($params["id"]);

    if (isset($params["action"]) && $params["action"] === "favorites") {
        $favorites = getUserFavoriteArtworksFunc($conn, $userId);
        if ($favorites !== false) {
            http_response_code(200);
            echo json_encode($favorites);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "No se encontraron favoritos para este usuario."]);
        }
    } elseif (isset($params["action"]) && $params["action"] === "check_favorite") {
        if (empty($params['artwork_id'])) {
            http_response_code(400);
            echo json_encode(["message" => "Falta ID de obra para verificar favorito."]);
            return;
        }
        $artworkId = intval($params['artwork_id']);
        $isFavorite = checkFavoriteStatusFunc($conn, $userId, $artworkId);
        http_response_code(200);
        echo json_encode(["is_favorite" => $isFavorite]);
    } elseif (isset($params["action"]) && $params["action"] === "uploaded_artworks") { // Nuevo: Obras subidas
        $uploadedArtworks = getUserUploadedArtworksFunc($conn, $userId);
        if ($uploadedArtworks !== false) {
            http_response_code(200);
            echo json_encode($uploadedArtworks);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "No se encontraron obras subidas por este usuario."]);
        }
    } else {
        $user = getUserByIdFunc($conn, $userId);
        if ($user) {
            http_response_code(200);
            echo json_encode($user);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Usuario no encontrado."]);
        }
    }
}

/**
 * Maneja las peticiones POST para usuarios (añadir/quitar favoritos).
 * @param PDO $conn Conexión a la base de datos.
 * @param array $data Datos del cuerpo JSON.
 */
function handleUserPostRequest(PDO $conn, $data) {
    if (!isset($data['action']) || !isset($data['userId']) || !isset($data['artworkId'])) {
        http_response_code(400);
        echo json_encode(["message" => "Faltan datos para la acción de favoritos."]);
        return;
    }

    $userId = intval($data['userId']);
    $artworkId = intval($data['artworkId']);

    if ($data['action'] === "add_favorite") {
        $result = addFavoriteArtworkFunc($userId, $artworkId);
        if ($result['success']) {
            http_response_code(200);
            echo json_encode(["message" => $result['message']]);
        } else {
            http_response_code(409); // Conflict
            echo json_encode(["message" => $result['message']]);
        }
    } elseif ($data['action'] === "remove_favorite") {
        $result = removeFavoriteArtworkFunc($userId, $artworkId);
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
}

/**
 * Obtiene la información de un usuario por su ID.
 * @param PDO $conn Conexión a la base de datos.
 * @param int $userId ID del usuario.
 * @return array|false Datos del usuario o false si no se encuentra.
 */
function getUserByIdFunc(PDO $conn, $userId) {
    $users_table = "users";
    $query = "SELECT id, username, email, profile_image_url, created_at FROM " . $users_table . " WHERE id = :id LIMIT 0,1";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

/**
 * Obtiene las obras de arte favoritas de un usuario.
 * @param PDO $conn Conexión a la base de datos.
 * @param int $userId ID del usuario.
 * @return array Un array de obras de arte favoritas.
 */
function getUserFavoriteArtworksFunc(PDO $conn, $userId) {
    $favorites_table = "favorites";
    $artworks_table = "artworks";

    $query = "SELECT a.id, a.title, a.artist_name, a.image_url, a.style
              FROM " . $favorites_table . " f
              JOIN " . $artworks_table . " a ON f.artwork_id = a.id
              WHERE f.user_id = :user_id
              ORDER BY f.created_at DESC";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

/**
 * Obtiene las obras de arte subidas por un usuario.
 * @param PDO $conn Conexión a la base de datos.
 * @param int $userId ID del usuario.
 * @return array Un array de obras de arte subidas.
 */
function getUserUploadedArtworksFunc(PDO $conn, $userId) { // Nueva función
    $artworks_table = "artworks";

    $query = "SELECT id, title, artist_name, image_url, style, creation_year
              FROM " . $artworks_table . "
              WHERE owner_id = :user_id
              ORDER BY created_at DESC";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}


/**
 * Añade una obra de arte a los favoritos de un usuario.
 * @param PDO $conn Conexión a la base de datos.
 * @param int $userId ID del usuario.
 * @param int $artworkId ID de la obra de arte.
 * @return array Resultado de la operación.
 */
function addFavoriteArtworkFunc(PDO $conn, $userId, $artworkId) {
    $favorites_table = "favorites";

    $checkQuery = "SELECT COUNT(*) FROM " . $favorites_table . " WHERE user_id = :user_id AND artwork_id = :artwork_id";
    $checkStmt = $conn->prepare($checkQuery);
    $checkStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $checkStmt->bindParam(':artwork_id', $artworkId, PDO::PARAM_INT);
    $checkStmt->execute();

    if ($checkStmt->fetchColumn() > 0) {
        return ["success" => false, "message" => "Esta obra ya está en tus favoritos."];
    }

    $query = "INSERT INTO " . $favorites_table . " (user_id, artwork_id) VALUES (:user_id, :artwork_id)";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->bindParam(':artwork_id', $artworkId, PDO::PARAM_INT);

    if ($stmt->execute()) {
        return ["success" => true, "message" => "Obra añadida a favoritos."];
    }
    return ["success" => false, "message" => "Error al añadir a favoritos."];
}

/**
 * Elimina una obra de arte de los favoritos de un usuario.
 * @param PDO $conn Conexión a la base de datos.
 * @param int $userId ID del usuario.
 * @param int $artworkId ID de la obra de arte.
 * @return array Resultado de la operación.
 */
function removeFavoriteArtworkFunc(PDO $conn, $userId, $artworkId) {
    $favorites_table = "favorites";
    $query = "DELETE FROM " . $favorites_table . " WHERE user_id = :user_id AND artwork_id = :artwork_id";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->bindParam(':artwork_id', $artworkId, PDO::PARAM_INT);

    if ($stmt->execute()) {
        if ($stmt->rowCount() > 0) {
            return ["success" => true, "message" => "Obra eliminada de favoritos."];
            } else {
            return ["success" => false, "message" => "La obra no estaba en tus favoritos o no se pudo encontrar."];
        }
    }
    return ["success" => false, "message" => "Error al eliminar de favoritos."];
}

/**
 * Verifica si una obra de arte es favorita para un usuario.
 * @param PDO $conn Conexión a la base de datos.
 * @param int $userId ID del usuario.
 * @param int $artworkId ID de la obra de arte.
 * @return bool True si es favorita, false en caso contrario.
 */
function checkFavoriteStatusFunc(PDO $conn, $userId, $artworkId) {
    $favorites_table = "favorites";
    $query = "SELECT COUNT(*) FROM " . $favorites_table . " WHERE user_id = :user_id AND artwork_id = :artwork_id";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->bindParam(':artwork_id', $artworkId, PDO::PARAM_INT);
    $stmt->execute();
    return $stmt->fetchColumn() > 0;
}
