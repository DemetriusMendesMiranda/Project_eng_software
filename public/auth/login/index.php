<?php
declare(strict_types=1);

require_once __DIR__ . '/../../../database/connection.php';

// Basic CORS (adjust origin handling as needed)
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: ' . $origin);
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
if ($origin !== '*') {
    header('Vary: Origin');
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Method Not Allowed']);
    exit;
}

function json_input(): array
{
    $raw = file_get_contents('php://input') ?: '';
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

try {
    $body = json_input();
    $email = isset($body['email']) ? trim((string)$body['email']) : '';
    $password = isset($body['password']) ? (string)$body['password'] : '';

    if ($email === '' || $password === '') {
        http_response_code(400);
        echo json_encode(['message' => 'Email and password are required']);
        exit;
    }

    $pdo = Database::getConnection();
    $stmt = $pdo->prepare('SELECT id, nome, email, senha_hash FROM usuarios WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, (string)$user['senha_hash'])) {
        http_response_code(401);
        echo json_encode(['message' => 'Invalid email or password']);
        exit;
    }

    // Determine role (simple heuristic based on membership tables)
    $role = 'Developer';

    // Scrum Master?
    $roleCheck = $pdo->prepare('SELECT 1 FROM scrum_masters WHERE usuario_id = ? LIMIT 1');
    $roleCheck->execute([(int)$user['id']]);
    if ($roleCheck->fetchColumn()) {
        $role = 'ScrumMaster';
    }

    // Product Owner?
    $roleCheck = $pdo->prepare('SELECT 1 FROM product_owners WHERE usuario_id = ? LIMIT 1');
    $roleCheck->execute([(int)$user['id']]);
    if ($roleCheck->fetchColumn()) {
        $role = 'ProductOwner';
    }

    // Super Admin (convention by email)
    if (strcasecmp((string)$user['email'], 'admin@scrum.com') === 0) {
        $role = 'SuperAdmin';
    }

    // Generate a simple opaque token (front-end stores it locally)
    $token = bin2hex(random_bytes(32));

    echo json_encode([
        'token' => $token,
        'user' => [
            'id' => (int)$user['id'],
            'name' => (string)$user['nome'],
            'email' => (string)$user['email'],
            'role' => $role,
        ],
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Server error', 'error' => $e->getMessage()]);
}


