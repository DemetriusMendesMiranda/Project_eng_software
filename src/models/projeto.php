<?php
declare(strict_types=1);

class Projeto
{
    private int $idProjeto;
    private string $nome;
    private string $descricao;
    private \DateTime $dataInicio;
    private \DateTime $dataFimPrevista;
    private array $times = [];
    private array $itensBacklog = [];
    private array $sprints = [];

    public function criarProjeto(): void
    {
    }

    public function editarProjeto(): void
    {
    }

    public function arquivarProjeto(): void
    {
    }

    public function adicionarTime(Time $time): void
    {
        if (!in_array($time, $this->times, true)) {
            $this->times[] = $time;
        }
    }

    public function getTimes(): array
    {
        return $this->times;
    }

    public function adicionarItemBacklog(ItemBacklog $item): void
    {
        if (!in_array($item, $this->itensBacklog, true)) {
            $this->itensBacklog[] = $item;
        }
    }

    public function getItensBacklog(): array
    {
        return $this->itensBacklog;
    }

    public function adicionarSprint(Sprint $sprint): void
    {
        if (!in_array($sprint, $this->sprints, true)) {
            $this->sprints[] = $sprint;
        }
    }

    public function getSprints(): array
    {
        return $this->sprints;
    }
}


