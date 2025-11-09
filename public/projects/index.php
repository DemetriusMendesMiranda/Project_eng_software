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

function map_project_row(array $row): array
{
  return [
    'id' => (int)$row['id'],
    'name' => (string)$row['nome'],
    'description' => (string)($row['descricao'] ?? ''),
    'startDate' => $row['data_inicio'] ? (string)$row['data_inicio'] : '',
    'expectedEndDate' => $row['data_fim_prevista'] ? (string)$row['data_fim_prevista'] : '',
    'archived' => ((int)($row['arquivado'] ?? 0)) === 1,
  ];
}

try {
  $pdo = Database::getConnection();

  if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->query('SELECT id, nome, descricao, data_inicio, data_fim_prevista, arquivado FROM projetos ORDER BY id DESC');
    $rows = $stmt->fetchAll() ?: [];
    echo json_encode(array_map('map_project_row', $rows));
    exit;
  }

  if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = json_input();
    $name = isset($body['name']) ? trim((string)$body['name']) : '';
    $description = isset($body['description']) ? trim((string)$body['description']) : '';
    $startDate = isset($body['startDate']) ? (string)$body['startDate'] : null;
    $expectedEndDate = isset($body['expectedEndDate']) ? (string)$body['expectedEndDate'] : null;

    if ($name === '') {
      http_response_code(400);
      echo json_encode(['message' => 'Campo obrigatório: name']);
      exit;
    }

    // Ensure required role dependencies exist
    $po = $pdo->query('SELECT usuario_id FROM product_owners LIMIT 1')->fetchColumn();
    $sm = $pdo->query('SELECT usuario_id FROM scrum_masters LIMIT 1')->fetchColumn();
    if (!$po || !$sm) {
      http_response_code(409);
      echo json_encode(['message' => 'Dependências ausentes (product_owners, scrum_masters). Execute o seed.' ]);
      exit;
    }

    // Create a dedicated team for this project to satisfy NOT NULL FK time_id
    $teamName = 'Time ' . $name;
    $insTeam = $pdo->prepare('INSERT INTO times (nome) VALUES (?)');
    $insTeam->execute([$teamName]);
    $team = (int)$pdo->lastInsertId();

    $ins = $pdo->prepare('
      INSERT INTO projetos (nome, descricao, data_inicio, data_fim_prevista, arquivado, product_owner_id, scrum_master_id, time_id)
      VALUES (?, ?, ?, ?, 0, ?, ?, ?)
    ');
    $ins->execute([$name, $description, $startDate ?: null, $expectedEndDate ?: null, (int)$po, (int)$sm, (int)$team]);
    $id = (int)$pdo->lastInsertId();

    $stmt = $pdo->prepare('SELECT id, nome, descricao, data_inicio, data_fim_prevista, arquivado FROM projetos WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch() ?: [];
    echo json_encode(map_project_row($row));
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
      $fields[] = 'nome = ?';
      $values[] = (string)$body['name'];
    }
    if (array_key_exists('description', $body)) {
      $fields[] = 'descricao = ?';
      $values[] = (string)$body['description'];
    }
    if (array_key_exists('startDate', $body)) {
      $fields[] = 'data_inicio = ?';
      $values[] = $body['startDate'] ? (string)$body['startDate'] : null;
    }
    if (array_key_exists('expectedEndDate', $body)) {
      $fields[] = 'data_fim_prevista = ?';
      $values[] = $body['expectedEndDate'] ? (string)$body['expectedEndDate'] : null;
    }
    if (array_key_exists('archived', $body)) {
      $fields[] = 'arquivado = ?';
      $values[] = ((bool)$body['archived']) ? 1 : 0;
    }

    if (empty($fields)) {
      http_response_code(400);
      echo json_encode(['message' => 'Nenhum campo para atualizar']);
      exit;
    }

    $values[] = $id;
    $sql = 'UPDATE projetos SET ' . implode(', ', $fields) . ' WHERE id = ?';
    $upd = $pdo->prepare($sql);
    $upd->execute($values);

    $stmt = $pdo->prepare('SELECT id, nome, descricao, data_inicio, data_fim_prevista, arquivado FROM projetos WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch() ?: [];
    echo json_encode(map_project_row($row));
    exit;
  }

  http_response_code(405);
  echo json_encode(['message' => 'Method Not Allowed']);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['message' => 'Server error', 'error' => $e->getMessage()]);
}


