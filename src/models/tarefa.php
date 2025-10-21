<?php
declare(strict_types=1);

class Tarefa
{
    private int $idTarefa;
    private string $descricao;
    private float $estimativaHoras;
    private string $status; // A Fazer, Em Progresso, Feito

    public function atribuirResponsavel(Usuario $usuario): void
    {
    }

    public function atualizarStatus(): void
    {
    }
}


