<?php
// backend/config/database.php

// Esta clase ahora encapsula la configuración y la lógica de conexión.
class Database {
    private $host = "localhost";
    private $db_name = "galeria_arte"; // Asegúrate de que este sea el nombre correcto de tu DB
    private $username = "root";       // Tu usuario de MySQL
    private $password = "";           // Tu contraseña de MySQL (vacía para XAMPP por defecto)
    public $conn;

    /**
     * Obtiene la conexión PDO a la base de datos.
     * @return PDO La instancia de la conexión PDO, o null en caso de error.
     */
    public function getConnection() {
        $this->conn = null; // Reinicia la conexión para cada llamada (o puedes implementar un singleton si prefieres)

        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                $this->username,
                $this->password
            );
            // Establecer el juego de caracteres a UTF-8 para evitar problemas con caracteres especiales
            $this->conn->exec("set names utf8mb4");
            // Configurar el modo de errores para lanzar excepciones
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            // Configurar el modo de fetch por defecto a asociativo
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            // Desactivar la emulación de sentencias preparadas para mayor seguridad
            $this->conn->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);

        } catch(PDOException $exception) {
            // En un entorno de producción, es mejor registrar el error en un log
            // y no mostrar el mensaje detallado al usuario por seguridad.
            error_log("Error de conexión a la base de datos: " . $exception->getMessage());
            // Detener la ejecución y enviar una respuesta de error al frontend
            http_response_code(500); // Internal Server Error
            echo json_encode(["message" => "Error de conexión con la base de datos."]);
            exit(); // Termina el script
        }

        return $this->conn;
    }
}
?>