-- Criação do Banco de Dados (opcional)
-- CREATE DATABASE scrum_db;
-- \c scrum_db;  -- conectar no banco

-- 1. Tabela Pai: Usuarios
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL
);

-- 2. Tabela Filha: Product Owners
CREATE TABLE product_owners (
    usuario_id INT PRIMARY KEY,
    CONSTRAINT fk_po_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
);

-- 3. Tabela Filha: Scrum Masters
CREATE TABLE scrum_masters (
    usuario_id INT PRIMARY KEY,
    CONSTRAINT fk_sm_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
);

-- 4. Tabela Filha: Membros Dev
CREATE TABLE membros_dev (
    usuario_id INT PRIMARY KEY,
    CONSTRAINT fk_md_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
);

-- 5. Times
CREATE TABLE times (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL
);

-- 6. Relação N:N entre Times e Usuarios
CREATE TABLE times_usuarios (
    time_id INT NOT NULL,
    usuario_id INT NOT NULL,
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
CREATE TABLE projetos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    descricao TEXT,
    product_owner_id INT NOT NULL,
    scrum_master_id INT NOT NULL,
    time_id INT NOT NULL,
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
CREATE TABLE sprints (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    projeto_id INT NOT NULL,
    CONSTRAINT fk_sprint_projeto
        FOREIGN KEY (projeto_id)
        REFERENCES projetos(id)
        ON DELETE CASCADE
);

-- 9. Itens do Backlog
CREATE TABLE itens_backlog (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT,
    prioridade INT NOT NULL,
    projeto_id INT NOT NULL,
    CONSTRAINT fk_ib_projeto
        FOREIGN KEY (projeto_id)
        REFERENCES projetos(id)
        ON DELETE CASCADE
);

-- 10. Tarefas
CREATE TABLE tarefas (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT,
    status VARCHAR(50) NOT NULL,
    estimativa_horas INT,
    item_backlog_id INT NOT NULL,
    membro_dev_id INT NOT NULL,
    CONSTRAINT fk_tarefa_ib
        FOREIGN KEY (item_backlog_id)
        REFERENCES itens_backlog(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_tarefa_md
        FOREIGN KEY (membro_dev_id)
        REFERENCES membros_dev(usuario_id)
        ON DELETE SET NULL
);
