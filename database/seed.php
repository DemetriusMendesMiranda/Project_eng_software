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

    // Ensure a demo team exists
    $teamName = 'Time Alpha';
    $stmtTeam = $pdo->prepare('SELECT id FROM times WHERE nome = ? LIMIT 1');
    $stmtTeam->execute([$teamName]);
    $teamId = (int)($stmtTeam->fetchColumn() ?: 0);
    if ($teamId === 0) {
        $insTeam = $pdo->prepare('INSERT INTO times (nome) VALUES (?)');
        $insTeam->execute([$teamName]);
        $teamId = (int)$pdo->lastInsertId();
        echo "Created team: {$teamName} (id {$teamId})\n";
    } else {
        echo "Team already exists: {$teamName} (id {$teamId})\n";
    }

    // Map user emails to IDs
    $emailToId = [];
    $stmtUsers = $pdo->query('SELECT id, email FROM usuarios');
    foreach ($stmtUsers->fetchAll() as $u) {
        $emailToId[strtolower((string)$u['email'])] = (int)$u['id'];
    }

    // Ensure team membership (add Scrum Master, PO, and Dev)
    $memberEmails = ['john@scrum.com', 'sarah@scrum.com', 'mike@scrum.com'];
    $existsTU = $pdo->prepare('SELECT 1 FROM times_usuarios WHERE time_id = ? AND usuario_id = ? LIMIT 1');
    $insTU = $pdo->prepare('INSERT INTO times_usuarios (time_id, usuario_id) VALUES (?, ?)');
    foreach ($memberEmails as $mEmail) {
        $uid = $emailToId[strtolower($mEmail)] ?? 0;
        if ($uid > 0) {
            $existsTU->execute([$teamId, $uid]);
            if (!$existsTU->fetchColumn()) {
                $insTU->execute([$teamId, $uid]);
                echo "Added user {$mEmail} to team {$teamName}\n";
            }
        }
    }

    // Ensure a demo project exists linking PO, SM, and the team
    $poId = $emailToId['sarah@scrum.com'] ?? 0;
    $smId = $emailToId['john@scrum.com'] ?? 0;
    if ($poId > 0 && $smId > 0 && $teamId > 0) {
        $projectName = 'Projeto Demo';
        $chkProj = $pdo->prepare('SELECT id FROM projetos WHERE nome = ? LIMIT 1');
        $chkProj->execute([$projectName]);
        $projectId = (int)($chkProj->fetchColumn() ?: 0);
        if ($projectId === 0) {
            $insProj = $pdo->prepare('
                INSERT INTO projetos (nome, descricao, data_inicio, data_fim_prevista, arquivado, product_owner_id, scrum_master_id, time_id)
                VALUES (?, ?, NULL, NULL, 0, ?, ?, ?)
            ');
            $insProj->execute([$projectName, 'Projeto de demonstração', $poId, $smId, $teamId]);
            $projectId = (int)$pdo->lastInsertId();
            echo "Created project: {$projectName} (id {$projectId})\n";
        } else {
            // Ensure associations are consistent
            $updProj = $pdo->prepare('UPDATE projetos SET product_owner_id = ?, scrum_master_id = ?, time_id = ? WHERE id = ?');
            $updProj->execute([$poId, $smId, $teamId, $projectId]);
            echo "Updated project associations for: {$projectName} (id {$projectId})\n";
        }
    } else {
        echo "Warning: Could not create demo project (missing PO/SM/team IDs)\n";
    }

    echo "Done.\n";
} catch (Throwable $e) {
    fwrite(STDERR, "Seed error: " . $e->getMessage() . "\n");
    exit(1);
}


