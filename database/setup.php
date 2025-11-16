<?php
declare(strict_types=1);

require_once __DIR__ . '/connection.php';

/**
 * Apply the base schema from schema.sql in an idempotent way.
 * This is safe to run multiple times thanks to IF NOT EXISTS and additive ALTERs.
 */
function applySchema(PDO $pdo, string $schemaPath): void
{
    if (!is_file($schemaPath)) {
        throw new RuntimeException("Schema file not found: {$schemaPath}");
    }
    $sql = file_get_contents($schemaPath);
    if ($sql === false) {
        throw new RuntimeException("Failed to read schema file: {$schemaPath}");
    }

    // Remove single-line comments starting with --
    $lines = preg_split('/\R/', $sql) ?: [];
    $buffer = '';
    foreach ($lines as $line) {
        if (preg_match('/^\s*--/', $line)) {
            continue;
        }
        $buffer .= $line . "\n";
    }

    // Split by semicolons into statements
    $statements = array_filter(
        array_map('trim', explode(';', $buffer)),
        static fn($stmt) => $stmt !== ''
    );

    foreach ($statements as $stmt) {
        $normalized = ltrim(strtolower($stmt));
        // Apply only base CREATE statements here; let migrate.php handle ALTER/INDEX variations
        if (str_starts_with($normalized, 'create table') || str_starts_with($normalized, 'create database')) {
            $pdo->exec($stmt);
        }
        // Skip ALTER TABLE / CREATE INDEX statements here for broad MySQL compatibility
    }
}

try {
    $pdo = Database::getConnection();
    applySchema($pdo, __DIR__ . '/schema.sql');
    echo "Base schema applied successfully.\n";
} catch (Throwable $e) {
    fwrite(STDERR, "Setup error: " . $e->getMessage() . "\n");
    exit(1);
}

?>


