<?php

namespace App\Modelos;

use App\Modelos\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

/**
 * @property int         $id
 * @property int         $tenant_id
 * @property int         $empresa_id
 * @property string      $nombre
 * @property string|null $apellidos
 * @property string      $correo
 * @property string      $contrasena
 * @property string      $rol
 * @property string|null $departamento
 * @property string|null $puesto
 * @property string|null $telefono
 * @property bool        $activo
 * @property bool        $debe_cambiar_password
 * @property \Illuminate\Support\Carbon|null $ultimo_acceso
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read string $rol_normalizado
 */
class Empleado extends Authenticatable
{
    use BelongsToTenant, HasApiTokens, HasFactory;

    protected $table = 'empleados';

    protected $fillable = [
        'tenant_id',
        'empresa_id',
        'nombre',
        'apellidos',
        'correo',
        'contrasena',
        'rol',
        'departamento',
        'puesto',
        'telefono',
        'activo',
        'debe_cambiar_password',
        'ultimo_acceso',
    ];

    protected $hidden = [
        'contrasena',
        'remember_token',
    ];

    protected $casts = [
        'activo'               => 'boolean',
        'debe_cambiar_password' => 'boolean',
        'ultimo_acceso'        => 'datetime',
    ];

    public function getAuthPassword(): string
    {
        return $this->contrasena;
    }

    /** Normaliza el rol a valores canónicos: 'admin', 'supervisor', 'empleado' */
    public function getRolNormalizadoAttribute(): string
    {
        return match ($this->rol) {
            'administrador' => 'admin',
            'superior'      => 'supervisor',
            default         => $this->rol ?? 'empleado',
        };
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    public function fichajes(): HasMany
    {
        return $this->hasMany(Fichaje::class);
    }

    public function solicitudes(): HasMany
    {
        return $this->hasMany(Solicitud::class);
    }

    public function solicitudesRevisadas(): HasMany
    {
        return $this->hasMany(Solicitud::class, 'revisado_por');
    }
}
