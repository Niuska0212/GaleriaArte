<?php
// backend/controllers/UserController.php
require_once __DIR__ . '/../config/database.php';

class UserController {
    private $conn;

    public function __construct() {
        global $conn;
        $this->conn = $conn;
    }

    public function getUserProfile($userId) {
        $stmt = $this->conn->prepare("SELECT id, username, email, profile_image_url, created_at FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            return ['success' => false, 'message' => 'Usuario no encontrado'];
        }

        // Obtener obras favoritas
        $stmt = $this->conn->prepare("
            SELECT a.* 
            FROM artworks a
            JOIN favorites f ON a.id = f.artwork_id
            WHERE f.user_id = ?
        ");
        $stmt->execute([$userId]);
        $favorites = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Obtener conteo de likes para cada obra favorita
        foreach ($favorites as &$favorite) {
            $stmt = $this->conn->prepare("SELECT COUNT(*) FROM likes WHERE artwork_id = ?");
            $stmt->execute([$favorite['id']]);
            $favorite['likes_count'] = $stmt->fetchColumn();
        }

        // Obtener obras subidas por el usuario
        $stmt = $this->conn->prepare("SELECT * FROM artworks WHERE owner_id = ?");
        $stmt->execute([$userId]);
        $artworks = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return [
            'success' => true,
            'user' => $user,
            'favorites' => $favorites,
            'artworks' => $artworks
        ];
    }

    public function updateProfile($userId, $data) {
        $updates = [];
        $params = [];

        if (!empty($data['username'])) {
            // Verificar si el nuevo username ya existe
            $stmt = $this->conn->prepare("SELECT id FROM users WHERE username = ? AND id != ?");
            $stmt->execute([$data['username'], $userId]);
            
            if ($stmt->rowCount() > 0) {
                return ['success' => false, 'message' => 'El nombre de usuario ya está en uso'];
            }
            
            $updates[] = "username = ?";
            $params[] = $data['username'];
        }

        if (!empty($data['email'])) {
            // Verificar si el nuevo email ya existe
            $stmt = $this->conn->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
            $stmt->execute([$data['email'], $userId]);
            
            if ($stmt->rowCount() > 0) {
                return ['success' => false, 'message' => 'El email ya está en uso'];
            }
            
            $updates[] = "email = ?";
            $params[] = $data['email'];
        }

        if (!empty($data['profile_image_url'])) {
            $updates[] = "profile_image_url = ?";
            $params[] = $data['profile_image_url'];
        }

        if (!empty($data['password'])) {
            $updates[] = "password_hash = ?";
            $params[] = password_hash($data['password'], PASSWORD_BCRYPT);
        }

        if (empty($updates)) {
            return ['success' => false, 'message' => 'No hay datos para actualizar'];
        }

        $params[] = $userId;
        $sql = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute($params);

        return ['success' => true, 'message' => 'Perfil actualizado correctamente'];
    }
}