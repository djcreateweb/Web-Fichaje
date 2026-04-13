<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Modelos\Tenant;
use App\Modelos\Empleado;

class ProgramadorImpersonation extends Model
{
    protected $table = "programador_impersonations";

    protected $fillable = [
        "tenant_id",
        "empleado_id",
        "token",
        "solo_lectura",
        "expira_en",
    ];

    protected $casts = [
        "solo_lectura" => "boolean",
        "expira_en" => "datetime",
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class);
    }
}
