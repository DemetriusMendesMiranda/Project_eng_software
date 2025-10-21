<?php
declare(strict_types=1);

class Tarefa
{
    private int $idTarefa;
    private string $descricao;
    private float $estimativaHoras;
    private string $status; // A Fazer, Em Progresso, Feito
    private ?Usuario $responsavel = null;

    public function atribuirResponsavel(Usuario $usuario): void
    {
        if ($this->responsavel !== $usuario) {
            $this->responsavel = $usuario;
            if (method_exists($usuario, 'getTarefas') && !in_array($this, $usuario->getTarefas(), true)) {
                $usuario->adicionarTarefa($this);
            }
        }
    }

    public function atualizarStatus(): void
    {
    }

    public function getResponsavel(): ?Usuario
    {
        return $this->responsavel;
    }

    public function removerResponsavel(): void
    {
        $this->responsavel = null;
    }
}


