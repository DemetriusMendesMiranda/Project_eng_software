<?php
declare(strict_types=1);

require_once __DIR__ . '/../../database/connection.php';

// Basic CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: ' . $origin);
header('Access-Control-Allow-Methods: POST, DELETE, OPTIONS');
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

try {
  $pdo = Database::getConnection();
  $body = json_input();
  $teamId = isset($body['teamId']) ? (int)$body['teamId'] : 0;
  $userId = isset($body['userId']) ? (int)$body['userId'] : 0;

  if ($teamId <= 0 || $userId <= 0) {
    http_response_code(400);
    echo json_encode(['message' => 'Campos obrigatórios: teamId, userId']);
    exit;
  }

  // Validate team and user
  $chkTeam = $pdo->prepare('SELECT id FROM times WHERE id = ? LIMIT 1');
  $chkTeam->execute([$teamId]);
  if (!$chkTeam->fetchColumn()) {
    http_response_code(404);
    echo json_encode(['message' => 'Time não encontrado']);
    exit;
  }

  $chkUser = $pdo->prepare('SELECT id FROM usuarios WHERE id = ? LIMIT 1');
  $chkUser->execute([$userId]);
  if (!$chkUser->fetchColumn()) {
    http_response_code(404);
    echo json_encode(['message' => 'Usuário não encontrado']);
    exit;
  }

  if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Add member
    $exists = $pdo->prepare('SELECT 1 FROM times_usuarios WHERE time_id = ? AND usuario_id = ? LIMIT 1');
    $exists->execute([$teamId, $userId]);
    if (!$exists->fetchColumn()) {
      $ins = $pdo->prepare('INSERT INTO times_usuarios (time_id, usuario_id) VALUES (?, ?)');
      $ins->execute([$teamId, $userId]);
    }
    echo json_encode(['ok' => true]);
    exit;
  }

  if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    // Remove member
    $del = $pdo->prepare('DELETE FROM times_usuarios WHERE time_id = ? AND usuario_id = ?');
    $del->execute([$teamId, $userId]);
    echo json_encode(['ok' => true]);
    exit;
  }

  http_response_code(405);
  echo json_encode(['message' => 'Method Not Allowed']);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['message' => 'Server error', 'error' => $e->getMessage()]);
}


