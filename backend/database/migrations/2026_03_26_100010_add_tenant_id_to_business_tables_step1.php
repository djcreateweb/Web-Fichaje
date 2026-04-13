<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $tables = ["empresas", "empleados", "fichajes", "ausencias"];

        foreach ($tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->foreignId("tenant_id")->nullable()->after("id")->constrained("tenants")->cascadeOnDelete();
                $table->index("tenant_id");
            });
        }

        Schema::table("empleados", function (Blueprint $table) {
            $table->dropUnique(["correo"]);
        });
    }

    public function down(): void
    {
        Schema::table("empleados", function (Blueprint $table) {
            $table->unique("correo");
        });

        $tables = ["empresas", "empleados", "fichajes", "ausencias"];

        foreach ($tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->dropConstrainedForeignId("tenant_id");
            });
        }
    }
};
