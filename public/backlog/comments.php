<?php
declare(strict_types=1);

require_once __DIR__ . '/../../database/connection.php';

// Basic CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: ' . $origin);
header('Access-Control-Allow-Methods: POST, OPTIONS');
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
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Method Not Allowed']);
    exit;
  }

  $pdo = Database::getConnection();
  $body = json_input();

  $itemId = isset($body['itemId']) ? (int)$body['itemId'] : 0;
  $text = isset($body['text']) ? trim((string)$body['text']) : '';
  $userId = isset($body['userId']) ? (int)$body['userId'] : 0;

  if ($itemId <= 0 || $text === '' || $userId <= 0) {
    http_response_code(400);
    echo json_encode(['message' => 'Campos obrigatórios: itemId, text, userId']);
    exit;
  }

  // Validate item
  $chkItem = $pdo->prepare('SELECT id FROM itens_backlog WHERE id = ? LIMIT 1');
  $chkItem->execute([$itemId]);
  if (!$chkItem->fetchColumn()) {
    http_response_code(404);
    echo json_encode(['message' => 'Item de backlog não encontrado']);
    exit;
  }

  // Validate user
  $chkUser = $pdo->prepare('SELECT id FROM usuarios WHERE id = ? LIMIT 1');
  $chkUser->execute([$userId]);
  if (!$chkUser->fetchColumn()) {
    http_response_code(404);
    echo json_encode(['message' => 'Usuário não encontrado']);
    exit;
  }

  $ins = $pdo->prepare('INSERT INTO comentarios (item_backlog_id, texto, usuario_id) VALUES (?, ?, ?)');
  $ins->execute([$itemId, $text, $userId]);
  $id = (int)$pdo->lastInsertId();

  // Return created comment
  $stmt = $pdo->prepare('SELECT id, item_backlog_id, texto, usuario_id, created_at FROM comentarios WHERE id = ?');
  $stmt->execute([$id]);
  $row = $stmt->fetch() ?: [];
  echo json_encode([
    'id' => (int)$row['id'],
    'text' => (string)$row['texto'],
    'userId' => (int)$row['usuario_id'],
    'createdAt' => (string)$row['created_at'],
  ]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['message' => 'Server error', 'error' => $e->getMessage()]);
}


