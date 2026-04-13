<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (["empresas", "empleados", "fichajes", "ausencias"] as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->foreignId("tenant_id")->nullable(false)->change();
            });
        }

        Schema::table("empleados", function (Blueprint $table) {
            $table->unique(["tenant_id", "correo"]);
        });
    }

    public function down(): void
    {
        Schema::table("empleados", function (Blueprint $table) {
            $table->dropUnique(["tenant_id", "correo"]);
        });

        foreach (["empresas", "empleados", "fichajes", "ausencias"] as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->foreignId("tenant_id")->nullable()->change();
            });
        }
    }
};
