-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 15-07-2025 a las 09:43:48
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `galeria_arte`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `artworks`
--

CREATE TABLE `artworks` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `artist_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `image_url` varchar(255) NOT NULL,
  `creation_year` int(11) DEFAULT NULL,
  `style` varchar(100) DEFAULT NULL,
  `owner_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `artworks`
--

INSERT INTO `artworks` (`id`, `title`, `artist_name`, `description`, `image_url`, `creation_year`, `style`, `owner_id`, `created_at`) VALUES
(2, 'Perfil Twish', 'Niniusky', 'Una imagen que le hice a mi novio para su canal ', 'img/uploaded_artworks/artwork_6875d99d5c18b9.76116442.jpg', 2025, 'Digital', 3, '2025-07-15 04:31:25'),
(3, 'Pez Caballo', 'niuSkyArt', 'Dibujo que hice para un concurso e igual no quede', 'img/uploaded_artworks/artwork_6875e71f8e1385.02114025.jpg', 2025, 'digital', 3, '2025-07-15 05:29:03'),
(4, 'kinichi', 'niuSkyArt', 'EL kinichi del juego de Genshin impact', 'img/uploaded_artworks/artwork_6875ecb1608f91.30338257.jpg', 2024, 'Digital', 3, '2025-07-15 05:52:49');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `comments`
--

CREATE TABLE `comments` (
  `id` int(11) NOT NULL,
  `artwork_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `comment_text` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `comments`
--

INSERT INTO `comments` (`id`, `artwork_id`, `user_id`, `comment_text`, `created_at`) VALUES
(1, 2, 3, 'me gusta este arte', '2025-07-15 05:23:52');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `favorites`
--

CREATE TABLE `favorites` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `artwork_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `favorites`
--

INSERT INTO `favorites` (`id`, `user_id`, `artwork_id`, `created_at`) VALUES
(1, 3, 2, '2025-07-15 05:04:06');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `likes`
--

CREATE TABLE `likes` (
  `id` int(11) NOT NULL,
  `artwork_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `likes`
--

INSERT INTO `likes` (`id`, `artwork_id`, `user_id`, `created_at`) VALUES
(1, 2, 3, '2025-07-15 05:23:44');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `profile_image_url` varchar(255) DEFAULT 'https://placehold.co/150x150/cccccc/333333?text=User'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `created_at`, `profile_image_url`) VALUES
(1, 'niuska', 'ejemplo2@gmail.com', '$2y$10$hydPYBHcRXjpOwpUo2KSlO2MUfxjyfur6CRNCSeHwX4LZdiNc9Dx.', '2025-07-14 02:58:08', 'https://placehold.co/150x150/cccccc/333333?text=User'),
(2, 'admin', 'ejemplo4@gmail.com', '$2y$10$zL4kKvBz5mWuMkWHDqacGezWkiIxdaKOBAMLRiVjxY3ifzvL1NSGG', '2025-07-14 03:47:15', 'https://placehold.co/150x150/cccccc/333333?text=User'),
(3, 'nini', 'niuska2@ejemplo.com', '$2y$10$SFi51qwofvzvNNox/gthp.aNGWuCPMCzQWhQkYGnOD/fug8xLvrLS', '2025-07-15 00:20:12', 'https://placehold.co/150x150/cccccc/333333?text=User');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `artworks`
--
ALTER TABLE `artworks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `owner_id` (`owner_id`);

--
-- Indices de la tabla `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indices de la tabla `comments`
--
ALTER TABLE `comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `artwork_id` (`artwork_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indices de la tabla `favorites`
--
ALTER TABLE `favorites`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`,`artwork_id`),
  ADD KEY `artwork_id` (`artwork_id`);

--
-- Indices de la tabla `likes`
--
ALTER TABLE `likes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `artwork_id` (`artwork_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indices de la tabla `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `artworks`
--
ALTER TABLE `artworks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `comments`
--
ALTER TABLE `comments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `favorites`
--
ALTER TABLE `favorites`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `likes`
--
ALTER TABLE `likes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `artworks`
--
ALTER TABLE `artworks`
  ADD CONSTRAINT `artworks_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `comments`
--
ALTER TABLE `comments`
  ADD CONSTRAINT `comments_ibfk_1` FOREIGN KEY (`artwork_id`) REFERENCES `artworks` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `favorites`
--
ALTER TABLE `favorites`
  ADD CONSTRAINT `favorites_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `favorites_ibfk_2` FOREIGN KEY (`artwork_id`) REFERENCES `artworks` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `likes`
--
ALTER TABLE `likes`
  ADD CONSTRAINT `likes_ibfk_1` FOREIGN KEY (`artwork_id`) REFERENCES `artworks` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `likes_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
