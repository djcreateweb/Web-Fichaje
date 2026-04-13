<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('fichajes', function (Blueprint $table) {
            // Columnas nuevas (modelo de evento discreto)
            $table->enum('tipo', ['entrada', 'salida', 'pausa_inicio', 'pausa_fin'])->after('empleado_id')->default('entrada');
            $table->timestamp('fecha_hora')->after('tipo')->useCurrent();
            $table->decimal('latitud', 10, 8)->nullable()->after('fecha_hora');
            $table->decimal('longitud', 11, 8)->nullable()->after('latitud');
            $table->string('direccion_aproximada', 255)->nullable()->after('longitud');
            $table->boolean('dentro_de_rango')->nullable()->after('direccion_aproximada');
            $table->string('ip_address', 45)->nullable()->after('dentro_de_rango');
            $table->text('user_agent')->nullable()->after('ip_address');
            $table->text('notas')->nullable()->after('user_agent');
        });

        // Quitar default ahora que todas las filas existentes están migradas
        DB::statement("ALTER TABLE fichajes MODIFY tipo ENUM('entrada','salida','pausa_inicio','pausa_fin') NOT NULL");
        DB::statement("ALTER TABLE fichajes MODIFY fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP");

        Schema::table('fichajes', function (Blueprint $table) {
            // Eliminar columnas del modelo antiguo (par entrada/salida en una fila)
            $table->dropColumn(['entrada', 'salida', 'horas_trabajadas']);

            // Índices para consultas frecuentes
            $table->index(['empleado_id', 'fecha_hora']);
            $table->index(['empresa_id', 'fecha_hora']);
        });
    }

    public function down(): void
    {
        Schema::table('fichajes', function (Blueprint $table) {
            $table->dropIndex(['empleado_id', 'fecha_hora']);
            $table->dropIndex(['empresa_id', 'fecha_hora']);
            $table->dropColumn([
                'tipo', 'fecha_hora', 'latitud', 'longitud',
                'direccion_aproximada', 'dentro_de_rango',
                'ip_address', 'user_agent', 'notas',
            ]);
            $table->dateTime('entrada')->nullable();
            $table->dateTime('salida')->nullable();
            $table->decimal('horas_trabajadas', 10, 2)->nullable();
        });
    }
};
