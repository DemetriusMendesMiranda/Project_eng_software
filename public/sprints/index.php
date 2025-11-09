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

function map_sprint_row(array $row): array
{
  return [
    'id' => (int)$row['id'],
    'name' => (string)$row['titulo'],
    'goal' => '', // not persisted in current schema
    'startDate' => $row['data_inicio'] ? (string)$row['data_inicio'] : '',
    'endDate' => $row['data_fim'] ? (string)$row['data_fim'] : '',
    'status' => 'Planned', // not persisted in current schema
    'projectId' => (int)$row['projeto_id'],
    'teamId' => isset($row['time_id']) ? (int)$row['time_id'] : 0, // derived from projeto
  ];
}

try {
  $pdo = Database::getConnection();

  if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->query('
      SELECT s.id, s.titulo, s.data_inicio, s.data_fim, s.projeto_id, p.time_id
      FROM sprints s
      JOIN projetos p ON p.id = s.projeto_id
      ORDER BY s.id DESC
    ');
    $rows = $stmt->fetchAll() ?: [];
    $mapped = array_map('map_sprint_row', $rows);
    echo json_encode($mapped);
    exit;
  }

  if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = json_input();
    $name = isset($body['name']) ? trim((string)$body['name']) : '';
    $startDate = isset($body['startDate']) ? (string)$body['startDate'] : null;
    $endDate = isset($body['endDate']) ? (string)$body['endDate'] : null;
    $projectId = isset($body['projectId']) ? (int)$body['projectId'] : 0;

    if ($name === '' || !$startDate || !$endDate || $projectId <= 0) {
      http_response_code(400);
      echo json_encode(['message' => 'Campos obrigatórios: name, startDate, endDate, projectId']);
      exit;
    }

    // validate project exists
    $chk = $pdo->prepare('SELECT id, time_id FROM projetos WHERE id = ? LIMIT 1');
    $chk->execute([$projectId]);
    $proj = $chk->fetch();
    if (!$proj) {
      http_response_code(404);
      echo json_encode(['message' => 'Projeto não encontrado']);
      exit;
    }

    $ins = $pdo->prepare('INSERT INTO sprints (titulo, data_inicio, data_fim, projeto_id) VALUES (?, ?, ?, ?)');
    $ins->execute([$name, $startDate, $endDate, $projectId]);
    $id = (int)$pdo->lastInsertId();

    echo json_encode([
      'id' => $id,
      'name' => $name,
      'goal' => isset($body['goal']) ? (string)$body['goal'] : '',
      'startDate' => $startDate,
      'endDate' => $endDate,
      'status' => isset($body['status']) ? (string)$body['status'] : 'Planned',
      'projectId' => $projectId,
      'teamId' => isset($proj['time_id']) ? (int)$proj['time_id'] : 0,
    ]);
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

    // Build dynamic update
    $fields = [];
    $values = [];
    if (array_key_exists('name', $body)) {
      $fields[] = 'titulo = ?';
      $values[] = (string)$body['name'];
    }
    if (array_key_exists('startDate', $body)) {
      $fields[] = 'data_inicio = ?';
      $values[] = $body['startDate'] ? (string)$body['startDate'] : null;
    }
    if (array_key_exists('endDate', $body)) {
      $fields[] = 'data_fim = ?';
      $values[] = $body['endDate'] ? (string)$body['endDate'] : null;
    }
    if (array_key_exists('projectId', $body)) {
      // Validate project
      $newProj = (int)$body['projectId'];
      $chk = $pdo->prepare('SELECT id FROM projetos WHERE id = ? LIMIT 1');
      $chk->execute([$newProj]);
      if (!$chk->fetchColumn()) {
        http_response_code(404);
        echo json_encode(['message' => 'Projeto não encontrado']);
        exit;
      }
      $fields[] = 'projeto_id = ?';
      $values[] = $newProj;
    }

    if (empty($fields)) {
      http_response_code(400);
      echo json_encode(['message' => 'Nenhum campo para atualizar']);
      exit;
    }

    $values[] = $id;
    $sql = 'UPDATE sprints SET ' . implode(', ', $fields) . ' WHERE id = ?';
    $upd = $pdo->prepare($sql);
    $upd->execute($values);

    // Return updated row with derived team
    $stmt = $pdo->prepare('
      SELECT s.id, s.titulo, s.data_inicio, s.data_fim, s.projeto_id, p.time_id
      FROM sprints s
      JOIN projetos p ON p.id = s.projeto_id
      WHERE s.id = ?
    ');
    $stmt->execute([$id]);
    $row = $stmt->fetch() ?: [];
    echo json_encode(map_sprint_row($row));
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
    $del = $pdo->prepare('DELETE FROM sprints WHERE id = ?');
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


