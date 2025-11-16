## Requisitos Não Funcionais e Especificações Complementares

Este documento consolida os requisitos não funcionais do sistema, bem como itens complementares exigidos: requisitos funcionais não cobertos por histórias, interfaces, conformidade, restrições de projeto, licenciamento e documentação. Complementa a visão técnica em `docs/10-arquitetura-software.md` e as diretrizes de implantação em `docs/09-descricao-infraestrutura-implantacao.md`.

### 1. Requisitos funcionais complementares (fora das histórias)

- Autenticação por e‑mail/senha com sessão baseada em token opaco enviado em `Authorization: Bearer <token>`.
- Papéis e permissões: SuperAdmin, Product Owner, Scrum Master e Membro Dev, refletidos nas entidades e respostas da API.
- Listagens básicas para usuários, times, projetos, sprints, backlog e tarefas.
- Feedback operacional em ações CRUD (sucesso/erro) com mensagens amigáveis ao usuário.

Observação: Itens acima são funcionais, listados aqui por não estarem necessariamente detalhados em histórias de usuário anteriores.

### 2. Atributos de qualidade (NFRs)

- Usabilidade e Acessibilidade
  - Navegação consistente, componentes reutilizados (padrões UI do projeto).
  - Suporte a teclado (foco visível) e leitores de tela (atributos ARIA dos componentes padrão quando pertinentes).
  - Contraste mínimo e fontes responsivas; formulários com validação e mensagens claras.
  - Linguagem padrão pt‑BR; textos e rótulos objetivos.
- Desempenho
  - Respostas compatíveis com operações CRUD e UI leve para o escopo atual.
  - Uso de assets otimizados quando aplicável; evitar overfetching na UI.
- Confiabilidade e Disponibilidade
  - Erros tratados com respostas HTTP padronizadas; frontend apresenta mensagens úteis sem vazar detalhes sensíveis.
  - Backups automáticos diários do banco (ver documento de infraestrutura).
- Segurança
  - Suporte a tráfego HTTPS quando a plataforma de hospedagem o fornece.
  - Senhas armazenadas somente com hash forte (ex.: bcrypt) e política mínima (≥ 8 caracteres).
  - CORS habilitado e respostas JSON padronizadas.
  - Entradas validadas e saneadas no backend (uso de SQL parametrizado) para mitigar injeção; validação básica no frontend.
- Manutenibilidade
  - Código organizado por camadas/pastas; contratos REST simples em JSON.
  - Padronização de estilo e tipagem no frontend; revisões de código e commits descritivos.
- Observabilidade
  - Health check exposto pelo serviço web.
- Portabilidade
  - Configuração via variáveis de ambiente; empacotamento com Docker conforme descrito na infraestrutura.

### 3. Requisitos de interface com o usuário

- Suporte a navegadores modernos atualizados (Chrome, Edge, Firefox, Safari).
- Layout responsivo para desktop e dispositivos móveis (mínimo 360×640).
- Comportamento previsível ao redimensionar; componentes acessíveis (foco/aria) e estados de carregamento/esqueleto quando necessário.
- Mensagens de erro/sucesso consistentes, evitando jargão técnico.

### 4. Requisitos de interface com dispositivos externos

- Não há integração com hardware específico no escopo atual.
- Interação esperada: teclado, mouse/trackpad e toque em telas sensíveis (mobile/tablet).
- Caso integrações futuras (ex.: leitor de código de barras) sejam introduzidas, deverão utilizar APIs padrão do navegador/OS e documentação própria.

### 5. Requisitos de interface com outros sistemas

- Integração exclusivamente via API REST JSON.
  - Content‑Type `application/json`, `UTF‑8`; autenticação por Bearer token.
  - Códigos HTTP padronizados (2xx sucesso, 4xx erro do cliente, 5xx erro do servidor) com payload de erro consistente.
  - CORS habilitado para permitir consumo pelo frontend.

### 6. Conformidade (normas, leis e políticas) alinhadas ao escopo

- Proteção de dados pessoais: coleta mínima (nome, e‑mail) e senhas com hash forte; não armazenamento de segredos em claro no código.
- Acessibilidade: uso de componentes com boas práticas de acessibilidade onde aplicável (Radix/Shadcn).
- Padrões de desenvolvimento: REST para a API, SQL com parâmetros, logs sem dados sensíveis, princípio do menor privilégio no banco.
- Licenças de dependências respeitadas conforme `package.json` e runtime PHP.

### 7. Restrições a observar no projeto (design)

- Stacks e versões: Next.js/React no frontend; PHP 8.2 e MySQL 8 no backend (ver documento de arquitetura).
- Arquitetura: frontend desacoplado do backend via REST; serviços independentes.
- Fora do escopo atual: WebSockets/tempo real, upload de arquivos, filas assíncronas e replicação de banco.
- Infra: duas aplicações/serviços (front e back) com variáveis de ambiente para configuração.

### 8. Aspectos de licenciamento

- Ausência de arquivo de licença no repositório até o momento. Para fins acadêmicos, o uso é interno à disciplina.
- Recomendação: adotar licença permissiva (ex.: MIT) antes de divulgação pública do repositório.
- Garantir compatibilidade com licenças de dependências utilizadas.

### 9. Requisitos quanto à documentação

- Guia de execução local e de implantação mantidos atualizados (`README.md` e documentos em `docs/`). 
- Endpoints REST localizados em `public/*` com contratos JSON simples; cliente de API exposto em `lib/api.ts`.
- Diagrama/Descrição do modelo de dados conforme `database/schema.sql`.
- Registro resumido de decisões de arquitetura relevantes no documento de arquitetura.


