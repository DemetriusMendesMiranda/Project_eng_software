<?php
declare(strict_types=1);

final class Usuario
{
    private int $idUsuario;
    private string $nome;
    private string $email;
    private string $senhaHash;

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
}


