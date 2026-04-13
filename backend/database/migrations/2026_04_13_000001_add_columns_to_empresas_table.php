<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('empresas', function (Blueprint $table) {
            $table->string('slug', 120)->nullable()->after('nombre');
            $table->string('telefono', 30)->nullable()->after('correo_administrador');
            $table->string('direccion', 255)->nullable()->after('telefono');
            $table->json('configuracion')->nullable()->after('direccion');
            $table->boolean('requiere_geolocalizacion')->default(false)->after('configuracion');
            $table->integer('radio_permitido_metros')->nullable()->after('requiere_geolocalizacion');
            $table->decimal('latitud_oficina', 10, 8)->nullable()->after('radio_permitido_metros');
            $table->decimal('longitud_oficina', 11, 8)->nullable()->after('latitud_oficina');
            $table->boolean('activa')->default(true)->after('longitud_oficina');
        });

        // Generar slug para registros existentes
        $empresas = DB::table('empresas')->get();
        foreach ($empresas as $empresa) {
            $base = Str::slug(Str::ascii($empresa->nombre));
            $slug = $base;
            $i = 1;
            while (DB::table('empresas')->where('slug', $slug)->where('id', '!=', $empresa->id)->exists()) {
                $slug = $base . '-' . $i++;
            }
            DB::table('empresas')->where('id', $empresa->id)->update(['slug' => $slug]);
        }

        Schema::table('empresas', function (Blueprint $table) {
            $table->unique('slug');
        });
    }

    public function down(): void
    {
        Schema::table('empresas', function (Blueprint $table) {
            $table->dropUnique(['slug']);
            $table->dropColumn([
                'slug', 'telefono', 'direccion', 'configuracion',
                'requiere_geolocalizacion', 'radio_permitido_metros',
                'latitud_oficina', 'longitud_oficina', 'activa',
            ]);
        });
    }
};
