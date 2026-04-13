<?php

namespace App\Http\Controllers;

use App\Modelos\Auditoria;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditoriaControlador extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Auditoria::query()->with('empleado:id,nombre,apellidos');

        if ($request->filled('empleado_id')) {
            $query->where('empleado_id', $request->empleado_id);
        }
        if ($request->filled('empresa_id')) {
            $query->where('empresa_id', $request->empresa_id);
        }
        if ($request->filled('accion')) {
            $query->where('accion', $request->accion);
        }
        if ($request->filled('fecha_desde')) {
            $query->whereDate('created_at', '>=', $request->fecha_desde);
        }
        if ($request->filled('fecha_hasta')) {
            $query->whereDate('created_at', '<=', $request->fecha_hasta);
        }

        $logs = $query->orderBy('created_at', 'desc')->paginate(100);

        return response()->json(['ok' => true, 'datos' => $logs]);
    }
}
