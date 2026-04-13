<?php

namespace Database\Seeders;

use App\Modelos\Empresa;
use App\Modelos\Tenant;
use Illuminate\Database\Seeder;

class EmpresaSemilla extends Seeder
{
    public function run(): void
    {
        $tenantId = Tenant::query()->where("slug", "demo")->value("id");

        Empresa::updateOrCreate(
            ["tenant_id" => $tenantId, "correo_administrador" => "admin@presentia.local"],
            [
                "tenant_id" => $tenantId,
                "nombre" => "Presentia (Demo)",
                "slug" => "presentia-demo",
                "telefono" => "+34 900 000 000",
                "direccion" => "Calle de la Demo, 1, 28000 Madrid",
                "requiere_geolocalizacion" => false,
                "radio_permitido_metros" => 150,
                "activa" => true,
            ]
        );
    }
}
