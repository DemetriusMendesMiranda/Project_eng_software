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
  $id = isset($body['id']) ? (int)$body['id'] : 0;

  if ($id <= 0) {
    http_response_code(400);
    echo json_encode(['message' => 'ID inválido']);
    exit;
  }

  $upd = $pdo->prepare('UPDATE projetos SET arquivado = 1 WHERE id = ?');
  $upd->execute([$id]);

  echo json_encode(['ok' => true]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['message' => 'Server error', 'error' => $e->getMessage()]);
}


