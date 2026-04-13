<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create("programador_impersonations", function (Blueprint $table) {
            $table->id();
            $table->foreignId("tenant_id")->constrained("tenants")->cascadeOnDelete();
            $table->foreignId("empleado_id")->nullable()->constrained("empleados")->nullOnDelete();
            $table->string("token", 120)->unique();
            $table->boolean("solo_lectura")->default(true);
            $table->timestamp("expira_en");
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists("programador_impersonations");
    }
};
