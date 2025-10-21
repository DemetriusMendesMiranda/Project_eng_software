<?php
declare(strict_types=1);

class Usuario
{
    private int $idUsuario;
    private string $nome;
    private string $email;
    private string $senhaHash;
    private array $times = [];
    private array $tarefas = [];

    public function login(): bool
    {
        return true;
    }

    public function logout(): void
    {
    }

    public function atualizarPerfil(): void
    {
    }

    public function adicionarTime(Time $time): void
    {
        if (!in_array($time, $this->times, true)) {
            $this->times[] = $time;
            $time->adicionarMembro($this);
        }
    }

    public function removerTime(Time $time): void
    {
        $this->times = array_values(array_filter($this->times, static function ($t) use ($time) {
            return $t !== $time;
        }));

        if (method_exists($time, 'getUsuarios') && in_array($this, $time->getUsuarios(), true)) {
            $time->removerMembro($this);
        }
    }

    public function getTimes(): array
    {
        return $this->times;
    }

    public function adicionarTarefa(Tarefa $tarefa): void
    {
        if (!in_array($tarefa, $this->tarefas, true)) {
            $this->tarefas[] = $tarefa;
            if (method_exists($tarefa, 'getResponsavel') && $tarefa->getResponsavel() !== $this) {
                $tarefa->atribuirResponsavel($this);
            }
        }
    }

    public function removerTarefa(Tarefa $tarefa): void
    {
        $this->tarefas = array_values(array_filter($this->tarefas, static function ($t) use ($tarefa) {
            return $t !== $tarefa;
        }));

        if (method_exists($tarefa, 'getResponsavel') && $tarefa->getResponsavel() === $this) {
            if (method_exists($tarefa, 'removerResponsavel')) {
                $tarefa->removerResponsavel();
            }
        }
    }

    public function getTarefas(): array
    {
        return $this->tarefas;
    }
}


