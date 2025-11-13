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

function get_user_role(PDO $pdo, array $user): string
{
  // SuperAdmin convention by email
  if (isset($user['email']) && strcasecmp((string)$user['email'], 'admin@scrum.com') === 0) {
    return 'SuperAdmin';
  }
  $id = (int)$user['id'];
  $chk = $pdo->prepare('SELECT 1 FROM scrum_masters WHERE usuario_id = ? LIMIT 1');
  $chk->execute([$id]);
  if ($chk->fetchColumn()) return 'ScrumMaster';
  $chk = $pdo->prepare('SELECT 1 FROM product_owners WHERE usuario_id = ? LIMIT 1');
  $chk->execute([$id]);
  if ($chk->fetchColumn()) return 'ProductOwner';
  $chk = $pdo->prepare('SELECT 1 FROM membros_dev WHERE usuario_id = ? LIMIT 1');
  $chk->execute([$id]);
  if ($chk->fetchColumn()) return 'Developer';
  return 'Developer';
}

function map_user_row(PDO $pdo, array $row): array
{
  return [
    'id' => (int)$row['id'],
    'name' => (string)$row['nome'],
    'email' => (string)$row['email'],
    'role' => get_user_role($pdo, $row),
  ];
}

function set_user_role(PDO $pdo, int $userId, string $role): void
{
  // Remove from all role tables first
  foreach (['scrum_masters', 'product_owners', 'membros_dev'] as $table) {
    $del = $pdo->prepare("DELETE FROM {$table} WHERE usuario_id = ?");
    $del->execute([$userId]);
  }
  // SuperAdmin is by convention only; no table row required
  if ($role === 'SuperAdmin') {
    return;
  }
  if ($role === 'ScrumMaster') {
    $ins = $pdo->prepare('INSERT INTO scrum_masters (usuario_id) VALUES (?)');
    $ins->execute([$userId]);
    return;
  }
  if ($role === 'ProductOwner') {
    $ins = $pdo->prepare('INSERT INTO product_owners (usuario_id) VALUES (?)');
    $ins->execute([$userId]);
    return;
  }
  // Default Developer
  $ins = $pdo->prepare('INSERT INTO membros_dev (usuario_id) VALUES (?)');
  $ins->execute([$userId]);
}

try {
  $pdo = Database::getConnection();

  if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->query('SELECT id, nome, email FROM usuarios ORDER BY id DESC');
    $rows = $stmt->fetchAll() ?: [];
    $out = [];
    foreach ($rows as $r) {
      $out[] = map_user_row($pdo, $r);
    }
    echo json_encode($out);
    exit;
  }

  if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = json_input();
    $name = isset($body['name']) ? trim((string)$body['name']) : '';
    $email = isset($body['email']) ? trim((string)$body['email']) : '';
    // frontend sends password in passwordHash field
    $password = isset($body['password']) ? (string)$body['password'] : ((string)($body['passwordHash'] ?? ''));
    $role = isset($body['role']) ? (string)$body['role'] : 'Developer';

    if ($name === '' || $email === '' || $password === '') {
      http_response_code(400);
      echo json_encode(['message' => 'Campos obrigatórios: name, email, password']);
      exit;
    }

    // Ensure unique email
    $chk = $pdo->prepare('SELECT 1 FROM usuarios WHERE email = ? LIMIT 1');
    $chk->execute([$email]);
    if ($chk->fetchColumn()) {
      http_response_code(409);
      echo json_encode(['message' => 'E-mail já cadastrado']);
      exit;
    }

    $hash = password_hash($password, PASSWORD_BCRYPT);
    $ins = $pdo->prepare('INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)');
    $ins->execute([$name, $email, $hash]);
    $id = (int)$pdo->lastInsertId();

    set_user_role($pdo, $id, $role);

    $stmt = $pdo->prepare('SELECT id, nome, email FROM usuarios WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch() ?: [];
    echo json_encode(map_user_row($pdo, $row));
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

    // Ensure exists
    $chk = $pdo->prepare('SELECT id FROM usuarios WHERE id = ? LIMIT 1');
    $chk->execute([$id]);
    if (!$chk->fetchColumn()) {
      http_response_code(404);
      echo json_encode(['message' => 'Usuário não encontrado']);
      exit;
    }

    $fields = [];
    $values = [];
    if (array_key_exists('name', $body)) {
      $fields[] = 'nome = ?';
      $values[] = (string)$body['name'];
    }
    if (array_key_exists('email', $body)) {
      $email = (string)$body['email'];
      // If updating email to an existing one, fail
      $chkE = $pdo->prepare('SELECT 1 FROM usuarios WHERE email = ? AND id <> ? LIMIT 1');
      $chkE->execute([$email, $id]);
      if ($chkE->fetchColumn()) {
        http_response_code(409);
        echo json_encode(['message' => 'E-mail já cadastrado']);
        exit;
      }
      $fields[] = 'email = ?';
      $values[] = $email;
    }
    if (array_key_exists('password', $body) || array_key_exists('passwordHash', $body)) {
      $pwd = isset($body['password']) ? (string)$body['password'] : ((string)($body['passwordHash'] ?? ''));
      if ($pwd !== '') {
        $hash = password_hash($pwd, PASSWORD_BCRYPT);
        $fields[] = 'senha_hash = ?';
        $values[] = $hash;
      }
    }

    if (!empty($fields)) {
      $values[] = $id;
      $sql = 'UPDATE usuarios SET ' . implode(', ', $fields) . ' WHERE id = ?';
      $upd = $pdo->prepare($sql);
      $upd->execute($values);
    }

    if (array_key_exists('role', $body)) {
      set_user_role($pdo, $id, (string)$body['role']);
    }

    $stmt = $pdo->prepare('SELECT id, nome, email FROM usuarios WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch() ?: [];
    echo json_encode(map_user_row($pdo, $row));
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
    $del = $pdo->prepare('DELETE FROM usuarios WHERE id = ?');
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


