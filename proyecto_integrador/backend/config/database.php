<?php
// backend/config/database.php

define('DB_HOST', 'localhost'); 
define('DB_NAME', 'galeria_arte'); 
define('DB_USER', 'root');     
define('DB_PASS', '');         

// Opcional: Configuración para el conjunto de caracteres y modo de errores de PDO
define('DB_CHARSET', 'utf8mb4');
define('DB_OPTIONS', [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // Lanza excepciones en caso de errores
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // Devuelve los resultados como arrays asociativos
    PDO::ATTR_EMULATE_PREPARES   => false,                  // Desactiva la emulación de sentencias preparadas para mayor seguridad
]);


?>