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

$tables = $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
echo "Base de datos: {$db}\n";
echo "Tablas: " . count($tables) . "\n\n";

foreach ($tables as $t) {
    $count = (int) $pdo->query("SELECT COUNT(*) AS c FROM {$t}")->fetchColumn();
    echo str_pad((string) $t, 30) . " " . $count . "\n";
}

echo "\n";

function dumpRows(PDO $pdo, string $title, string $sql): void
{
    echo "== {$title} ==\n";
    $rows = $pdo->query($sql)->fetchAll();
    if (!$rows) {
        echo "(sin datos)\n\n";
        return;
    }
    foreach ($rows as $row) {
        echo json_encode($row, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n";
    }
    echo "\n";
}

dumpRows($pdo, 'TENANTS', 'SELECT id, slug, nombre, plan, activo FROM tenants ORDER BY id');
dumpRows($pdo, 'EMPRESAS', 'SELECT id, tenant_id, nombre, slug, correo_administrador, telefono, direccion, requiere_geolocalizacion, radio_permitido_metros, activa FROM empresas ORDER BY id');
dumpRows($pdo, 'EMPLEADOS', 'SELECT id, tenant_id, empresa_id, nombre, apellidos, correo, rol, departamento, puesto, telefono, activo, debe_cambiar_password FROM empleados ORDER BY id');
dumpRows($pdo, 'SUPERADMINS', 'SELECT id, email, created_at FROM superadmins ORDER BY id');

