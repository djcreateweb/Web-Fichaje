<?php

namespace Database\Seeders;

use App\Modelos\Empleado;
use App\Modelos\Empresa;
use App\Modelos\Tenant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperiorSemilla extends Seeder
{
    public function run(): void
    {
        $tenantId = Tenant::query()->where("slug", "demo")->value("id");
        $empresaId = Empresa::query()->where("tenant_id", $tenantId)->value("id");

        Empleado::updateOrCreate(
            ["tenant_id" => $tenantId, "correo" => "superior@presentia.local"],
            [
                "tenant_id"             => $tenantId,
                "empresa_id"            => $empresaId,
                "nombre"                => "Laura",
                "apellidos"             => "García",
                "correo"                => "superior@presentia.local",
                "contrasena"            => Hash::make("Superior1234!"),
                "rol"                   => "superior",
                "departamento"          => "Operaciones",
                "puesto"                => "Responsable de equipo",
                "telefono"              => "+34 600 000 002",
                "activo"                => true,
                "debe_cambiar_password" => false,
            ]
        );
    }
}

