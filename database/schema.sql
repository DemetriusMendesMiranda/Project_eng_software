-- Criação do Banco de Dados (opcional)
-- CREATE DATABASE scrum_db;
-- \c scrum_db;  -- conectar no banco

-- 1. Tabela Pai: Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL
);

-- 2. Tabela Filha: Product Owners
CREATE TABLE IF NOT EXISTS product_owners (
    usuario_id BIGINT UNSIGNED PRIMARY KEY,
    CONSTRAINT fk_po_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
);

-- 3. Tabela Filha: Scrum Masters
CREATE TABLE IF NOT EXISTS scrum_masters (
    usuario_id BIGINT UNSIGNED PRIMARY KEY,
    CONSTRAINT fk_sm_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
);

-- 4. Tabela Filha: Membros Dev
CREATE TABLE IF NOT EXISTS membros_dev (
    usuario_id BIGINT UNSIGNED PRIMARY KEY,
    CONSTRAINT fk_md_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
);

-- 5. Times
CREATE TABLE IF NOT EXISTS times (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL
);

-- 6. Relação N:N entre Times e Usuarios
CREATE TABLE IF NOT EXISTS times_usuarios (
    time_id BIGINT UNSIGNED NOT NULL,
    usuario_id BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (time_id, usuario_id),
    CONSTRAINT fk_tu_time
        FOREIGN KEY (time_id)
        REFERENCES times(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_tu_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
);

-- 7. Projetos
CREATE TABLE IF NOT EXISTS projetos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    descricao TEXT,
    data_inicio DATE NULL,
    data_fim_prevista DATE NULL,
    arquivado TINYINT(1) NOT NULL DEFAULT 0,
    product_owner_id BIGINT UNSIGNED NOT NULL,
    scrum_master_id BIGINT UNSIGNED NOT NULL,
    time_id BIGINT UNSIGNED NOT NULL,
    CONSTRAINT fk_proj_po
        FOREIGN KEY (product_owner_id)
        REFERENCES product_owners(usuario_id),
    CONSTRAINT fk_proj_sm
        FOREIGN KEY (scrum_master_id)
        REFERENCES scrum_masters(usuario_id),
    CONSTRAINT fk_proj_time
        FOREIGN KEY (time_id)
        REFERENCES times(id)
);

-- 8. Sprints
CREATE TABLE IF NOT EXISTS sprints (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    projeto_id BIGINT UNSIGNED NOT NULL,
    CONSTRAINT fk_sprint_projeto
        FOREIGN KEY (projeto_id)
        REFERENCES projetos(id)
        ON DELETE CASCADE
);

-- Campos adicionais para sprints exigidos pelo frontend
ALTER TABLE sprints
    ADD COLUMN IF NOT EXISTS goal TEXT NULL,
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'Planned';

-- 9. Itens do Backlog
CREATE TABLE IF NOT EXISTS itens_backlog (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT,
    prioridade INT NOT NULL,
    projeto_id BIGINT UNSIGNED NOT NULL,
    CONSTRAINT fk_ib_projeto
        FOREIGN KEY (projeto_id)
        REFERENCES projetos(id)
        ON DELETE CASCADE
);

-- Campos adicionais para itens do backlog exigidos pelo frontend
ALTER TABLE itens_backlog
    ADD COLUMN IF NOT EXISTS estimativa INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ToDo',
    ADD COLUMN IF NOT EXISTS sprint_id BIGINT UNSIGNED NULL,
    ADD COLUMN IF NOT EXISTS assigned_to_id BIGINT UNSIGNED NULL,
    ADD CONSTRAINT fk_ib_sprint
        FOREIGN KEY (sprint_id)
        REFERENCES sprints(id)
        ON DELETE SET NULL,
    ADD CONSTRAINT fk_ib_assigned_user
        FOREIGN KEY (assigned_to_id)
        REFERENCES usuarios(id)
        ON DELETE SET NULL;

-- Comentários nos itens do backlog
CREATE TABLE IF NOT EXISTS comentarios (
    id SERIAL PRIMARY KEY,
    item_backlog_id BIGINT UNSIGNED NOT NULL,
    texto TEXT NOT NULL,
    usuario_id BIGINT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_com_ib
        FOREIGN KEY (item_backlog_id)
        REFERENCES itens_backlog(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_com_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
);

-- 10. Tarefas
CREATE TABLE IF NOT EXISTS tarefas (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT,
    status VARCHAR(50) NOT NULL,
    estimativa_horas INT,
    item_backlog_id BIGINT UNSIGNED NOT NULL,
    membro_dev_id BIGINT UNSIGNED NULL,
    CONSTRAINT fk_tarefa_ib
        FOREIGN KEY (item_backlog_id)
        REFERENCES itens_backlog(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_tarefa_md
        FOREIGN KEY (membro_dev_id)
        REFERENCES membros_dev(usuario_id)
        ON DELETE SET NULL
);

-- Campo adicional para compatibilidade com o frontend (pontos)
ALTER TABLE tarefas
    ADD COLUMN IF NOT EXISTS pontos INT NULL;

-- 11. Reuniões
CREATE TABLE IF NOT EXISTS reunioes (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- 'Sprint Planning', 'Daily Standup', etc
    data_hora DATETIME NOT NULL,
    duracao_minutos INT NOT NULL,
    time_id BIGINT UNSIGNED NOT NULL,
    notas TEXT NULL,
    CONSTRAINT fk_reuniao_time
        FOREIGN KEY (time_id)
        REFERENCES times(id)
        ON DELETE CASCADE
);

-- Participantes das reuniões (N:N)
CREATE TABLE IF NOT EXISTS reunioes_participantes (
    reuniao_id BIGINT UNSIGNED NOT NULL,
    usuario_id BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (reuniao_id, usuario_id),
    CONSTRAINT fk_rp_reuniao
        FOREIGN KEY (reuniao_id)
        REFERENCES reunioes(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_rp_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
);

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_ib_sprint ON itens_backlog (sprint_id);
CREATE INDEX IF NOT EXISTS idx_ib_assigned ON itens_backlog (assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_tarefa_item ON tarefas (item_backlog_id);
CREATE INDEX IF NOT EXISTS idx_rp_usuario ON reunioes_participantes (usuario_id);
