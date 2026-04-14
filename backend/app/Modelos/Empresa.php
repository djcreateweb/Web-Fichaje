<?php

namespace App\Modelos;

use App\Modelos\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int         $id
 * @property int         $tenant_id
 * @property string      $nombre
 * @property string      $slug
 * @property string      $correo_administrador
 * @property string|null $telefono
 * @property string|null $direccion
 * @property array|null  $configuracion
 * @property bool        $requiere_geolocalizacion
 * @property int|null    $radio_permitido_metros
 * @property float|null  $latitud_oficina
 * @property float|null  $longitud_oficina
 * @property bool        $activa
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class Empresa extends Model
{
    use BelongsToTenant;

    protected $table = 'empresas';

    protected $fillable = [
        'tenant_id',
        'nombre',
        'slug',
        'correo_administrador',
        'telefono',
        'direccion',
        'configuracion',
        'requiere_geolocalizacion',
        'radio_permitido_metros',
        'latitud_oficina',
        'longitud_oficina',
        'activa',
    ];

    protected $casts = [
        'configuracion'            => 'array',
        'requiere_geolocalizacion' => 'boolean',
        'activa'                   => 'boolean',
        'latitud_oficina'          => 'float',
        'longitud_oficina'         => 'float',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function empleados(): HasMany
    {
        return $this->hasMany(Empleado::class);
    }

    public function fichajes(): HasMany
    {
        return $this->hasMany(Fichaje::class);
    }

    public function solicitudes(): HasMany
    {
        return $this->hasMany(Solicitud::class);
    }
}
