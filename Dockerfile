# Dockerfile

# Usar una imagen base de PHP (no solo fpm, para tener el cli y el servidor integrado)
# Podemos usar una imagen de PHP completa, por ejemplo, php:8.2-alpine
FROM php:8.2-alpine

# Instalar extensiones PHP necesarias
RUN docker-php-ext-install pdo_mysql opcache \
    && docker-php-ext-enable opcache

# Copiar el archivo php.ini personalizado
COPY php.ini /usr/local/etc/php/conf.d/

# Establecer el directorio de trabajo dentro del contenedor
# Aquí es donde se copiará tu código
WORKDIR /app

# Copiar todo tu código de la aplicación al directorio de trabajo
COPY . /app

# Exponer el puerto que el servidor PHP integrado va a usar
# Puedes usar 8000, 5000, o cualquier otro puerto que Railway mapeará al $PORT externo
EXPOSE 8000

# Comando para iniciar el servidor web integrado de PHP
# Esto servirá tanto los archivos estáticos como los scripts PHP
CMD ["php", "-S", "0.0.0.0:8000", "-t", "."]
