<?php
declare(strict_types=1);

require_once __DIR__ . '/connection.php';

/**
 * Seed demo users into the database with hashed passwords and roles.
 *
 * Run locally:
 *   php database/seed.php
 */

function upsert_user(PDO $pdo, string $name, string $email, string $password): int
{
    $stmt = $pdo->prepare('SELECT id FROM usuarios WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $existingId = $stmt->fetchColumn();

    $hash = password_hash($password, PASSWORD_BCRYPT);

    if ($existingId) {
        $upd = $pdo->prepare('UPDATE usuarios SET nome = ?, senha_hash = ? WHERE id = ?');
        $upd->execute([$name, $hash, (int)$existingId]);
        return (int)$existingId;
    }

    $ins = $pdo->prepare('INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)');
    $ins->execute([$name, $email, $hash]);
    return (int)$pdo->lastInsertId();
}

function ensure_role(PDO $pdo, string $table, int $userId): void
{
    $stmt = $pdo->prepare("SELECT 1 FROM {$table} WHERE usuario_id = ? LIMIT 1");
    $stmt->execute([$userId]);
    if (!$stmt->fetchColumn()) {
        $ins = $pdo->prepare("INSERT INTO {$table} (usuario_id) VALUES (?)");
        $ins->execute([$userId]);
    }
}

try {
    $pdo = Database::getConnection();

    $users = [
        ['Super Admin', 'admin@scrum.com', 'admin123', null], // SuperAdmin via email convention
        ['John Scrum', 'john@scrum.com', 'scrum123', 'scrum_masters'],
        ['Sarah Product', 'sarah@scrum.com', 'product123', 'product_owners'],
        ['Mike Dev', 'mike@scrum.com', 'dev123', 'membros_dev'],
    ];

    foreach ($users as [$name, $email, $password, $roleTable]) {
        $id = upsert_user($pdo, $name, $email, $password);
        if ($roleTable) {
            ensure_role($pdo, $roleTable, $id);
        }
        echo "Seeded/updated user: {$email} (id {$id})\n";
    }

    echo "Done.\n";
} catch (Throwable $e) {
    fwrite(STDERR, "Seed error: " . $e->getMessage() . "\n");
    exit(1);
}


