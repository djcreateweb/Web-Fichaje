<?php

namespace Database\Seeders;

use App\Modelos\Empleado;
use App\Modelos\Empresa;
use App\Modelos\Tenant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class EmpleadoSemilla extends Seeder
{
    public function run(): void
    {
        $tenantId = Tenant::query()->where("slug", "demo")->value("id");
        $empresaId = Empresa::query()->where("tenant_id", $tenantId)->value("id");

        Empleado::updateOrCreate(
            ["tenant_id" => $tenantId, "correo" => "empleado@presentia.local"],
            [
                "tenant_id"             => $tenantId,
                "empresa_id"            => $empresaId,
                "nombre"                => "Marta",
                "apellidos"             => "López",
                "contrasena"            => Hash::make("Empleado1234!"),
                "rol"                   => "empleado",
                "departamento"          => "Producción",
                "puesto"                => "Operaria",
                "telefono"              => "+34 600 000 003",
                "activo"                => true,
                "debe_cambiar_password" => false,
            ]
        );
    }
}
