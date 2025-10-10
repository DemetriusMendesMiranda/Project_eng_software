CREATE TYPE status_item AS ENUM ('Para Fazer', 'Em Andamento', 'Concluido');
CREATE TYPE status_sprint AS ENUM ('Planejada', 'Ativa', 'Concluida');
CREATE TYPE status_tarefa AS ENUM ('A Fazer', 'Em Progresso', 'Feito');
CREATE TYPE role_usuario AS ENUM ('ProductOwner', 'ScrumMaster', 'MembroDev');

CREATE TABLE projetos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    data_fim_prevista DATE
);

-- Tabela de usuários 
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    role role_usuario NOT NULL,
    especialidade VARCHAR(100) 
);

CREATE TABLE times (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    projeto_id INTEGER NOT NULL,
    CONSTRAINT fk_projeto
        FOREIGN KEY(projeto_id)
        REFERENCES projetos(id)
        ON DELETE CASCADE
);

-- Tabela de junção para o relacionamento Muitos-para-Muitos entre Times e Usuários
CREATE TABLE times_usuarios (
    time_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    CONSTRAINT fk_time
        FOREIGN KEY(time_id)
        REFERENCES times(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_usuario
        FOREIGN KEY(usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE,
    PRIMARY KEY (time_id, usuario_id) -- Chave primária composta para evitar duplicatas
);

CREATE TABLE sprints (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    objetivo TEXT,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    status status_sprint,
    projeto_id INTEGER NOT NULL,
    CONSTRAINT fk_projeto
        FOREIGN KEY(projeto_id)
        REFERENCES projetos(id)
        ON DELETE CASCADE -- Sprints são deletadas se o projeto for removido
);

CREATE TABLE itens_backlog (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    prioridade INTEGER,
    estimativa INTEGER,
    status status_item,
    projeto_id INTEGER NOT NULL,
    sprint_id INTEGER, -- Nulável, pois um item pode não estar em uma sprint
    CONSTRAINT fk_projeto
        FOREIGN KEY(projeto_id)
        REFERENCES projetos(id)
        ON DELETE CASCADE, -- Itens são deletados se o projeto for removido
    CONSTRAINT fk_sprint
        FOREIGN KEY(sprint_id)
        REFERENCES sprints(id)
        ON DELETE SET NULL -- Se a sprint for deletada, o item retorna ao backlog
);

CREATE TABLE tarefas (
    id SERIAL PRIMARY KEY,
    descricao TEXT NOT NULL,
    estimativa_pontos INTEGER,
    status status_tarefa,
    item_backlog_id INTEGER NOT NULL,
    responsavel_id INTEGER, -- Nulável, pois a tarefa pode não ter sido atribuída
    CONSTRAINT fk_item_backlog
        FOREIGN KEY(item_backlog_id)
        REFERENCES itens_backlog(id)
        ON DELETE CASCADE, -- Tarefas são deletadas se o item pai for removido
    CONSTRAINT fk_responsavel
        FOREIGN KEY(responsavel_id)
        REFERENCES usuarios(id)
        ON DELETE SET NULL -- Se o usuário for deletado, a tarefa fica sem responsável
);
