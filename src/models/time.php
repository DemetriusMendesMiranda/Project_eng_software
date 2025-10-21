<?php
declare(strict_types=1);

class Time
{
    private int $idTime;
    private string $nome;
    private array $usuarios = [];
    private ?Projeto $projeto = null;

    public function adicionarMembro(Usuario $usuario): void
    {
        if (!in_array($usuario, $this->usuarios, true)) {
            $this->usuarios[] = $usuario;
            if (method_exists($usuario, 'getTimes') && !in_array($this, $usuario->getTimes(), true)) {
                $usuario->adicionarTime($this);
            }
        }
    }

    public function removerMembro(Usuario $usuario): void
    {
        $this->usuarios = array_values(array_filter($this->usuarios, static function ($u) use ($usuario) {
            return $u !== $usuario;
        }));

        if (method_exists($usuario, 'getTimes') && in_array($this, $usuario->getTimes(), true)) {
            $usuario->removerTime($this);
        }
    }

    public function getUsuarios(): array
    {
        return $this->usuarios;
    }

    public function definirProjeto(Projeto $projeto): void
    {
        $this->projeto = $projeto;
        if (method_exists($projeto, 'getTimes') && !in_array($this, $projeto->getTimes(), true)) {
            $projeto->adicionarTime($this);
        }
    }

    public function getProjeto(): ?Projeto
    {
        return $this->projeto;
    }
}


