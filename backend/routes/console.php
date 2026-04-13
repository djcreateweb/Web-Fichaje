<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command("sistema:instalar", function () {
    $host = env("DB_HOST", "127.0.0.1");
    $port = env("DB_PORT", "3306");
    $database = env("DB_DATABASE", "fichaje");
    $username = env("DB_USERNAME", "root");
    $password = env("DB_PASSWORD", "");

    try {
        $pdo = new PDO("mysql:host={$host};port={$port};charset=utf8mb4", $username, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        ]);
        $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$database}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        $this->info("Base de datos lista: {$database}");
    } catch (Throwable $error) {
        $this->error("Error al crear la base de datos: " . $error->getMessage());
        return 1;
    }

    $this->call("migrate", ["--force" => true]);
    $this->call("db:seed", ["--force" => true]);
    $this->info("Instalacion completada.");
    return 0;
})->purpose("Instala entorno local, migraciones y semillas");
