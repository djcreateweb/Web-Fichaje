<?php

namespace App\Modelos;

use App\Modelos\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Fichaje extends Model
{
    use BelongsToTenant;

    protected $table = 'fichajes';

    protected $fillable = [
        'tenant_id',
        'empresa_id',
        'empleado_id',
        'tipo',
        'fecha_hora',
        'latitud',
        'longitud',
        'direccion_aproximada',
        'dentro_de_rango',
        'ip_address',
        'user_agent',
        'notas',
    ];

    protected $casts = [
        'fecha_hora'     => 'datetime',
        'latitud'        => 'float',
        'longitud'       => 'float',
        'dentro_de_rango' => 'boolean',
    ];

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class);
    }
}
