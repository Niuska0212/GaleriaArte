<?php
// backend/controllers/ArtworkController.php
require_once __DIR__ . '/../config/database.php';

class ArtworkController {
    private $conn;

    public function __construct() {
        global $conn;
        $this->conn = $conn;
    }

    public function getAllArtworks($filters = [], $page = 1, $perPage = 12) {
        $where = [];
        $params = [];

        // Filtros
        if (!empty($filters['style'])) {
            $where[] = "style LIKE ?";
            $params[] = '%' . $filters['style'] . '%';
        }

        if (!empty($filters['artist'])) {
            $where[] = "artist_name LIKE ?";
            $params[] = '%' . $filters['artist'] . '%';
        }

        // Orden
        $orderBy = 'created_at DESC';
        if (!empty($filters['sort'])) {
            switch ($filters['sort']) {
                case 'popular':
                    $orderBy = '(SELECT COUNT(*) FROM likes WHERE artwork_id = artworks.id) DESC';
                    break;
                case 'title':
                    $orderBy = 'title ASC';
                    break;
            }
        }

        $whereClause = empty($where) ? '' : 'WHERE ' . implode(' AND ', $where);

        // Contar total de obras
        $countStmt = $this->conn->prepare("SELECT COUNT(*) FROM artworks $whereClause");
        $countStmt->execute($params);
        $total = $countStmt->fetchColumn();

        // Paginación
        $offset = ($page - 1) * $perPage;
        $sql = "SELECT * FROM artworks $whereClause ORDER BY $orderBy LIMIT $offset, $perPage";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute($params);
        $artworks = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Obtener conteo de likes para cada obra
        foreach ($artworks as &$artwork) {
            $stmt = $this->conn->prepare("SELECT COUNT(*) FROM likes WHERE artwork_id = ?");
            $stmt->execute([$artwork['id']]);
            $artwork['likes_count'] = $stmt->fetchColumn();
        }

        return [
            'artworks' => $artworks,
            'total' => $total,
            'page' => $page,
            'perPage' => $perPage,
            'totalPages' => ceil($total / $perPage)
        ];
    }

    public function getArtworkById($id) {
        $stmt = $this->conn->prepare("SELECT * FROM artworks WHERE id = ?");
        $stmt->execute([$id]);
        $artwork = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$artwork) {
            return ['success' => false, 'message' => 'Obra no encontrada'];
        }

        // Obtener conteo de likes
        $stmt = $this->conn->prepare("SELECT COUNT(*) FROM likes WHERE artwork_id = ?");
        $stmt->execute([$id]);
        $artwork['likes_count'] = $stmt->fetchColumn();

        // Obtener artista (si está registrado)
        if ($artwork['owner_id']) {
            $stmt = $this->conn->prepare("SELECT username, profile_image_url FROM users WHERE id = ?");
            $stmt->execute([$artwork['owner_id']]);
            $artist = $stmt->fetch(PDO::FETCH_ASSOC);
            $artwork['artist_info'] = $artist;
        }

        return ['success' => true, 'artwork' => $artwork];
    }

    public function uploadArtwork($data, $imagePath, $userId = null) {
        // Validar datos
        $required = ['title', 'artist_name', 'description'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                return ['success' => false, 'message' => "El campo $field es obligatorio"];
            }
        }

        // Insertar obra
        $stmt = $this->conn->prepare("
            INSERT INTO artworks 
            (title, artist_name, description, image_url, creation_year, style, owner_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");

        $stmt->execute([
            $data['title'],
            $data['artist_name'],
            $data['description'],
            $imagePath,
            $data['creation_year'] ?? null,
            $data['style'] ?? null,
            $userId
        ]);

        $artworkId = $this->conn->lastInsertId();

        return [
            'success' => true,
            'message' => 'Obra subida exitosamente',
            'artwork_id' => $artworkId
        ];
    }

    public function toggleLike($artworkId, $userId) {
        // Verificar si ya dio like
        $stmt = $this->conn->prepare("SELECT id FROM likes WHERE artwork_id = ? AND user_id = ?");
        $stmt->execute([$artworkId, $userId]);

        if ($stmt->rowCount() > 0) {
            // Quitar like
            $stmt = $this->conn->prepare("DELETE FROM likes WHERE artwork_id = ? AND user_id = ?");
            $stmt->execute([$artworkId, $userId]);
            $action = 'removed';
        } else {
            // Dar like
            $stmt = $this->conn->prepare("INSERT INTO likes (artwork_id, user_id) VALUES (?, ?)");
            $stmt->execute([$artworkId, $userId]);
            $action = 'added';
        }

        // Obtener nuevo conteo de likes
        $stmt = $this->conn->prepare("SELECT COUNT(*) FROM likes WHERE artwork_id = ?");
        $stmt->execute([$artworkId]);
        $likesCount = $stmt->fetchColumn();

        return [
            'success' => true,
            'action' => $action,
            'likes_count' => $likesCount
        ];
    }

    public function toggleFavorite($artworkId, $userId) {
        // Verificar si ya está en favoritos
        $stmt = $this->conn->prepare("SELECT id FROM favorites WHERE artwork_id = ? AND user_id = ?");
        $stmt->execute([$artworkId, $userId]);

        if ($stmt->rowCount() > 0) {
            // Quitar de favoritos
            $stmt = $this->conn->prepare("DELETE FROM favorites WHERE artwork_id = ? AND user_id = ?");
            $stmt->execute([$artworkId, $userId]);
            $action = 'removed';
        } else {
            // Agregar a favoritos
            $stmt = $this->conn->prepare("INSERT INTO favorites (artwork_id, user_id) VALUES (?, ?)");
            $stmt->execute([$artworkId, $userId]);
            $action = 'added';
        }

        return ['success' => true, 'action' => $action];
    }
}