<?php

namespace App\Modelos;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Tenant extends Model
{
    protected $table = "tenants";

    protected $fillable = [
        "nombre",
        "slug",
        "plan",
        "activo",
    ];

    protected $casts = [
        "activo" => "boolean",
    ];

    public static function generarSlug(string $nombre): string
    {
        return Str::slug(Str::ascii($nombre));
    }
}
