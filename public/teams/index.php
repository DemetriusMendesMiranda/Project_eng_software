<?php
declare(strict_types=1);

require_once __DIR__ . '/../../database/connection.php';

// Basic CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: ' . $origin);
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
if ($origin !== '*') {
  header('Vary: Origin');
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  echo json_encode(['ok' => true]);
  exit;
}

function json_input(): array
{
  $raw = file_get_contents('php://input') ?: '';
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}

function fetchTeams(PDO $pdo): array
{
  // Fetch basic team info and related project id (if any)
  $stmt = $pdo->query('
    SELECT 
      t.id,
      t.nome,
      (SELECT p.id FROM projetos p WHERE p.time_id = t.id LIMIT 1) AS project_id
    FROM times t
    ORDER BY t.id DESC
  ');
  $rows = $stmt->fetchAll() ?: [];

  // Fetch members for all teams in one go
  $teamIds = array_map(static function ($r) { return (int)$r['id']; }, $rows);
  $memberMap = [];
  if (count($teamIds) > 0) {
    $in = implode(',', array_fill(0, count($teamIds), '?'));
    $stmtM = $pdo->prepare("SELECT time_id, usuario_id FROM times_usuarios WHERE time_id IN ($in)");
    $stmtM->execute($teamIds);
    foreach ($stmtM->fetchAll() as $m) {
      $tid = (int)$m['time_id'];
      $uid = (int)$m['usuario_id'];
      if (!isset($memberMap[$tid])) {
        $memberMap[$tid] = [];
      }
      $memberMap[$tid][] = $uid;
    }
  }

  $teams = [];
  foreach ($rows as $r) {
    $id = (int)$r['id'];
    $teams[] = [
      'id' => $id,
      'name' => (string)$r['nome'],
      'projectId' => isset($r['project_id']) ? (int)$r['project_id'] : 0,
      'memberIds' => $memberMap[$id] ?? [],
    ];
  }
  return $teams;
}

try {
  $pdo = Database::getConnection();

  if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode(fetchTeams($pdo));
    exit;
  }

  if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = json_input();
    $name = isset($body['name']) ? trim((string)$body['name']) : '';
    $projectId = isset($body['projectId']) ? (int)$body['projectId'] : 0;

    if ($name === '') {
      http_response_code(400);
      echo json_encode(['message' => 'Campo obrigatório: name']);
      exit;
    }

    // Create team
    $ins = $pdo->prepare('INSERT INTO times (nome) VALUES (?)');
    $ins->execute([$name]);
    $teamId = (int)$pdo->lastInsertId();

    // Optionally assign team to project if a valid projectId was provided
    if ($projectId > 0) {
      $chk = $pdo->prepare('SELECT id FROM projetos WHERE id = ? LIMIT 1');
      $chk->execute([$projectId]);
      if ($chk->fetchColumn()) {
        $upd = $pdo->prepare('UPDATE projetos SET time_id = ? WHERE id = ?');
        $upd->execute([$teamId, $projectId]);
      }
    }

    echo json_encode([
      'id' => $teamId,
      'name' => $name,
      'projectId' => $projectId > 0 ? $projectId : 0,
      'memberIds' => [],
    ]);
    exit;
  }

  if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $body = json_input();
    $id = isset($body['id']) ? (int)$body['id'] : 0;
    $name = isset($body['name']) ? trim((string)$body['name']) : null;
    $projectId = isset($body['projectId']) ? (int)$body['projectId'] : null;

    if ($id <= 0) {
      http_response_code(400);
      echo json_encode(['message' => 'ID inválido']);
      exit;
    }

    // Ensure team exists
    $chkTeam = $pdo->prepare('SELECT id FROM times WHERE id = ? LIMIT 1');
    $chkTeam->execute([$id]);
    if (!$chkTeam->fetchColumn()) {
      http_response_code(404);
      echo json_encode(['message' => 'Time não encontrado']);
      exit;
    }

    if ($name !== null) {
      $updName = $pdo->prepare('UPDATE times SET nome = ? WHERE id = ?');
      $updName->execute([$name, $id]);
    }

    if ($projectId !== null) {
      // Validate project
      $chkProj = $pdo->prepare('SELECT id FROM projetos WHERE id = ? LIMIT 1');
      $chkProj->execute([$projectId]);
      if (!$chkProj->fetchColumn()) {
        http_response_code(404);
        echo json_encode(['message' => 'Projeto não encontrado']);
        exit;
      }
      // Move association: set this project to use this team
      $updProj = $pdo->prepare('UPDATE projetos SET time_id = ? WHERE id = ?');
      $updProj->execute([$id, $projectId]);
    }

    // Return updated snapshot
    $teams = fetchTeams($pdo);
    $updated = null;
    foreach ($teams as $t) {
      if ((int)$t['id'] === $id) {
        $updated = $t;
        break;
      }
    }
    echo json_encode($updated ?? ['id' => $id]);
    exit;
  }

  http_response_code(405);
  echo json_encode(['message' => 'Method Not Allowed']);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['message' => 'Server error', 'error' => $e->getMessage()]);
}


