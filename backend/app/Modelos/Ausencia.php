<?php

namespace App\Modelos;

use App\Modelos\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class Ausencia extends Model
{
    use BelongsToTenant;

    protected $table = "ausencias";

    protected $fillable = [
        "tenant_id",
        "empresa_id",
        "empleado_id",
        "tipo",
        "fecha_inicio",
        "fecha_fin",
        "motivo",
    ];
}
