<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('solicitudes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('empleado_id')->constrained('empleados')->cascadeOnDelete();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->enum('tipo', ['vacaciones', 'ausencia', 'correccion_fichaje', 'otro']);
            $table->date('fecha_inicio');
            $table->date('fecha_fin')->nullable();
            $table->text('motivo');
            $table->enum('estado', ['pendiente', 'aprobada', 'rechazada'])->default('pendiente');
            $table->foreignId('revisado_por')->nullable()->constrained('empleados')->nullOnDelete();
            $table->timestamp('fecha_revision')->nullable();
            $table->text('comentario_revision')->nullable();
            $table->timestamps();

            $table->index(['empresa_id', 'estado']);
            $table->index(['empleado_id', 'estado']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('solicitudes');
    }
};
