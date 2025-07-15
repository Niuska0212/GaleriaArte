<?php
// proyecto_integrador/backend/config/database.php
$host = "localhost";
$dbname = "galeria_arte"; 
$user = "root";
$pass = ""; 

try {
    $conn = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error en la conexión: " . $e->getMessage()]);
    exit;
}
