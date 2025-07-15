<?php
// backend/controllers/AuthController.php
require_once __DIR__ . '/../config/database.php';

class AuthController {
    private $conn;

    public function __construct() {
        global $conn;
        $this->conn = $conn;
    }

    public function register($username, $email, $password) {
        // Validar datos
        if (empty($username) || empty($email) || empty($password)) {
            return ['success' => false, 'message' => 'Todos los campos son obligatorios'];
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return ['success' => false, 'message' => 'Email no válido'];
        }

        // Verificar si el usuario o email ya existen
        $stmt = $this->conn->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
        $stmt->execute([$username, $email]);
        
        if ($stmt->rowCount() > 0) {
            return ['success' => false, 'message' => 'El nombre de usuario o email ya está en uso'];
        }

        // Hash de la contraseña
        $passwordHash = password_hash($password, PASSWORD_BCRYPT);

        // Insertar nuevo usuario
        $stmt = $this->conn->prepare("INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)");
        $stmt->execute([$username, $email, $passwordHash]);

        return ['success' => true, 'message' => 'Registro exitoso'];
    }

    public function login($username, $password) {
        // Obtener usuario por username o email
        $stmt = $this->conn->prepare("SELECT * FROM users WHERE username = ? OR email = ?");
        $stmt->execute([$username, $username]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user || !password_verify($password, $user['password_hash'])) {
            return ['success' => false, 'message' => 'Credenciales incorrectas'];
        }

        // Iniciar sesión (en un entorno real usarías session_start() o JWT)
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];

        return [
            'success' => true,
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'email' => $user['email'],
                'profile_image_url' => $user['profile_image_url']
            ]
        ];
    }

    public function logout() {
        session_unset();
        session_destroy();
        return ['success' => true];
    }
}