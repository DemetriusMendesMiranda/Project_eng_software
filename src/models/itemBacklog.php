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
    private ?Projeto $projeto = null;

    public function criarItem(): void
    {
    }

    public function atualizarStatus(): void
    {
    }

    public function definirPrioridade(): void
    {
    }

    public function definirProjeto(Projeto $projeto): void
    {
        $this->projeto = $projeto;
        if (method_exists($projeto, 'getItensBacklog') && !in_array($this, $projeto->getItensBacklog(), true)) {
            $projeto->adicionarItemBacklog($this);
        }
    }

    public function getProjeto(): ?Projeto
    {
        return $this->projeto;
    }
}


