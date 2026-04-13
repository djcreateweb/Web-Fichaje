<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // El objetivo es que phpMyAdmin las muestre agrupadas/ordenadas arriba.
        // Creamos nuevas vistas con prefijo numérico y eliminamos las antiguas.

        DB::statement('DROP VIEW IF EXISTS 01_apartado_superadmin');
        DB::statement('DROP VIEW IF EXISTS 02_apartado_admin');
        DB::statement('DROP VIEW IF EXISTS 03_apartado_superior');
        DB::statement('DROP VIEW IF EXISTS 04_apartado_empleado');

        DB::statement("
            CREATE VIEW 01_apartado_superadmin AS
            SELECT
                id,
                email AS correo,
                created_at AS creado_en
            FROM superadmins
        ");

        DB::statement("
            CREATE VIEW 02_apartado_admin AS
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
            CREATE VIEW 03_apartado_superior AS
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
            CREATE VIEW 04_apartado_empleado AS
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

        // Eliminar las vistas sin prefijo (creadas en la migración anterior)
        DB::statement('DROP VIEW IF EXISTS apartado_superadmin');
        DB::statement('DROP VIEW IF EXISTS apartado_admin');
        DB::statement('DROP VIEW IF EXISTS apartado_superior');
        DB::statement('DROP VIEW IF EXISTS apartado_empleado');
    }

    public function down(): void
    {
        DB::statement('DROP VIEW IF EXISTS 01_apartado_superadmin');
        DB::statement('DROP VIEW IF EXISTS 02_apartado_admin');
        DB::statement('DROP VIEW IF EXISTS 03_apartado_superior');
        DB::statement('DROP VIEW IF EXISTS 04_apartado_empleado');

        DB::statement("
            CREATE VIEW apartado_superadmin AS
            SELECT id, email AS correo, created_at AS creado_en
            FROM superadmins
        ");
        DB::statement("
            CREATE VIEW apartado_admin AS
            SELECT id, nombre, apellidos, correo, empresa_id, tenant_id, departamento, puesto, telefono, activo, debe_cambiar_password
            FROM empleados
            WHERE rol IN ('admin','administrador')
        ");
        DB::statement("
            CREATE VIEW apartado_superior AS
            SELECT id, nombre, apellidos, correo, empresa_id, tenant_id, departamento, puesto, telefono, activo, debe_cambiar_password
            FROM empleados
            WHERE rol IN ('superior','supervisor')
        ");
        DB::statement("
            CREATE VIEW apartado_empleado AS
            SELECT id, nombre, apellidos, correo, empresa_id, tenant_id, departamento, puesto, telefono, activo, debe_cambiar_password
            FROM empleados
            WHERE rol = 'empleado'
        ");
    }
};

