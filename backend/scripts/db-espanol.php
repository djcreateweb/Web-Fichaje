<?php

declare(strict_types=1);

$host = getenv('DB_HOST') ?: '127.0.0.1';
$port = getenv('DB_PORT') ?: '3307';
$db = getenv('DB_DATABASE') ?: 'fichaje';
$user = getenv('DB_USERNAME') ?: 'root';
$pass = getenv('DB_PASSWORD') ?: '';

$dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $host, $port, $db);

try {
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (Throwable $e) {
    fwrite(STDERR, "Error conectando a DB: {$e->getMessage()}\n");
    exit(1);
}

$pdo->beginTransaction();
try {
    // Normalizar nombres en español (títulos y acentos) para tenants/empresas existentes.
    $pdo->exec("UPDATE tenants SET nombre='David Informática' WHERE slug='david-informatica'");
    $pdo->exec("UPDATE tenants SET nombre='Pepe Mecánico' WHERE slug='pepe-mecanico'");

    $pdo->exec("UPDATE empresas SET nombre='David Informática' WHERE slug='david-informatica'");
    $pdo->exec("UPDATE empresas SET nombre='Pepe Mecánico' WHERE slug='pepe-mecanico'");

    $pdo->commit();
    echo "OK: datos normalizados a español.\n";
} catch (Throwable $e) {
    $pdo->rollBack();
    fwrite(STDERR, "Error aplicando cambios: {$e->getMessage()}\n");
    exit(1);
}

