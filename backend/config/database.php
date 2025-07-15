<?php

$host = getenv('MYSQLHOST') ?: 'mysql.railway.internal' ; // O getenv('DB_HOST') si prefieres ese nombre
$dbname = getenv('MYSQL_DATABASE') ?: 'railway' ; // O getenv('DB_NAME')
$user = getenv('MYSQLUSER') ?: 'root' ; // O getenv('DB_USER')
$pass = getenv('MYSQL_PASSWORD') ?: 'QeRgdiFiOXiYxLiUHgrlxZCTlGWBiUzJ' ; // O getenv('DB_PASSWORD')
$port = getenv('MYSQLPORT') ?: '3306'; // O getenv('DB_PORT')

try {
    $conn = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error en la conexión: " . $e->getMessage()]);
    exit;
}
