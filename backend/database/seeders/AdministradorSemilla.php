<?php

namespace Database\Seeders;

use App\Modelos\Empleado;
use App\Modelos\Empresa;
use App\Modelos\Tenant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdministradorSemilla extends Seeder
{
    public function run(): void
    {
        $tenantId = Tenant::query()->where("slug", "demo")->value("id");
        $empresaId = Empresa::query()->where("tenant_id", $tenantId)->value("id");

        Empleado::updateOrCreate(
            ["tenant_id" => $tenantId, "correo" => "admin@presentia.local"],
            [
                "tenant_id"             => $tenantId,
                "empresa_id"            => $empresaId,
                "nombre"                => "Carlos",
                "apellidos"             => "Pérez",
                "contrasena"            => Hash::make("Admin1234!"),
                "rol"                   => "admin",
                "departamento"          => "Administración",
                "puesto"                => "Administrador",
                "telefono"              => "+34 600 000 001",
                "activo"                => true,
                "debe_cambiar_password" => false,
            ]
        );
    }
}
