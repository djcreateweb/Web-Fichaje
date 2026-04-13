<?php

namespace App\Modelos;

use App\Modelos\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

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
