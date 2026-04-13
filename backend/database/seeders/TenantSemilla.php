<?php

namespace Database\Seeders;

use App\Modelos\Tenant;
use Illuminate\Database\Seeder;

class TenantSemilla extends Seeder
{
    public function run(): void
    {
        Tenant::query()->updateOrCreate(
            ["slug" => "demo"],
            [
                "nombre" => "Presentia Demo",
                "plan" => "pro",
                "activo" => true,
            ]
        );
    }
}
