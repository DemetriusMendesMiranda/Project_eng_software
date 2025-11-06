<?php

/**
 * Simple PDO MySQL connection helper.
 *
 * Environment variables (with defaults):
 * - DB_HOST (default: 127.0.0.1)
 * - DB_PORT (default: 3306)
 * - DB_NAME (default: scrum_db)
 * - DB_USER (default: root)
 * - DB_PASS (default: empty)
 * - DB_CHARSET (default: utf8mb4)
 */
class Database
{
    /** @var \PDO|null */
    private static $connection = null;

    /**
     * Get a shared PDO connection to MySQL.
     *
     * @return \PDO
     * @throws \PDOException if the connection fails
     */
    public static function getConnection()
    {
        if (self::$connection instanceof \PDO) {
            return self::$connection;
        }

        $host = getenv('DB_HOST') !== false ? getenv('DB_HOST') : '127.0.0.1';
        $port = getenv('DB_PORT') !== false ? getenv('DB_PORT') : '3306';
        $name = getenv('DB_NAME') !== false ? getenv('DB_NAME') : 'scrum_db';
        $user = getenv('DB_USER') !== false ? getenv('DB_USER') : 'root';
        $pass = getenv('DB_PASS') !== false ? getenv('DB_PASS') : '';
        $charset = getenv('DB_CHARSET') !== false ? getenv('DB_CHARSET') : 'utf8mb4';

        $dsn = "mysql:host={$host};port={$port};dbname={$name};charset={$charset}";

        $options = [
            \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
            \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
            \PDO::ATTR_EMULATE_PREPARES => false,
        ];

        self::$connection = new \PDO($dsn, $user, $pass, $options);
        return self::$connection;
    }

    /**
     * Close the shared connection.
     */
    public static function close()
    {
        self::$connection = null;
    }
}


