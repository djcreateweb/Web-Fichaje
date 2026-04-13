<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            TenantSemilla::class,
            SuperadminSemilla::class,
            EmpresaSemilla::class,
            AdministradorSemilla::class,
            SuperiorSemilla::class,
            EmpleadoSemilla::class,
        ]);
    }
}
