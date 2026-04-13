<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $tenantId = DB::table("tenants")->where("slug", "demo")->value("id");

        if (!$tenantId) {
            $tenantId = DB::table("tenants")->insertGetId([
                "nombre" => "Presentia Demo",
                "slug" => "demo",
                "plan" => "pro",
                "activo" => true,
                "created_at" => now(),
                "updated_at" => now(),
            ]);
        }

        foreach (["empresas", "empleados", "fichajes", "ausencias"] as $tableName) {
            DB::table($tableName)->whereNull("tenant_id")->update(["tenant_id" => $tenantId]);
        }
    }

    public function down(): void
    {
        foreach (["empresas", "empleados", "fichajes", "ausencias"] as $tableName) {
            DB::table($tableName)->update(["tenant_id" => null]);
        }
    }
};
