<?php
declare(strict_types=1);

class Sprint
{
    private int $idSprint;
    private string $nome;
    private string $objetivo;
    private \DateTime $dataInicio;
    private \DateTime $dataFim;
    private string $status; // Planejada, Ativa, Concluida

    public function iniciarSprint(): void
    {
    }

    public function finalizarSprint(): void
    {
    }

    public function adicionarItem(ItemBacklog $item): void
    {
    }
}


