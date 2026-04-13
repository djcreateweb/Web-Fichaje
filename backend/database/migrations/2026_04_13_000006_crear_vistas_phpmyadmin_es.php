<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Vistas para "apartados" en phpMyAdmin (aparecen en el listado de tablas).
        // No renombramos tablas internas de Laravel para no romper el framework.

        DB::statement('DROP VIEW IF EXISTS apartado_superadmin');
        DB::statement('DROP VIEW IF EXISTS apartado_admin');
        DB::statement('DROP VIEW IF EXISTS apartado_superior');
        DB::statement('DROP VIEW IF EXISTS apartado_empleado');

        DB::statement("
            CREATE VIEW apartado_superadmin AS
            SELECT
                id,
                email AS correo,
                created_at AS creado_en
            FROM superadmins
        ");

        DB::statement("
            CREATE VIEW apartado_admin AS
            SELECT
                id,
                nombre,
                apellidos,
                correo,
                empresa_id,
                tenant_id,
                departamento,
                puesto,
                telefono,
                activo,
                debe_cambiar_password
            FROM empleados
            WHERE rol IN ('admin','administrador')
        ");

        DB::statement("
            CREATE VIEW apartado_superior AS
            SELECT
                id,
                nombre,
                apellidos,
                correo,
                empresa_id,
                tenant_id,
                departamento,
                puesto,
                telefono,
                activo,
                debe_cambiar_password
            FROM empleados
            WHERE rol IN ('superior','supervisor')
        ");

        DB::statement("
            CREATE VIEW apartado_empleado AS
            SELECT
                id,
                nombre,
                apellidos,
                correo,
                empresa_id,
                tenant_id,
                departamento,
                puesto,
                telefono,
                activo,
                debe_cambiar_password
            FROM empleados
            WHERE rol = 'empleado'
        ");
    }

    public function down(): void
    {
        DB::statement('DROP VIEW IF EXISTS apartado_superadmin');
        DB::statement('DROP VIEW IF EXISTS apartado_admin');
        DB::statement('DROP VIEW IF EXISTS apartado_superior');
        DB::statement('DROP VIEW IF EXISTS apartado_empleado');
    }
};

