<?php
declare(strict_types=1);

require_once __DIR__ . '/connection.php';

/**
 * Idempotent database migration script.
 *
 * Usage:
 *   php database/migrate.php
 *
 * The script will:
 * - Add sprints.goal, sprints.status
 * - Add itens_backlog.estimativa, status, sprint_id, assigned_to_id (with FKs)
 * - Create comentarios (comments) table
 * - Add tarefas.pontos
 * - Create reunioes and reunioes_participantes tables
 * - Create useful indexes if missing
 */

function now(): string {
	return date('Y-m-d H:i:s');
}

function dbName(PDO $pdo): string {
	$stmt = $pdo->query('SELECT DATABASE()');
	return (string)$stmt->fetchColumn();
}

function tableExists(PDO $pdo, string $table): bool {
	$sql = 'SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?';
	$stmt = $pdo->prepare($sql);
	$stmt->execute([$table]);
	return (int)$stmt->fetchColumn() > 0;
}

function columnExists(PDO $pdo, string $table, string $column): bool {
	$sql = 'SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?';
	$stmt = $pdo->prepare($sql);
	$stmt->execute([$table, $column]);
	return (int)$stmt->fetchColumn() > 0;
}

function indexExists(PDO $pdo, string $table, string $indexName): bool {
	$sql = 'SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?';
	$stmt = $pdo->prepare($sql);
	$stmt->execute([$table, $indexName]);
	return (int)$stmt->fetchColumn() > 0;
}

function addColumn(PDO $pdo, string $table, string $ddl): void {
	// $ddl example: "ADD COLUMN goal TEXT NULL"
	$sql = "ALTER TABLE {$table} {$ddl}";
	$pdo->exec($sql);
}

function addForeignKey(PDO $pdo, string $table, string $constraintName, string $ddl): void {
	// MySQL doesn't expose easy FK existence by name; try-catch to be safe
	try {
		$sql = "ALTER TABLE {$table} ADD CONSTRAINT {$constraintName} {$ddl}";
		$pdo->exec($sql);
	} catch (Throwable $e) {
		// ignore if exists
	}
}

function createIndexIfMissing(PDO $pdo, string $table, string $indexName, string $ddlColumns): void {
	if (!indexExists($pdo, $table, $indexName)) {
		$sql = "CREATE INDEX {$indexName} ON {$table} ({$ddlColumns})";
		$pdo->exec($sql);
	}
}

function ensureComentarios(PDO $pdo): void {
	if (!tableExists($pdo, 'comentarios')) {
		$pdo->exec(
			'CREATE TABLE comentarios (
				id SERIAL PRIMARY KEY,
				item_backlog_id BIGINT UNSIGNED NOT NULL,
				texto TEXT NOT NULL,
				usuario_id BIGINT UNSIGNED NOT NULL,
				created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
				CONSTRAINT fk_com_ib FOREIGN KEY (item_backlog_id) REFERENCES itens_backlog(id) ON DELETE CASCADE,
				CONSTRAINT fk_com_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
			)'
		);
	}
}

function ensureReunioes(PDO $pdo): void {
	if (!tableExists($pdo, 'reunioes')) {
		$pdo->exec(
			'CREATE TABLE reunioes (
				id SERIAL PRIMARY KEY,
				titulo VARCHAR(200) NOT NULL,
				tipo VARCHAR(50) NOT NULL,
				data_hora DATETIME NOT NULL,
				duracao_minutos INT NOT NULL,
				time_id BIGINT UNSIGNED NOT NULL,
				notas TEXT NULL,
				CONSTRAINT fk_reuniao_time FOREIGN KEY (time_id) REFERENCES times(id) ON DELETE CASCADE
			)'
		);
	}
	if (!tableExists($pdo, 'reunioes_participantes')) {
		$pdo->exec(
			'CREATE TABLE reunioes_participantes (
				reuniao_id BIGINT UNSIGNED NOT NULL,
				usuario_id BIGINT UNSIGNED NOT NULL,
				PRIMARY KEY (reuniao_id, usuario_id),
				CONSTRAINT fk_rp_reuniao FOREIGN KEY (reuniao_id) REFERENCES reunioes(id) ON DELETE CASCADE,
				CONSTRAINT fk_rp_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
			)'
		);
	}
	// indexes
	createIndexIfMissing($pdo, 'reunioes_participantes', 'idx_rp_usuario', 'usuario_id');
}

function migrate(PDO $pdo): void {
	$pdo->beginTransaction();
	try {
		// sprints: goal, status
		if (!columnExists($pdo, 'sprints', 'goal')) {
			addColumn($pdo, 'sprints', 'ADD COLUMN goal TEXT NULL');
			echo "[" . now() . "] Added sprints.goal\n";
		}
		if (!columnExists($pdo, 'sprints', 'status')) {
			addColumn($pdo, 'sprints', "ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'Planned'");
			echo "[" . now() . "] Added sprints.status\n";
		}

		// itens_backlog: estimativa, status, sprint_id, assigned_to_id
		if (!columnExists($pdo, 'itens_backlog', 'estimativa')) {
			addColumn($pdo, 'itens_backlog', 'ADD COLUMN estimativa INT NOT NULL DEFAULT 0');
			echo "[" . now() . "] Added itens_backlog.estimativa\n";
		}
		if (!columnExists($pdo, 'itens_backlog', 'status')) {
			addColumn($pdo, 'itens_backlog', "ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ToDo'");
			echo "[" . now() . "] Added itens_backlog.status\n";
		}
		if (!columnExists($pdo, 'itens_backlog', 'sprint_id')) {
			addColumn($pdo, 'itens_backlog', 'ADD COLUMN sprint_id BIGINT UNSIGNED NULL');
			addForeignKey($pdo, 'itens_backlog', 'fk_ib_sprint', 'FOREIGN KEY (sprint_id) REFERENCES sprints(id) ON DELETE SET NULL');
			echo "[" . now() . "] Added itens_backlog.sprint_id with FK\n";
		}
		if (!columnExists($pdo, 'itens_backlog', 'assigned_to_id')) {
			addColumn($pdo, 'itens_backlog', 'ADD COLUMN assigned_to_id BIGINT UNSIGNED NULL');
			addForeignKey($pdo, 'itens_backlog', 'fk_ib_assigned_user', 'FOREIGN KEY (assigned_to_id) REFERENCES usuarios(id) ON DELETE SET NULL');
			echo "[" . now() . "] Added itens_backlog.assigned_to_id with FK\n";
		}

		// comentarios
		ensureComentarios($pdo);

		// tarefas: pontos
		if (!columnExists($pdo, 'tarefas', 'pontos')) {
			addColumn($pdo, 'tarefas', 'ADD COLUMN pontos INT NULL');
			echo "[" . now() . "] Added tarefas.pontos\n";
		}

		// reunioes and participantes
		ensureReunioes($pdo);

		// useful indexes
		createIndexIfMissing($pdo, 'itens_backlog', 'idx_ib_sprint', 'sprint_id');
		createIndexIfMissing($pdo, 'itens_backlog', 'idx_ib_assigned', 'assigned_to_id');
		createIndexIfMissing($pdo, 'tarefas', 'idx_tarefa_item', 'item_backlog_id');

		$pdo->commit();
		echo "[" . now() . "] Migration complete on DB: " . dbName($pdo) . "\n";
	} catch (Throwable $e) {
		$pdo->rollBack();
		fwrite(STDERR, "[" . now() . "] Migration failed: " . $e->getMessage() . "\n");
		exit(1);
	}
}

try {
	$pdo = Database::getConnection();
	migrate($pdo);
} catch (Throwable $e) {
	fwrite(STDERR, "[" . now() . "] Error: " . $e->getMessage() . "\n");
	exit(1);
}


