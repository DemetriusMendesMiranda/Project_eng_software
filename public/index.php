<?php
require_once __DIR__ . '/../database/connection.php';

$connected = false;
$error = null;

try {
  $pdo = Database::getConnection();
  $stmt = $pdo->query('SELECT 1');
  $connected = $stmt !== false;
} catch (Throwable $e) {
  $error = $e->getMessage();
}
?>
<!doctype html>
<html lang="pt-br">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>ENG SOFT - Teste</title>
    <style>
      body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; margin: 40px; color: #111; }
      .ok { color: #0a7e07; font-weight: 600; }
      .fail { color: #b00020; font-weight: 600; }
      pre { background: #f6f8fa; padding: 12px; border-radius: 6px; overflow: auto; }
      code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
    </style>
  </head>
  <body>
    <h1>Projeto em execução</h1>
    <p>Data/hora do servidor: <strong><?php echo htmlspecialchars(date('Y-m-d H:i:s'), ENT_QUOTES, 'UTF-8'); ?></strong></p>

    <?php if ($connected): ?>
      <p class="ok">Conexão com MySQL: OK</p>
    <?php else: ?>
      <p class="fail">Conexão com MySQL: FALHOU</p>
      <?php if ($error): ?>
        <pre><code><?php echo htmlspecialchars($error, ENT_QUOTES, 'UTF-8'); ?></code></pre>
      <?php endif; ?>
    <?php endif; ?>

    <hr />
    <p>Variáveis de ambiente esperadas:</p>
    <pre><code>DB_HOST (default 127.0.0.1)
DB_PORT (default 3306)
DB_NAME (default scrum_db)
DB_USER (default root)
DB_PASS (default vazio)
DB_CHARSET (default utf8mb4)</code></pre>
  </body>
  </html>


