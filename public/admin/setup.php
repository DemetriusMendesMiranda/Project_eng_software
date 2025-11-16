<?php
declare(strict_types=1);

// Simple protected endpoint to run DB setup + migrate + seed on demand.
// Usage:
//   Set env SEED_SECRET on the backend service.
//   Call: /admin/setup.php?secret=YOUR_SECRET
//
// This will:
//   - apply base schema (CREATE TABLEs)
//   - run migrations (ALTER/INDEX additions)
//   - run seed (demo users, team, project)

header('Content-Type: text/plain; charset=utf-8');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header('Access-Control-Allow-Origin: ' . $origin);
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
if ($origin !== '*') {
  header('Vary: Origin');
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  http_response_code(405);
  echo "Method Not Allowed\n";
  exit;
}

$expected = getenv('SEED_SECRET') ?: '';
$provided = isset($_GET['secret']) ? (string)$_GET['secret'] : '';
if ($expected === '' || !hash_equals($expected, $provided)) {
  http_response_code(403);
  echo "Forbidden: missing or invalid secret\n";
  exit;
}

// Capture output from included scripts
ob_start();
try {
  require_once __DIR__ . '/../../database/setup.php';
  require_once __DIR__ . '/../../database/migrate.php';
  require_once __DIR__ . '/../../database/seed.php';
  $out = ob_get_clean();
  http_response_code(200);
  echo "Setup/migrate/seed executed.\n";
  if ($out !== '') {
    echo "----- Logs -----\n";
    echo $out;
  }
} catch (Throwable $e) {
  $out = ob_get_clean();
  http_response_code(500);
  echo "Error while running setup/migrate/seed: " . $e->getMessage() . "\n";
  if ($out !== '') {
    echo "----- Partial logs -----\n";
    echo $out;
  }
}

?>


