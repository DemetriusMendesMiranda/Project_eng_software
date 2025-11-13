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

function map_meeting_row(array $row, array $attendeeIds): array
{
  return [
    'id' => (int)$row['id'],
    'title' => (string)$row['titulo'],
    'type' => (string)$row['tipo'],
    'date' => $row['data_hora'] ? (string)$row['data_hora'] : '',
    'duration' => (int)$row['duracao_minutos'],
    'teamId' => (int)$row['time_id'],
    'attendeeIds' => $attendeeIds,
    'notes' => isset($row['notas']) ? (string)$row['notas'] : '',
  ];
}

function fetchMeetings(PDO $pdo): array
{
  $stmt = $pdo->query('SELECT id, titulo, tipo, data_hora, duracao_minutos, time_id, notas FROM reunioes ORDER BY data_hora DESC, id DESC');
  $rows = $stmt->fetchAll() ?: [];
  $meetingIds = array_map(static function ($r) { return (int)$r['id']; }, $rows);

  $attendeesMap = [];
  if (count($meetingIds) > 0) {
    $in = implode(',', array_fill(0, count($meetingIds), '?'));
    $stmtA = $pdo->prepare("SELECT reuniao_id, usuario_id FROM reunioes_participantes WHERE reuniao_id IN ($in)");
    $stmtA->execute($meetingIds);
    foreach ($stmtA->fetchAll() as $a) {
      $rid = (int)$a['reuniao_id'];
      $uid = (int)$a['usuario_id'];
      if (!isset($attendeesMap[$rid])) {
        $attendeesMap[$rid] = [];
      }
      $attendeesMap[$rid][] = $uid;
    }
  }

  $meetings = [];
  foreach ($rows as $row) {
    $id = (int)$row['id'];
    $meetings[] = map_meeting_row($row, $attendeesMap[$id] ?? []);
  }
  return $meetings;
}

try {
  $pdo = Database::getConnection();

  if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode(fetchMeetings($pdo));
    exit;
  }

  if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = json_input();
    $title = isset($body['title']) ? trim((string)$body['title']) : '';
    $type = isset($body['type']) ? trim((string)$body['type']) : '';
    $date = isset($body['date']) ? (string)$body['date'] : '';
    $duration = isset($body['duration']) ? (int)$body['duration'] : 0;
    $teamId = isset($body['teamId']) ? (int)$body['teamId'] : 0;
    $attendeeIds = isset($body['attendeeIds']) && is_array($body['attendeeIds']) ? array_map('intval', $body['attendeeIds']) : [];
    $notes = isset($body['notes']) ? (string)$body['notes'] : null;

    if ($title === '' || $type === '' || $date === '' || $duration <= 0 || $teamId <= 0) {
      http_response_code(400);
      echo json_encode(['message' => 'Campos obrigatórios: title, type, date, duration, teamId']);
      exit;
    }

    // Validate team
    $chkTeam = $pdo->prepare('SELECT id FROM times WHERE id = ? LIMIT 1');
    $chkTeam->execute([$teamId]);
    if (!$chkTeam->fetchColumn()) {
      http_response_code(404);
      echo json_encode(['message' => 'Time não encontrado']);
      exit;
    }

    $ins = $pdo->prepare('INSERT INTO reunioes (titulo, tipo, data_hora, duracao_minutos, time_id, notas) VALUES (?, ?, ?, ?, ?, ?)');
    $ins->execute([$title, $type, $date, $duration, $teamId, $notes]);
    $id = (int)$pdo->lastInsertId();

    if (count($attendeeIds) > 0) {
      $insA = $pdo->prepare('INSERT INTO reunioes_participantes (reuniao_id, usuario_id) VALUES (?, ?)');
      foreach ($attendeeIds as $uid) {
        // Validate user
        $chkUser = $pdo->prepare('SELECT id FROM usuarios WHERE id = ? LIMIT 1');
        $chkUser->execute([$uid]);
        if ($chkUser->fetchColumn()) {
          $insA->execute([$id, $uid]);
        }
      }
    }

    $row = [
      'id' => $id,
      'titulo' => $title,
      'tipo' => $type,
      'data_hora' => $date,
      'duracao_minutos' => $duration,
      'time_id' => $teamId,
      'notas' => $notes,
    ];
    echo json_encode(map_meeting_row($row, $attendeeIds));
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

    // Ensure meeting exists
    $chk = $pdo->prepare('SELECT id FROM reunioes WHERE id = ? LIMIT 1');
    $chk->execute([$id]);
    if (!$chk->fetchColumn()) {
      http_response_code(404);
      echo json_encode(['message' => 'Reunião não encontrada']);
      exit;
    }

    // Build dynamic update
    $fields = [];
    $values = [];
    if (array_key_exists('title', $body)) {
      $fields[] = 'titulo = ?';
      $values[] = (string)$body['title'];
    }
    if (array_key_exists('type', $body)) {
      $fields[] = 'tipo = ?';
      $values[] = (string)$body['type'];
    }
    if (array_key_exists('date', $body)) {
      $fields[] = 'data_hora = ?';
      $values[] = $body['date'] ? (string)$body['date'] : null;
    }
    if (array_key_exists('duration', $body)) {
      $fields[] = 'duracao_minutos = ?';
      $values[] = (int)$body['duration'];
    }
    if (array_key_exists('teamId', $body)) {
      $teamId = (int)$body['teamId'];
      // Validate team
      $chkTeam = $pdo->prepare('SELECT id FROM times WHERE id = ? LIMIT 1');
      $chkTeam->execute([$teamId]);
      if (!$chkTeam->fetchColumn()) {
        http_response_code(404);
        echo json_encode(['message' => 'Time não encontrado']);
        exit;
      }
      $fields[] = 'time_id = ?';
      $values[] = $teamId;
    }
    if (array_key_exists('notes', $body)) {
      $fields[] = 'notas = ?';
      $values[] = (string)$body['notes'];
    }

    if (!empty($fields)) {
      $values[] = $id;
      $sql = 'UPDATE reunioes SET ' . implode(', ', $fields) . ' WHERE id = ?';
      $upd = $pdo->prepare($sql);
      $upd->execute($values);
    }

    // Update attendees if provided (replace membership)
    $attendeeIds = null;
    if (array_key_exists('attendeeIds', $body) && is_array($body['attendeeIds'])) {
      $attendeeIds = array_map('intval', $body['attendeeIds']);
      $delA = $pdo->prepare('DELETE FROM reunioes_participantes WHERE reuniao_id = ?');
      $delA->execute([$id]);
      if (count($attendeeIds) > 0) {
        $insA = $pdo->prepare('INSERT INTO reunioes_participantes (reuniao_id, usuario_id) VALUES (?, ?)');
        foreach ($attendeeIds as $uid) {
          // Validate user
          $chkUser = $pdo->prepare('SELECT id FROM usuarios WHERE id = ? LIMIT 1');
          $chkUser->execute([$uid]);
          if ($chkUser->fetchColumn()) {
            $insA->execute([$id, $uid]);
          }
        }
      }
    }

    // Return updated snapshot
    $stmt = $pdo->prepare('SELECT id, titulo, tipo, data_hora, duracao_minutos, time_id, notas FROM reunioes WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch() ?: [];
    if ($row) {
      if ($attendeeIds === null) {
        // load existing attendees
        $stmtA = $pdo->prepare('SELECT usuario_id FROM reunioes_participantes WHERE reuniao_id = ?');
        $stmtA->execute([$id]);
        $attendeeIds = array_map(static function ($r) { return (int)$r['usuario_id']; }, $stmtA->fetchAll() ?: []);
      }
      echo json_encode(map_meeting_row($row, $attendeeIds));
      exit;
    }

    http_response_code(404);
    echo json_encode(['message' => 'Reunião não encontrada']);
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

    $del = $pdo->prepare('DELETE FROM reunioes WHERE id = ?');
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


