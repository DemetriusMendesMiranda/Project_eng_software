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
    private ?Projeto $projeto = null;
    private array $itens = [];

    public function iniciarSprint(): void
    {
    }

    public function finalizarSprint(): void
    {
    }

    public function adicionarItem(ItemBacklog $item): void
    {
        if (!in_array($item, $this->itens, true)) {
            $this->itens[] = $item;
        }
    }

    public function definirProjeto(Projeto $projeto): void
    {
        $this->projeto = $projeto;
        if (method_exists($projeto, 'getSprints') && !in_array($this, $projeto->getSprints(), true)) {
            $projeto->adicionarSprint($this);
        }
    }

    public function getProjeto(): ?Projeto
    {
        return $this->projeto;
    }

    public function getItens(): array
    {
        return $this->itens;
    }
}


