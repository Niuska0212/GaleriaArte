<?php
// backend/controllers/AuthController.php (Procedural)

/**
 * Maneja las peticiones de autenticación (login y registro).
 * @param PDO $conn Conexión a la base de datos.
 * @param array $data Datos de entrada (JSON decodificado).
 */
function handleAuthRequest(PDO $conn, $data) {
    if (!isset($data['action'])) {
        http_response_code(400);
        echo json_encode(["message" => "Acción no especificada para autenticación."]);
        return;
    }

    switch ($data['action']) {
        case 'register':
            if (empty($data['username']) || empty($data['email']) || empty($data['password'])) {
                http_response_code(400);
                echo json_encode(["message" => "Faltan datos para el registro."]);
                return;
            }
            $result = registerUser($conn, $data['username'], $data['email'], $data['password']);
            if ($result['success']) {
                http_response_code(201); // Created
                echo json_encode(["message" => $result['message']]);
            } else {
                http_response_code(409); // Conflict (si ya existe usuario/email)
                echo json_encode(["message" => $result['message']]);
            }
            break;

        case 'login':
            if (empty($data['username']) || empty($data['password'])) {
                http_response_code(400);
                echo json_encode(["message" => "Faltan credenciales para el inicio de sesión."]);
                return;
            }
            $result = loginUser($conn, $data['username'], $data['password']);
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
            http_response_code(400);
            echo json_encode(["message" => "Acción de autenticación no válida."]);
            break;
    }
}

/**
 * Registra un nuevo usuario en la base de datos.
 * @param PDO $conn Conexión a la base de datos.
 * @param string $username Nombre de usuario.
 * @param string $email Correo electrónico.
 * @param string $password Contraseña (se hasheará).
 * @return array Resultado del registro (éxito/error, mensaje).
 */
function registerUser(PDO $conn, $username, $email, $password) {
    $table_name = "users"; // Definir la tabla dentro de la función o como constante

    if (checkUserExists($conn, $username, $email)) {
        return ["success" => false, "message" => "El nombre de usuario o email ya está registrado."];
    }

    $password_hash = password_hash($password, PASSWORD_BCRYPT);

    $query = "INSERT INTO " . $table_name . " (username, email, password_hash) VALUES (:username, :email, :password_hash)";
    $stmt = $conn->prepare($query);

    $username = htmlspecialchars(strip_tags(trim($username)));
    $email = htmlspecialchars(strip_tags(trim($email)));

    $stmt->bindParam(":username", $username);
    $stmt->bindParam(":email", $email);
    $stmt->bindParam(":password_hash", $password_hash);

    try {
        if ($stmt->execute()) {
            return ["success" => true, "message" => "Usuario registrado exitosamente."];
        }
    } catch (PDOException $e) {
        error_log("Error de base de datos en registro: " . $e->getMessage());
        return ["success" => false, "message" => "Error interno del servidor al registrar."];
    }

    return ["success" => false, "message" => "No se pudo registrar el usuario."];
}

/**
 * Autentica a un usuario.
 * @param PDO $conn Conexión a la base de datos.
 * @param string $identifier Nombre de usuario o email.
 * @param string $password Contraseña proporcionada.
 * @return array Resultado de la autenticación (éxito/error, mensaje, datos del usuario, token).
 */
function loginUser(PDO $conn, $identifier, $password) {
    $table_name = "users"; // Definir la tabla dentro de la función o como constante

    $identifier = htmlspecialchars(strip_tags(trim($identifier)));

    $query = "SELECT id, username, email, password_hash, created_at FROM " . $table_name . " WHERE username = :identifier OR email = :identifier LIMIT 0,1";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(":identifier", $identifier);

    try {
        $stmt->execute();
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            if (password_verify($password, $user['password_hash'])) {
                $token = bin2hex(random_bytes(32)); // Token simulado

                return [
                    "success" => true,
                    "message" => "Inicio de sesión exitoso.",
                    "user" => [
                        "id" => $user['id'],
                        "username" => $user['username'],
                        "email" => $user['email'],
                        "created_at" => $user['created_at']
                    ],
                    "token" => $token
                ];
            } else {
                error_log("Intento de login fallido para: " . $identifier . " - Contraseña incorrecta.");
                return ["success" => false, "message" => "Credenciales incorrectas."];
            }
        } else {
            error_log("Intento de login fallido para: " . $identifier . " - Usuario no encontrado.");
            return ["success" => false, "message" => "Credenciales incorrectas."];
        }
    } catch (PDOException $e) {
        error_log("Error de base de datos en login: " . $e->getMessage());
        return ["success" => false, "message" => "Error interno del servidor."];
    }
}

/**
 * Verifica si un usuario con el mismo username o email ya existe.
 * @param PDO $conn Conexión a la base de datos.
 * @param string $username
 * @param string $email
 * @return bool True si existe, false si no.
 */
function checkUserExists(PDO $conn, $username, $email) {
    $table_name = "users"; // Definir la tabla dentro de la función o como constante

    $query = "SELECT id FROM " . $table_name . " WHERE username = :username OR email = :email LIMIT 0,1";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(":username", $username);
    $stmt->bindParam(":email", $email);
    try {
        $stmt->execute();
        return $stmt->rowCount() > 0;
    } catch (PDOException $e) {
        error_log("Error de base de datos en checkUserExists: " . $e->getMessage());
        return false;
    }
}

/**
 * Valida un token de autenticación (simulado).
 * Esta función es llamada directamente desde index.php.
 * @param string $token El token a validar.
 * @return bool True si el token es válido, false en caso contrario.
 */
function validateAuthToken($token) {
    // Implementación de validación de JWT real iría aquí.
    // Por ahora, es un placeholder.
    if (!empty($token) && strlen($token) > 10) {
        return true;
    }
    return false;
}
