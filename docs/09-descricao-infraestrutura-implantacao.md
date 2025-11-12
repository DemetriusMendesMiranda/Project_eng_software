## 9. Descrição da infraestrutura de implantação

**Objetivo:** Descrever como o sistema será colocado em produção, cobrindo software, hardware e serviços necessários. Inclui diagrama de implantação e recomendações de operação.

### Visão geral da arquitetura

- **Aplicação Web:** PHP 8.2 servindo a pasta `public/` dentro de um contêiner Docker ou em VM (sem contêiner) com Nginx + PHP-FPM.
- **Banco de Dados:** MySQL (acesso via PDO com `pdo_mysql`), provisionado como serviço gerenciado.
- **Hospedagem:** Plataforma de nuvem (PaaS/IaaS/Kubernetes) executando o runtime da aplicação com health check em `/`.
- **Comunicação:** HTTP/HTTPS do cliente para o serviço web; conexão TCP 3306 do contêiner para o MySQL.

### Software (SO, frameworks, servidor, BD)

- **Sistema operacional base:** Em contêiner, Debian/Bookworm (imagem `php:8.2-cli`); em VM, distro LTS (ex.: Ubuntu 22.04/24.04) com pacotes atualizados.
- **Runtime/linguagem:** PHP 8.2.
- **Extensões PHP:** `pdo`, `pdo_mysql`, `mysqli` (instaladas no build).
- **Servidor HTTP:** Servidor embutido do PHP (`php -S 0.0.0.0:$PORT -t public`). Observação: para cenários de maior carga/segurança, recomenda-se Nginx + PHP-FPM.
- **Banco de Dados:** MySQL (ou compatível, ex.: MariaDB), charset `utf8mb4`.
- **Empacotamento:** Via Dockerfile (portabilidade) ou instalação direta em VM (sem contêiner) com PHP 8.2 e extensões.
- **Orquestração/Deploy:** Qualquer provedor que suporte contêiner (ex.: PaaS de containers, VMs com Docker, Kubernetes/Helm).
- **Dependências do repositório:** O projeto contém dependências de Next.js/React (ex.: `next`, `react` no `package.json`) para desenvolvimento da UI; o artefato de produção atual é o contêiner PHP que serve `public/`.

### Hardware (configuração mínima)

Para um ambiente inicial (turma/POC ou baixo tráfego):

- **Serviço Web (contêiner Docker):**
  - 1 vCPU
  - 512 MB a 1 GB RAM
  - Armazenamento efêmero mínimo (logs temporários); assets servidos de `public/`

- **Serviço Web (VM/sem contêiner):**
  - 1 vCPU
  - 1 GB RAM
  - 10 GB de armazenamento (SO + Nginx + PHP-FPM + logs)
  - Nginx + PHP-FPM apontando `root` para `public/`

- **Banco de Dados MySQL gerenciado:**
  - 1 vCPU
  - 1 GB RAM
  - 10 GB de armazenamento inicial (expansível conforme crescimento)
  - Backup diário automatizado habilitado

Para produção com tráfego moderado, considerar:

- Web: 1–2 vCPU, 1–2 GB RAM, autoscaling horizontal (2 instâncias) atrás de balanceador da plataforma.
- DB: 2 vCPU, 2–4 GB RAM, armazenamento 20–50 GB, IOPS provisionado conforme necessidade.

### Serviços (hospedagem, nuvem, APIs externas)

- **Hospedagem da aplicação:** Plataforma de contêiner (PaaS) ou IaaS (VMs) ou Kubernetes gerenciado; build via Docker e health check configurado em `/`.
- **Banco de Dados:** MySQL gerenciado (ex.: RDS/Aurora, Cloud SQL, Azure Database, PlanetScale, Railway). Recomendado VPC/privado ou IP allowlist.
- **DNS e TLS:** TLS automático do provedor ou gestão via Cloudflare/Route53/Cert-Manager (Kubernetes).
- **Logs e métricas:** Consolidadas na plataforma (ou via agentes) com opção de envio para Grafana/Loki, Datadog, New Relic, etc.
- **Backups:** Backups automáticos no provedor do MySQL; opcional snapshot adicional e testes de restauração periódicos.
- **CDN (opcional):** CDN integrada da plataforma ou Cloudflare para cache de assets estáticos de `public/`.
- **APIs externas (opcional):** Atualmente não há dependências obrigatórias; integrar conforme novas features (ex.: e-mail transacional, storage S3, analytics).

### Variáveis de ambiente

Configurar no gerenciador de segredos do provedor (PaaS/IaaS/Kubernetes Secrets). Em VM sem contêiner, definir via `systemd`/shell do serviço, ou arquivo `.env` carregado na inicialização.

```bash
# App (a maioria das plataformas define PORT automaticamente)
PORT=8080

# Banco de Dados (ajuste para seu provedor)
DB_HOST=<host do MySQL>
DB_PORT=3306
DB_NAME=scrum_db
DB_USER=<usuario>
DB_PASS=<senha>
DB_CHARSET=utf8mb4
```

Notas:
- O contêiner inicia com `php -S 0.0.0.0:${PORT:-8080} -t public`, portanto a aplicação deve responder no path `/` para o health check.
- Certifique-se de restringir o acesso do DB (rede privada/VPC ou IP allowlist) e usar TLS quando disponível.

### Processo de implantação (CI/CD)

1. Commit na `main` dispara pipeline de CI/CD (ex.: GitHub Actions, GitLab CI, provedor de nuvem) que builda a imagem Docker.
2. A imagem é publicada em um registry (ex.: GHCR, ECR, GCR, ACR).
3. O runtime (PaaS/VM/Kubernetes) faz rollout da nova versão e injeta variáveis de ambiente/segredos.
4. Health checks em `/` validam a saúde antes de promover o tráfego (blue/green ou rolling update).
5. Ambientes de preview podem ser criados automaticamente pelo pipeline/integrações do provedor.

Sem Docker (opcional):
- Pipeline realiza provisionamento de VM (ex.: Ansible/Terraform) e deploy do código (rsync/SSH ou artefato).
- Serviço gerenciado via `systemd`/supervisor; Nginx faz reload sem downtime; PHP-FPM com `pm` ajustado.

Checklist antes do deploy:
- Conferir migrações/DDL do MySQL e compatibilidade de tipos do `schema.sql`.
- Garantir que o usuário do DB tem permissões mínimas (LEAST PRIVILEGE).
- Revisar logs de build e health check após a promoção.

### Observabilidade (monitoramento e logs)

- **Logs de aplicação:** stdout/stderr do serviço (contêiner ou VM), visíveis no painel da plataforma; exportar para agregador opcional.
- **Métricas:** Latência por rota, taxa de erro HTTP, uso de CPU/RAM do contêiner, conexões DB.
- **Alertas:** Health check falhou, erro 5xx acima de limiar, conexões DB saturadas, espaço de disco do DB.

### Segurança

- **Segredos:** Armazenar somente em gerenciadores de segredos (Secrets do provedor, Vault, Kubernetes Secrets com KMS).
- **Tráfego:** HTTPS obrigatório (TLS gerenciado pelo provedor).
- **Banco:** Rede privada/VPC quando possível; senhas fortes e rotação periódica; princípio do menor privilégio.
- **Headers:** Adicionar cabeçalhos de segurança ao responder (ex.: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`). Considerar um proxy Nginx na frente, se necessário.
- **Atualizações:** Manter imagem base atualizada e rebuildar regularmente para patches de segurança.

### Backup e recuperação

- **DB:** Backups automáticos diários do provedor (retenção mínima 7–14 dias). Validar restauração trimestralmente (test restore).
- **Aplicação:** Rebuild a partir do repositório (imutável). Assets estáticos versionados no controle de versão; uploads devem ir para storage externo (ex.: S3) se/quando introduzidos.

### Escalabilidade e performance

- **Horizontal:** Aumentar número de instâncias do serviço web (autoscaling da plataforma).
- **Vertical:** Aumentar vCPU/RAM do serviço web e do DB conforme métricas.
- **Cache/CDN:** Ativar CDN para `public/` e cabeçalhos de cache adequados.
- **Conexões DB:** Pool de conexões (no PHP, reutilizar conexão compartilhada); índices nas consultas mais usadas.

### Diagrama de implantação

```mermaid
graph TD
  A[Usuário/Browser] -->|HTTPS| B[(CDN/Edge opcional)]
  B -->|HTTPS| C[Plataforma de Hospedagem (PaaS/IaaS/K8s)<br/>Runtime PHP 8.2 (Docker opcional)<br/>php -S ou Nginx+PHP-FPM]
  C -->|TCP 3306| D[(MySQL Gerenciado<br/>DB_HOST, DB_USER, DB_PASS)]

  classDef svc fill:#E3F2FD,stroke:#64B5F6,stroke-width:1px,color:#0D47A1;
  classDef db fill:#E8F5E9,stroke:#66BB6A,stroke-width:1px,color:#1B5E20;
  class C svc;
  class D db;
```

### Considerações finais

- O setup atual utiliza o servidor embutido do PHP por simplicidade acadêmica e baixo tráfego. Para produção real com requisitos de robustez, recomenda-se Nginx + PHP-FPM, workers gerenciados, e WAF/CDN.
- Docker é opcional: utilize contêineres para portabilidade e repetibilidade; em VM, siga as recomendações acima para Nginx + PHP-FPM e gestão de serviços.
- O repositório contém dependências de Next.js/React, porém o deploy descrito é do artefato PHP servido a partir de `public/`. Caso a UI em Next.js evolua para SSR/Edge, será necessário provisionar um serviço Node separado (ou ajustar o Dockerfile) e revisar o diagrama de implantação.


