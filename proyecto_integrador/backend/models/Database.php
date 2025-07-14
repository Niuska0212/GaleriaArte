<?php
// backend/models/Database.php

require_once __DIR__ . '/../config/database.php'; // Asegúrate de que la ruta sea correcta

class Database {
    private $host = DB_HOST;
    private $db_name = DB_NAME;
    private $username = DB_USER;
    private $password = DB_PASS;
    private $charset = DB_CHARSET;
    private $options = DB_OPTIONS;
    public $conn;


    public function __construct() {
        $this->conn = null;
        try {
            $dsn = "mysql:host={$this->host};dbname={$this->db_name};charset={$this->charset}";
            $this->conn = new PDO($dsn, $this->username, $this->password, $this->options);
            // echo "Conexión a la base de datos exitosa."; // Solo para depuración inicial
        } catch (PDOException $exception) {
            // En un entorno de producción, es mejor registrar el error en un log
            // y mostrar un mensaje genérico al usuario.
            error_log("Error de conexión a la base de datos: " . $exception->getMessage());
            die("Error de conexión a la base de datos: " . $exception->getMessage());
        }
    }

    /**
     * Obtiene la conexión PDO.
     * @return PDO La instancia de la conexión PDO.
     */
    public function getConnection() {
        return $this->conn;
    }

    /**
     * Cierra la conexión a la base de datos.
     */
    public function closeConnection() {
        $this->conn = null;
    }
}

?>
