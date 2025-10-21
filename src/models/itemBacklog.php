<?php
declare(strict_types=1);

class ItemBacklog
{
    private int $idItem;
    private string $titulo;
    private string $descricao;
    private int $prioridade;
    private int $estimativa;
    private string $status; // Para Fazer, Em Andamento, Concluido

    public function criarItem(): void
    {
    }

    public function atualizarStatus(): void
    {
    }

    public function definirPrioridade(): void
    {
    }
}


