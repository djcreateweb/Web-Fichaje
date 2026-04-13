<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('empleados', function (Blueprint $table) {
            $table->string('apellidos', 150)->nullable()->after('nombre');
            $table->string('departamento', 100)->nullable()->after('correo');
            $table->string('puesto', 100)->nullable()->after('departamento');
            $table->string('telefono', 30)->nullable()->after('puesto');
            $table->boolean('debe_cambiar_password')->default(true)->after('activo');
            $table->timestamp('ultimo_acceso')->nullable()->after('debe_cambiar_password');
        });

        // Cambiar enum para incluir 'admin' además de 'administrador'
        // (mantenemos compatibilidad: 'administrador' sigue siendo válido en DB, la app mapea a 'admin')
        DB::statement("ALTER TABLE empleados MODIFY rol ENUM('admin','administrador','supervisor','superior','empleado') NOT NULL DEFAULT 'empleado'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE empleados MODIFY rol ENUM('administrador','superior','empleado') NOT NULL DEFAULT 'empleado'");

        Schema::table('empleados', function (Blueprint $table) {
            $table->dropColumn([
                'apellidos', 'departamento', 'puesto', 'telefono',
                'debe_cambiar_password', 'ultimo_acceso',
            ]);
        });
    }
};
