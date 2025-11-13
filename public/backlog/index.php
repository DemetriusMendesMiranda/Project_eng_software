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

function map_comment_row(array $row): array
{
  return [
    'id' => (int)$row['id'],
    'text' => (string)$row['texto'],
    'userId' => (int)$row['usuario_id'],
    'createdAt' => (string)$row['created_at'],
  ];
}

function map_item_row(array $row, array $comments): array
{
  return [
    'id' => (int)$row['id'],
    'title' => (string)$row['titulo'],
    'description' => (string)($row['descricao'] ?? ''),
    'priority' => (int)$row['prioridade'],
    'estimation' => isset($row['estimativa']) ? (int)$row['estimativa'] : 0,
    'status' => (string)$row['status'],
    'projectId' => (int)$row['projeto_id'],
    'sprintId' => isset($row['sprint_id']) ? (int)$row['sprint_id'] : null,
    'assignedToId' => isset($row['assigned_to_id']) ? (int)$row['assigned_to_id'] : null,
    'comments' => $comments,
  ];
}

function fetchItems(PDO $pdo): array
{
  $stmt = $pdo->query('SELECT id, titulo, descricao, prioridade, estimativa, status, projeto_id, sprint_id, assigned_to_id FROM itens_backlog ORDER BY id DESC');
  $rows = $stmt->fetchAll() ?: [];

  $itemIds = array_map(static function ($r) { return (int)$r['id']; }, $rows);
  $commentsMap = [];
  if (count($itemIds) > 0) {
    $in = implode(',', array_fill(0, count($itemIds), '?'));
    $stmtC = $pdo->prepare("SELECT id, item_backlog_id, texto, usuario_id, created_at FROM comentarios WHERE item_backlog_id IN ($in) ORDER BY created_at ASC, id ASC");
    $stmtC->execute($itemIds);
    foreach ($stmtC->fetchAll() as $c) {
      $ib = (int)$c['item_backlog_id'];
      if (!isset($commentsMap[$ib])) {
        $commentsMap[$ib] = [];
      }
      $commentsMap[$ib][] = map_comment_row($c);
    }
  }

  $items = [];
  foreach ($rows as $row) {
    $id = (int)$row['id'];
    $items[] = map_item_row($row, $commentsMap[$id] ?? []);
  }
  return $items;
}

try {
  $pdo = Database::getConnection();

  if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode(fetchItems($pdo));
    exit;
  }

  if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = json_input();
    $title = isset($body['title']) ? trim((string)$body['title']) : '';
    $description = isset($body['description']) ? (string)$body['description'] : '';
    $priority = isset($body['priority']) ? (int)$body['priority'] : 0;
    $estimation = isset($body['estimation']) ? (int)$body['estimation'] : 0;
    $status = isset($body['status']) ? (string)$body['status'] : 'ToDo';
    $projectId = isset($body['projectId']) ? (int)$body['projectId'] : 0;
    $sprintId = isset($body['sprintId']) ? (int)$body['sprintId'] : null;
    $assignedToId = isset($body['assignedToId']) ? (int)$body['assignedToId'] : null;

    if ($title === '' || $priority <= 0 || $projectId <= 0) {
      http_response_code(400);
      echo json_encode(['message' => 'Campos obrigatórios: title, priority, projectId']);
      exit;
    }

    // Validate project
    $chkProj = $pdo->prepare('SELECT id FROM projetos WHERE id = ? LIMIT 1');
    $chkProj->execute([$projectId]);
    if (!$chkProj->fetchColumn()) {
      http_response_code(404);
      echo json_encode(['message' => 'Projeto não encontrado']);
      exit;
    }

    // Validate sprint (optional)
    if ($sprintId !== null) {
      $chkSpr = $pdo->prepare('SELECT id FROM sprints WHERE id = ? LIMIT 1');
      $chkSpr->execute([$sprintId]);
      if (!$chkSpr->fetchColumn()) {
        http_response_code(404);
        echo json_encode(['message' => 'Sprint não encontrada']);
        exit;
      }
    }

    // Validate user (optional)
    if ($assignedToId !== null) {
      $chkUser = $pdo->prepare('SELECT id FROM usuarios WHERE id = ? LIMIT 1');
      $chkUser->execute([$assignedToId]);
      if (!$chkUser->fetchColumn()) {
        http_response_code(404);
        echo json_encode(['message' => 'Usuário não encontrado']);
        exit;
      }
    }

    $ins = $pdo->prepare('
      INSERT INTO itens_backlog (titulo, descricao, prioridade, estimativa, status, projeto_id, sprint_id, assigned_to_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ');
    $ins->execute([$title, $description, $priority, $estimation, $status, $projectId, $sprintId, $assignedToId]);
    $id = (int)$pdo->lastInsertId();

    $stmt = $pdo->prepare('SELECT id, titulo, descricao, prioridade, estimativa, status, projeto_id, sprint_id, assigned_to_id FROM itens_backlog WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch() ?: [];
    echo json_encode(map_item_row($row, []));
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

    // Ensure item exists
    $chk = $pdo->prepare('SELECT id FROM itens_backlog WHERE id = ? LIMIT 1');
    $chk->execute([$id]);
    if (!$chk->fetchColumn()) {
      http_response_code(404);
      echo json_encode(['message' => 'Item de backlog não encontrado']);
      exit;
    }

    $fields = [];
    $values = [];
    if (array_key_exists('title', $body)) {
      $fields[] = 'titulo = ?';
      $values[] = (string)$body['title'];
    }
    if (array_key_exists('description', $body)) {
      $fields[] = 'descricao = ?';
      $values[] = (string)$body['description'];
    }
    if (array_key_exists('priority', $body)) {
      $fields[] = 'prioridade = ?';
      $values[] = (int)$body['priority'];
    }
    if (array_key_exists('estimation', $body)) {
      $fields[] = 'estimativa = ?';
      $values[] = (int)$body['estimation'];
    }
    if (array_key_exists('status', $body)) {
      $fields[] = 'status = ?';
      $values[] = (string)$body['status'];
    }
    if (array_key_exists('projectId', $body)) {
      $pid = (int)$body['projectId'];
      $chkProj = $pdo->prepare('SELECT id FROM projetos WHERE id = ? LIMIT 1');
      $chkProj->execute([$pid]);
      if (!$chkProj->fetchColumn()) {
        http_response_code(404);
        echo json_encode(['message' => 'Projeto não encontrado']);
        exit;
      }
      $fields[] = 'projeto_id = ?';
      $values[] = $pid;
    }
    if (array_key_exists('sprintId', $body)) {
      $sid = $body['sprintId'] !== null ? (int)$body['sprintId'] : null;
      if ($sid !== null) {
        $chkSpr = $pdo->prepare('SELECT id FROM sprints WHERE id = ? LIMIT 1');
        $chkSpr->execute([$sid]);
        if (!$chkSpr->fetchColumn()) {
          http_response_code(404);
          echo json_encode(['message' => 'Sprint não encontrada']);
          exit;
        }
      }
      $fields[] = 'sprint_id = ?';
      $values[] = $sid;
    }
    if (array_key_exists('assignedToId', $body)) {
      $uid = $body['assignedToId'] !== null ? (int)$body['assignedToId'] : null;
      if ($uid !== null) {
        $chkUser = $pdo->prepare('SELECT id FROM usuarios WHERE id = ? LIMIT 1');
        $chkUser->execute([$uid]);
        if (!$chkUser->fetchColumn()) {
          http_response_code(404);
          echo json_encode(['message' => 'Usuário não encontrado']);
          exit;
        }
      }
      $fields[] = 'assigned_to_id = ?';
      $values[] = $uid;
    }

    if (empty($fields)) {
      http_response_code(400);
      echo json_encode(['message' => 'Nenhum campo para atualizar']);
      exit;
    }

    $values[] = $id;
    $sql = 'UPDATE itens_backlog SET ' . implode(', ', $fields) . ' WHERE id = ?';
    $upd = $pdo->prepare($sql);
    $upd->execute($values);

    // Return updated item with comments
    $stmt = $pdo->prepare('SELECT id, titulo, descricao, prioridade, estimativa, status, projeto_id, sprint_id, assigned_to_id FROM itens_backlog WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch() ?: [];
    $stmtC = $pdo->prepare('SELECT id, item_backlog_id, texto, usuario_id, created_at FROM comentarios WHERE item_backlog_id = ? ORDER BY created_at ASC, id ASC');
    $stmtC->execute([$id]);
    $comments = array_map('map_comment_row', $stmtC->fetchAll() ?: []);
    echo json_encode(map_item_row($row, $comments));
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
    $del = $pdo->prepare('DELETE FROM itens_backlog WHERE id = ?');
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


