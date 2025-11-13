<?php
declare(strict_types=1);

require_once __DIR__ . '/../../database/connection.php';

// Basic CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: ' . $origin);
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
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

function map_task_row(array $row): array
{
  return [
    'id' => (int)$row['id'],
    'description' => (string)($row['descricao'] ?? ''),
    'points' => isset($row['pontos']) ? (int)$row['pontos'] : 0,
    'status' => (string)$row['status'],
    'itemBacklogId' => (int)$row['item_backlog_id'],
    'assignedToId' => isset($row['membro_dev_id']) ? (int)$row['membro_dev_id'] : null,
  ];
}

try {
  $pdo = Database::getConnection();

  if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->query('SELECT id, titulo, descricao, status, estimativa_horas, pontos, item_backlog_id, membro_dev_id FROM tarefas ORDER BY id DESC');
    $rows = $stmt->fetchAll() ?: [];
    echo json_encode(array_map('map_task_row', $rows));
    exit;
  }

  if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = json_input();
    $description = isset($body['description']) ? trim((string)$body['description']) : '';
    $points = isset($body['points']) ? (int)$body['points'] : 0;
    $status = isset($body['status']) ? trim((string)$body['status']) : '';
    $itemBacklogId = isset($body['itemBacklogId']) ? (int)$body['itemBacklogId'] : 0;
    $assignedToId = isset($body['assignedToId']) ? (int)$body['assignedToId'] : null;

    if ($description === '' || $status === '' || $itemBacklogId <= 0) {
      http_response_code(400);
      echo json_encode(['message' => 'Campos obrigatórios: description, status, itemBacklogId']);
      exit;
    }

    // Validate item backlog
    $chkIb = $pdo->prepare('SELECT id FROM itens_backlog WHERE id = ? LIMIT 1');
    $chkIb->execute([$itemBacklogId]);
    if (!$chkIb->fetchColumn()) {
      http_response_code(404);
      echo json_encode(['message' => 'Item de backlog não encontrado']);
      exit;
    }

    // Validate assigned user is a developer (if provided)
    if ($assignedToId !== null) {
      $chkDev = $pdo->prepare('SELECT 1 FROM membros_dev WHERE usuario_id = ? LIMIT 1');
      $chkDev->execute([$assignedToId]);
      if (!$chkDev->fetchColumn()) {
        http_response_code(404);
        echo json_encode(['message' => 'Usuário (Developer) não encontrado']);
        exit;
      }
    }

    $title = mb_substr($description, 0, 150);
    $ins = $pdo->prepare('
      INSERT INTO tarefas (titulo, descricao, status, estimativa_horas, pontos, item_backlog_id, membro_dev_id)
      VALUES (?, ?, ?, NULL, ?, ?, ?)
    ');
    $ins->execute([$title, $description, $status, $points, $itemBacklogId, $assignedToId]);
    $id = (int)$pdo->lastInsertId();

    $stmt = $pdo->prepare('SELECT id, titulo, descricao, status, estimativa_horas, pontos, item_backlog_id, membro_dev_id FROM tarefas WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch() ?: [];
    echo json_encode(map_task_row($row));
    exit;
  }

  if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $body = json_input();
    $id = isset($body['id']) ? (int)$body['id'] : 0;
    if ($id <= 0) {
      http_response_code(400);
      echo json_encode(['message' => 'ID inválido']);
      exit;
    }

    // Ensure task exists
    $chk = $pdo->prepare('SELECT id FROM tarefas WHERE id = ? LIMIT 1');
    $chk->execute([$id]);
    if (!$chk->fetchColumn()) {
      http_response_code(404);
      echo json_encode(['message' => 'Tarefa não encontrada']);
      exit;
    }

    // Build dynamic update
    $fields = [];
    $values = [];
    if (array_key_exists('description', $body)) {
      $fields[] = 'descricao = ?';
      $values[] = (string)$body['description'];
      // Keep title in sync (first 150 chars)
      $fields[] = 'titulo = ?';
      $values[] = mb_substr((string)$body['description'], 0, 150);
    }
    if (array_key_exists('points', $body)) {
      $fields[] = 'pontos = ?';
      $values[] = (int)$body['points'];
    }
    if (array_key_exists('status', $body)) {
      $fields[] = 'status = ?';
      $values[] = (string)$body['status'];
    }
    if (array_key_exists('itemBacklogId', $body)) {
      $newIb = (int)$body['itemBacklogId'];
      $chkIb = $pdo->prepare('SELECT id FROM itens_backlog WHERE id = ? LIMIT 1');
      $chkIb->execute([$newIb]);
      if (!$chkIb->fetchColumn()) {
        http_response_code(404);
        echo json_encode(['message' => 'Item de backlog não encontrado']);
        exit;
      }
      $fields[] = 'item_backlog_id = ?';
      $values[] = $newIb;
    }
    if (array_key_exists('assignedToId', $body)) {
      $uid = $body['assignedToId'] !== null ? (int)$body['assignedToId'] : null;
      if ($uid !== null) {
        $chkDev = $pdo->prepare('SELECT 1 FROM membros_dev WHERE usuario_id = ? LIMIT 1');
        $chkDev->execute([$uid]);
        if (!$chkDev->fetchColumn()) {
          http_response_code(404);
          echo json_encode(['message' => 'Usuário (Developer) não encontrado']);
          exit;
        }
      }
      $fields[] = 'membro_dev_id = ?';
      $values[] = $uid;
    }

    if (empty($fields)) {
      http_response_code(400);
      echo json_encode(['message' => 'Nenhum campo para atualizar']);
      exit;
    }

    $values[] = $id;
    $sql = 'UPDATE tarefas SET ' . implode(', ', $fields) . ' WHERE id = ?';
    $upd = $pdo->prepare($sql);
    $upd->execute($values);

    $stmt = $pdo->prepare('SELECT id, titulo, descricao, status, estimativa_horas, pontos, item_backlog_id, membro_dev_id FROM tarefas WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch() ?: [];
    echo json_encode(map_task_row($row));
    exit;
  }

  if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $body = json_input();
    $id = isset($body['id']) ? (int)$body['id'] : 0;
    if ($id <= 0) {
      http_response_code(400);
      echo json_encode(['message' => 'ID inválido']);
      exit;
    }
    $del = $pdo->prepare('DELETE FROM tarefas WHERE id = ?');
    $del->execute([$id]);
    http_response_code(204);
    exit;
  }

  http_response_code(405);
  echo json_encode(['message' => 'Method Not Allowed']);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['message' => 'Server error', 'error' => $e->getMessage()]);
}


