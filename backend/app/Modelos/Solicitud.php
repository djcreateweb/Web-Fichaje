<?php

namespace App\Modelos;

use App\Modelos\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Solicitud extends Model
{
    use BelongsToTenant;

    protected $table = 'solicitudes';

    protected $fillable = [
        'tenant_id',
        'empleado_id',
        'empresa_id',
        'tipo',
        'fecha_inicio',
        'fecha_fin',
        'motivo',
        'estado',
        'revisado_por',
        'fecha_revision',
        'comentario_revision',
    ];

    protected $casts = [
        'fecha_inicio'    => 'date',
        'fecha_fin'       => 'date',
        'fecha_revision'  => 'datetime',
    ];

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class);
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    public function revisor(): BelongsTo
    {
        return $this->belongsTo(Empleado::class, 'revisado_por');
    }
}
