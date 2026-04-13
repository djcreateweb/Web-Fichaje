<?php

namespace Database\Seeders;

use App\Models\Superadmin;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperadminSemilla extends Seeder
{
    public function run(): void
    {
        Superadmin::query()->updateOrCreate(
            ["email" => "superadmin@presentia.local"],
            ["password" => Hash::make("Superadmin1234!")]
        );
    }
}
