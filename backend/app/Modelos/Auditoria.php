<?php

namespace App\Modelos;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Auditoria extends Model
{
    protected $table = 'auditoria';

    public $timestamps = false;

    protected $fillable = [
        'tenant_id',
        'empleado_id',
        'empresa_id',
        'accion',
        'entidad_tipo',
        'entidad_id',
        'datos_anteriores',
        'datos_nuevos',
        'ip_address',
        'user_agent',
        'created_at',
    ];

    protected $casts = [
        'datos_anteriores' => 'array',
        'datos_nuevos'     => 'array',
        'created_at'       => 'datetime',
    ];

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class);
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    /** Helper estático para registrar una acción de auditoría */
    public static function registrar(
        string $accion,
        ?int $tenantId = null,
        ?int $empleadoId = null,
        ?int $empresaId = null,
        ?string $entidadTipo = null,
        ?int $entidadId = null,
        ?array $datosAnteriores = null,
        ?array $datosNuevos = null,
        ?string $ip = null,
        ?string $userAgent = null,
    ): void {
        static::create([
            'accion'           => $accion,
            'tenant_id'        => $tenantId,
            'empleado_id'      => $empleadoId,
            'empresa_id'       => $empresaId,
            'entidad_tipo'     => $entidadTipo,
            'entidad_id'       => $entidadId,
            'datos_anteriores' => $datosAnteriores,
            'datos_nuevos'     => $datosNuevos,
            'ip_address'       => $ip,
            'user_agent'       => $userAgent,
            'created_at'       => now(),
        ]);
    }
}
