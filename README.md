# Project_eng_software
Projeto de Engenharia de Software

## Executar localmente (macOS, Linux e Windows)

### Pré-requisitos
- PHP 8 (CLI)
- MySQL 8 (servidor)
- Terminal (zsh/bash/PowerShell)

### Instalar dependências
macOS (Homebrew):
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew update
brew install php mysql
```

Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install -y php php-cli php-mysql mysql-server
```

Linux (Fedora):
```bash
sudo dnf install -y php php-cli php-mysqlnd @mysql
sudo systemctl enable --now mysqld
```

Windows (opções):
- XAMPP (mais simples): instale o XAMPP e habilite Apache/PHP e MySQL.
- Chocolatey:
```powershell
choco install php mysql
```
- Winget:
```powershell
winget install PHP.PHP
winget install Oracle.MySQL
```
- Alternativa recomendada: WSL + Ubuntu e siga os passos do Linux Ubuntu.

### Iniciar o MySQL
macOS (Homebrew):
```bash
brew services start mysql
mysql --version
```

Linux (systemd):
```bash
sudo systemctl enable --now mysql  # ou mysqld, dependendo da distro
mysql --version
```

Windows:
- XAMPP: abra o XAMPP Control Panel e clique em Start no MySQL.
- Serviço MySQL: inicie o serviço "MySQL80" pelo Services.msc ou PowerShell (`Start-Service MySQL80`).

### (Opcional) Definir senha do root e criar usuário do app
```bash
mysql_secure_installation   # siga os prompts se quiser

# Acessar o MySQL (ajuste -p se tiver senha definida)
mysql -u root

-- dentro do MySQL:
CREATE DATABASE IF NOT EXISTS scrum_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'engsoft'@'%' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON scrum_db.* TO 'engsoft'@'%';
FLUSH PRIVILEGES;
EXIT;
```

Observação: Para apenas testar a página inicial, não é obrigatório importar o schema agora (a página de teste só executa `SELECT 1`). O arquivo `database/schema.sql` modela as tabelas e pode exigir ajustes para MySQL. Se quiser criar as tabelas depois, adapte os tipos para MySQL antes de executar.

### Definir variáveis de ambiente (sessão atual)
macOS/Linux (bash/zsh):
```bash
export DB_HOST=127.0.0.1
export DB_PORT=3306
export DB_NAME=scrum_db
export DB_USER=engsoft      # ou root
export DB_PASS=strong_password
export DB_CHARSET=utf8mb4
```

Windows (PowerShell, somente para a sessão atual):
```powershell
$env:DB_HOST = "127.0.0.1"
$env:DB_PORT = "3306"
$env:DB_NAME = "scrum_db"
$env:DB_USER = "engsoft"   # ou root
$env:DB_PASS = "strong_password"
$env:DB_CHARSET = "utf8mb4"
```

Windows (CMD, somente para a sessão atual):
```cmd
set DB_HOST=127.0.0.1
set DB_PORT=3306
set DB_NAME=scrum_db
set DB_USER=engsoft
set DB_PASS=strong_password
set DB_CHARSET=utf8mb4
```

Para tornar permanente (macOS/Linux), adicione ao `~/.zshrc` ou `~/.bashrc` e rode `source` no arquivo correspondente.

### Subir o servidor PHP embutido
```bash
cd Project_eng_software
php -S localhost:8000 -t public
```

Abra `http://localhost:8000/` no navegador. A página mostrará a data/hora e o status da conexão MySQL.

### Resolução de problemas
- Conexão recusada: verifique se o MySQL está em execução (Homebrew Services, systemd, XAMPP/serviço no Windows).
- Falha de autenticação: confira `DB_USER/DB_PASS` e permissões no `scrum_db`.
- Banco desconhecido: crie o DB (`CREATE DATABASE scrum_db ...`).
- Use `DB_HOST=127.0.0.1` (não `localhost`) para forçar conexão TCP no PDO.

## Frontend (Next.js)

O frontend (pasta `app/` e componentes React) espera consumir uma API PHP via HTTP.

1) Configure a URL base da API no ambiente do Next.js:

macOS/Linux (bash/zsh):
```bash
export NEXT_PUBLIC_API_BASE_URL="http://localhost:8000"  # URL do servidor PHP
```

Windows (PowerShell):
```powershell
$env:NEXT_PUBLIC_API_BASE_URL = "http://localhost:8000"
```

2) Execute o Next.js em desenvolvimento:
```bash
pnpm install
pnpm dev
```

3) A aplicação usará `NEXT_PUBLIC_API_BASE_URL` para fazer chamadas (ex.: `/projects`, `/backlog`, `/auth/login`).
Se necessário, ajuste as rotas no backend para corresponderem a esses endpoints ou atualize `lib/api.ts` com os caminhos corretos.

