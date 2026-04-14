<?php

namespace App\Modelos;

use App\Modelos\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int         $id
 * @property int         $tenant_id
 * @property int         $empresa_id
 * @property int         $empleado_id
 * @property string      $tipo
 * @property \Illuminate\Support\Carbon $fecha_hora
 * @property float|null  $latitud
 * @property float|null  $longitud
 * @property string|null $direccion_aproximada
 * @property bool|null   $dentro_de_rango
 * @property string|null $ip_address
 * @property string|null $user_agent
 * @property string|null $notas
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
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
