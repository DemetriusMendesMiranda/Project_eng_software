FROM php:8.2-cli

WORKDIR /app

# Copy application source
COPY . /app

# Install common extensions used for MySQL connections
RUN docker-php-ext-install pdo pdo_mysql mysqli

# Expose a default port for local runs; Render will set $PORT
EXPOSE 8080

# Start PHP built-in server binding to Render's $PORT and serving ./public
CMD ["sh", "-c", "php -S 0.0.0.0:${PORT:-8080} -t public"]

