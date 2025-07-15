<?php
// backend/controllers/CommentController.php (Procedural)

/**
 * Maneja las peticiones GET para comentarios.
 * @param PDO $conn Conexión a la base de datos.
 * @param array $params Parámetros GET.
 */
function handleCommentGetRequest(PDO $conn, $params) {
    if (!isset($params["artwork_id"])) {
        http_response_code(400);
        echo json_encode(["message" => "ID de obra de arte no especificado para comentarios."]);
        return;
    }
    $artworkId = intval($params["artwork_id"]);
    $comments = getCommentsByArtworkIdFunc($conn, $artworkId);
    if ($comments !== false) {
        http_response_code(200);
        echo json_encode($comments);
    } else {
        http_response_code(404);
        echo json_encode(["message" => "No se encontraron comentarios para esta obra."]);
    }
}

/**
 * Maneja las peticiones POST para comentarios (añadir comentario).
 * @param PDO $conn Conexión a la base de datos.
 * @param array $data Datos del cuerpo JSON.
 */
function handleCommentPostRequest(PDO $conn, $data) {
    if (empty($data['artwork_id']) || empty($data['user_id']) || empty($data['comment_text'])) {
        http_response_code(400);
        echo json_encode(["message" => "Faltan datos para el comentario."]);
        return;
    }

    $artworkId = intval($data['artwork_id']);
    $userId = intval($data['user_id']);
    $commentText = $data['comment_text'];

    $result = addCommentFunc($conn, $artworkId, $userId, $commentText);
    if ($result['success']) {
        http_response_code(201); // Created
        echo json_encode(["message" => $result['message']]);
    } else {
        http_response_code(500); // Internal Server Error
        echo json_encode(["message" => $result['message']]);
    }
}

/**
 * Obtiene todos los comentarios para una obra de arte específica.
 * @param PDO $conn Conexión a la base de datos.
 * @param int $artworkId ID de la obra de arte.
 * @return array Array de comentarios.
 */
function getCommentsByArtworkIdFunc(PDO $conn, $artworkId) {
    $comments_table = "comments";
    $users_table = "users";

    $query = "SELECT c.id, c.comment_text, c.created_at, u.username
              FROM " . $comments_table . " c
              JOIN " . $users_table . " u ON c.user_id = u.id
              WHERE c.artwork_id = :artwork_id
              ORDER BY c.created_at DESC";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':artwork_id', $artworkId, PDO::PARAM_INT);
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

/**
 * Añade un nuevo comentario a una obra de arte.
 * @param PDO $conn Conexión a la base de datos.
 * @param int $artworkId ID de la obra de arte.
 * @param int $userId ID del usuario que comenta.
 * @param string $commentText El texto del comentario.
 * @return array Resultado de la operación.
 */
function addCommentFunc(PDO $conn, $artworkId, $userId, $commentText) {
    $comments_table = "comments";
    $query = "INSERT INTO " . $comments_table . " (artwork_id, user_id, comment_text) VALUES (:artwork_id, :user_id, :comment_text)";
    $stmt = $conn->prepare($query);

    $commentText = htmlspecialchars(strip_tags(trim($commentText)));

    $stmt->bindParam(':artwork_id', $artworkId, PDO::PARAM_INT);
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->bindParam(':comment_text', $commentText);

    try {
        if ($stmt->execute()) {
            return ["success" => true, "message" => "Comentario añadido exitosamente."];
        }
    } catch (PDOException $e) {
        error_log("Error de base de datos al añadir comentario: " . $e->getMessage());
        return ["success" => false, "message" => "Error interno del servidor al añadir el comentario."];
    }
    return ["success" => false, "message" => "No se pudo añadir el comentario."];
}
