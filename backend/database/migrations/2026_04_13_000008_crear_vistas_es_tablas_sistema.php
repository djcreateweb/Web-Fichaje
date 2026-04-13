<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Alias en español para tablas "en inglés" que aparecen en phpMyAdmin.
        // No renombramos tablas reales (Laravel depende de esos nombres).
        // Creamos VISTAS para que cualquier usuario de la BD las vea.

        $views = [
            // Cache / sesiones / colas
            '90_cache' => 'SELECT * FROM cache',
            '91_bloqueos_cache' => 'SELECT * FROM cache_locks',
            '92_sesiones' => 'SELECT * FROM sessions',
            '93_trabajos_cola' => 'SELECT * FROM jobs',
            '94_lotes_trabajos' => 'SELECT * FROM job_batches',
            '95_trabajos_fallidos' => 'SELECT * FROM failed_jobs',

            // Migraciones
            '96_migraciones' => 'SELECT * FROM migrations',

            // Tokens (Sanctum)
            '97_tokens_acceso_personal' => 'SELECT * FROM personal_access_tokens',

            // Multi-tenant / programador
            '98_inquilinos' => 'SELECT * FROM tenants',
            '99_impersonaciones_programador' => 'SELECT * FROM programador_impersonations',

            // Superadmin
            '89_superadministradores' => 'SELECT * FROM superadmins',
        ];

        foreach ($views as $name => $select) {
            DB::statement("DROP VIEW IF EXISTS `$name`");
            DB::statement("CREATE VIEW `$name` AS $select");
        }
    }

    public function down(): void
    {
        $names = [
            '89_superadministradores',
            '90_cache',
            '91_bloqueos_cache',
            '92_sesiones',
            '93_trabajos_cola',
            '94_lotes_trabajos',
            '95_trabajos_fallidos',
            '96_migraciones',
            '97_tokens_acceso_personal',
            '98_inquilinos',
            '99_impersonaciones_programador',
        ];

        foreach ($names as $name) {
            DB::statement("DROP VIEW IF EXISTS `$name`");
        }
    }
};

