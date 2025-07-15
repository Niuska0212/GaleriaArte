<?php
// backend/controllers/AuthController.php

// Ya no necesitamos requerir Database.php aquí, solo se usa la conexión PDO que se pasa.

class AuthController {
    private $conn;
    private $table_name = "users";

    // El constructor ahora recibe directamente la conexión PDO
    public function __construct(PDO $db) {
        $this->conn = $db;
    }

    /**
     * Registra un nuevo usuario en la base de datos.
     * @param string $username Nombre de usuario.
     * @param string $email Correo electrónico.
     * @param string $password Contraseña (se hasheará).
     * @return array Resultado del registro (éxito/error, mensaje).
     */
    public function register($username, $email, $password) {
        // Validar si el usuario o email ya existen
        if ($this->userExists($username, $email)) {
            return ["success" => false, "message" => "El nombre de usuario o email ya está registrado."];
        }

        // Hashear la contraseña antes de guardarla
        $password_hash = password_hash($password, PASSWORD_BCRYPT);

        $query = "INSERT INTO " . $this->table_name . " (username, email, password_hash) VALUES (:username, :email, :password_hash)";
        $stmt = $this->conn->prepare($query);

        // Limpiar y enlazar parámetros
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
     * @param string $identifier Nombre de usuario o email.
     * @param string $password Contraseña proporcionada.
     * @return array Resultado de la autenticación (éxito/error, mensaje, datos del usuario, token).
     */
    public function login($identifier, $password) {
        // Limpiar el identificador (username o email)
        $identifier = htmlspecialchars(strip_tags(trim($identifier)));

        // Buscar usuario por username o email
        $query = "SELECT id, username, email, password_hash, created_at FROM " . $this->table_name . " WHERE username = :identifier OR email = :identifier LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":identifier", $identifier);

        try {
            $stmt->execute();
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user) {
                // Usuario encontrado, verificar contraseña
                if (password_verify($password, $user['password_hash'])) {
                    // Contraseña correcta, generar token (simulado por ahora, luego JWT)
                    $token = bin2hex(random_bytes(32));

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
                    // Contraseña incorrecta
                    error_log("Intento de login fallido para: " . $identifier . " - Contraseña incorrecta.");
                    return ["success" => false, "message" => "Credenciales incorrectas."];
                }
            } else {
                // Usuario no encontrado
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
     * @param string $username
     * @param string $email
     * @return bool True si existe, false si no.
     */
    private function userExists($username, $email) {
        $query = "SELECT id FROM " . $this->table_name . " WHERE username = :username OR email = :email LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":username", $username);
        $stmt->bindParam(":email", $email);
        try {
            $stmt->execute();
            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            error_log("Error de base de datos en userExists: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Valida un token de autenticación (simulado).
     * @param string $token El token a validar.
     * @return int|false El ID del usuario si el token es válido, false en caso contrario.
     */
    public function validateToken($token) {
        if (!empty($token) && strlen($token) > 10) {
            return true;
        }
        return false;
    }
}
?>
