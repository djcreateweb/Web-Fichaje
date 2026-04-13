<?php

namespace App\Http\Controllers;

use App\Modelos\Auditoria;
use App\Modelos\Empleado;
use App\Modelos\Empresa;
use App\Modelos\Fichaje;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class FichajeControlador extends Controller
{
    /**
     * GET /api/fichajes
     * Lista fichajes con filtros opcionales.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Fichaje::query()->with('empleado:id,nombre,apellidos,correo');

        if ($request->filled('empleado_id')) {
            $query->where('empleado_id', $request->empleado_id);
        }
        if ($request->filled('empresa_id')) {
            $query->where('empresa_id', $request->empresa_id);
        }
        if ($request->filled('tipo')) {
            $query->where('tipo', $request->tipo);
        }
        if ($request->filled('fecha_desde')) {
            $query->whereDate('fecha_hora', '>=', $request->fecha_desde);
        }
        if ($request->filled('fecha_hasta')) {
            $query->whereDate('fecha_hora', '<=', $request->fecha_hasta);
        }

        $fichajes = $query->orderBy('fecha_hora', 'desc')->get();

        return response()->json(['ok' => true, 'datos' => $fichajes]);
    }

    /**
     * GET /api/fichajes/hoy
     * Fichajes del día actual del empleado autenticado.
     */
    public function hoy(Request $request): JsonResponse
    {
        $empleado = $request->user();

        $fichajes = Fichaje::query()
            ->where('empleado_id', $empleado->id)
            ->whereDate('fecha_hora', today())
            ->orderBy('fecha_hora')
            ->get();

        return response()->json(['ok' => true, 'datos' => $fichajes]);
    }

    /**
     * GET /api/fichajes/empleado/{empleado}
     */
    public function porEmpleado(Request $request, Empleado $empleado): JsonResponse
    {
        $query = Fichaje::query()->where('empleado_id', $empleado->id);

        if ($request->filled('fecha_desde')) {
            $query->whereDate('fecha_hora', '>=', $request->fecha_desde);
        }
        if ($request->filled('fecha_hasta')) {
            $query->whereDate('fecha_hora', '<=', $request->fecha_hasta);
        }

        return response()->json(['ok' => true, 'datos' => $query->orderBy('fecha_hora')->get()]);
    }

    /**
     * POST /api/fichajes
     * Registrar un fichaje (entrada, salida, pausa_inicio, pausa_fin).
     */
    public function store(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'tipo'       => 'required|in:entrada,salida,pausa_inicio,pausa_fin',
            'fecha_hora' => 'nullable|date',
            'latitud'    => 'nullable|numeric|between:-90,90',
            'longitud'   => 'nullable|numeric|between:-180,180',
            'notas'      => 'nullable|string|max:500',
        ]);

        $empleado = $request->user();

        // Calcular si está dentro del rango si la empresa lo requiere
        $dentroDeRango = null;
        $empresa = Empresa::find($empleado->empresa_id);
        if ($empresa?->requiere_geolocalizacion && isset($datos['latitud'], $datos['longitud'])) {
            if ($empresa->latitud_oficina && $empresa->longitud_oficina) {
                $distancia = $this->calcularDistancia(
                    $datos['latitud'], $datos['longitud'],
                    $empresa->latitud_oficina, $empresa->longitud_oficina
                );
                $dentroDeRango = $distancia <= ($empresa->radio_permitido_metros ?? 100);
            }
        }

        $fichaje = Fichaje::create([
            'tenant_id'          => $empleado->tenant_id,
            'empresa_id'         => $empleado->empresa_id,
            'empleado_id'        => $empleado->id,
            'tipo'               => $datos['tipo'],
            'fecha_hora'         => $datos['fecha_hora'] ?? now(),
            'latitud'            => $datos['latitud'] ?? null,
            'longitud'           => $datos['longitud'] ?? null,
            'dentro_de_rango'    => $dentroDeRango,
            'ip_address'         => $request->ip(),
            'user_agent'         => substr($request->userAgent() ?? '', 0, 255),
            'notas'              => $datos['notas'] ?? null,
        ]);

        Auditoria::registrar(
            accion: 'fichaje_' . $datos['tipo'],
            tenantId: $empleado->tenant_id,
            empleadoId: $empleado->id,
            empresaId: $empleado->empresa_id,
            entidadTipo: 'fichaje',
            entidadId: $fichaje->id,
            datosNuevos: ['tipo' => $datos['tipo'], 'fecha_hora' => $fichaje->fecha_hora->toIso8601String()],
            ip: $request->ip(),
            userAgent: $request->userAgent(),
        );

        return response()->json(['ok' => true, 'id' => $fichaje->id, 'datos' => $fichaje], 201);
    }

    public function show(Fichaje $fichaje): JsonResponse
    {
        return response()->json(['ok' => true, 'datos' => $fichaje->load('empleado:id,nombre,apellidos')]);
    }

    public function update(Request $request, Fichaje $fichaje): JsonResponse
    {
        $datos = $request->validate([
            'fecha_hora' => 'required|date',
            'notas'      => 'nullable|string|max:500',
        ]);

        $anterior = $fichaje->only(['fecha_hora', 'notas']);
        $fichaje->update($datos);

        Auditoria::registrar(
            accion: 'correccion_fichaje',
            tenantId: $fichaje->tenant_id,
            empleadoId: $request->user()?->id,
            empresaId: $fichaje->empresa_id,
            entidadTipo: 'fichaje',
            entidadId: $fichaje->id,
            datosAnteriores: $anterior,
            datosNuevos: $fichaje->only(['fecha_hora', 'notas']),
            ip: $request->ip(),
            userAgent: $request->userAgent(),
        );

        return response()->json(['ok' => true]);
    }

    public function destroy(Request $request, Fichaje $fichaje): JsonResponse
    {
        Auditoria::registrar(
            accion: 'eliminar_fichaje',
            tenantId: $fichaje->tenant_id,
            empleadoId: $request->user()?->id,
            empresaId: $fichaje->empresa_id,
            entidadTipo: 'fichaje',
            entidadId: $fichaje->id,
            datosAnteriores: $fichaje->toArray(),
            ip: $request->ip(),
            userAgent: $request->userAgent(),
        );

        $fichaje->delete();
        return response()->json(['ok' => true]);
    }

    /**
     * GET /api/fichajes/mapa
     * Fichajes con coordenadas para el mapa del admin.
     */
    public function mapa(Request $request): JsonResponse
    {
        $fecha = $request->get('fecha', today()->toDateString());

        $fichajes = Fichaje::query()
            ->with('empleado:id,nombre,apellidos')
            ->whereNotNull('latitud')
            ->whereNotNull('longitud')
            ->whereDate('fecha_hora', $fecha)
            ->when($request->filled('empresa_id'), fn($q) => $q->where('empresa_id', $request->empresa_id))
            ->orderBy('fecha_hora')
            ->get()
            ->map(fn($f) => [
                'id'              => $f->id,
                'empleado_id'     => $f->empleado_id,
                'empleado_nombre' => $f->empleado?->nombre . ' ' . $f->empleado?->apellidos,
                'tipo'            => $f->tipo,
                'fecha_hora'      => $f->fecha_hora->toIso8601String(),
                'latitud'         => $f->latitud,
                'longitud'        => $f->longitud,
                'dentro_de_rango' => $f->dentro_de_rango,
            ]);

        return response()->json(['ok' => true, 'datos' => $fichajes]);
    }

    /**
     * GET /api/fichajes/resumen
     * Resumen de horas trabajadas por empleado en un período.
     */
    public function resumen(Request $request): JsonResponse
    {
        $request->validate([
            'fecha_desde' => 'required|date',
            'fecha_hasta' => 'required|date|after_or_equal:fecha_desde',
            'empresa_id'  => 'nullable|integer',
        ]);

        $fichajes = Fichaje::query()
            ->with('empleado:id,nombre,apellidos')
            ->whereDate('fecha_hora', '>=', $request->fecha_desde)
            ->whereDate('fecha_hora', '<=', $request->fecha_hasta)
            ->when($request->filled('empresa_id'), fn($q) => $q->where('empresa_id', $request->empresa_id))
            ->orderBy('empleado_id')
            ->orderBy('fecha_hora')
            ->get();

        // Calcular horas por empleado agrupando entrada/salida
        $resumen = $this->calcularResumenHoras($fichajes);

        return response()->json(['ok' => true, 'datos' => $resumen]);
    }

    // ─────────────────────────────────────────────────────────────────
    // Métodos legacy (compatibilidad Panel Programador / impersonación)
    // ─────────────────────────────────────────────────────────────────

    public function ficharEntrada(Empleado $empleado): JsonResponse
    {
        $fichaje = Fichaje::create([
            'tenant_id'  => $empleado->tenant_id,
            'empresa_id' => $empleado->empresa_id,
            'empleado_id' => $empleado->id,
            'tipo'       => 'entrada',
            'fecha_hora' => now(),
        ]);

        return response()->json(['ok' => true, 'id' => $fichaje->id], 201);
    }

    public function ficharSalida(Empleado $empleado): JsonResponse
    {
        $fichaje = Fichaje::create([
            'tenant_id'  => $empleado->tenant_id,
            'empresa_id' => $empleado->empresa_id,
            'empleado_id' => $empleado->id,
            'tipo'       => 'salida',
            'fecha_hora' => now(),
        ]);

        return response()->json(['ok' => true, 'id' => $fichaje->id], 201);
    }

    // ─────────────────────────────────────────────────────────────────
    // Helpers privados
    // ─────────────────────────────────────────────────────────────────

    private function calcularDistancia(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $r = 6371000; // radio tierra en metros
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat / 2) ** 2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon / 2) ** 2;
        return $r * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }

    private function calcularResumenHoras($fichajes): array
    {
        $porEmpleado = [];

        foreach ($fichajes as $f) {
            $eid = $f->empleado_id;
            if (!isset($porEmpleado[$eid])) {
                $porEmpleado[$eid] = [
                    'empleado_id'     => $eid,
                    'empleado_nombre' => ($f->empleado?->nombre ?? '') . ' ' . ($f->empleado?->apellidos ?? ''),
                    'horas_totales'   => 0,
                    'dias_trabajados' => [],
                    '_entradas'       => [],
                    '_intervalos'     => [],
                ];
            }

            if ($f->tipo === 'entrada') {
                $porEmpleado[$eid]['_entradas'][] = $f->fecha_hora;
            } elseif ($f->tipo === 'salida' && !empty($porEmpleado[$eid]['_entradas'])) {
                $entrada = array_shift($porEmpleado[$eid]['_entradas']);
                if ($f->fecha_hora->greaterThan($entrada)) {
                    $porEmpleado[$eid]['_intervalos'][] = [$entrada->copy(), $f->fecha_hora->copy()];
                }
            }
        }

        return array_values(array_map(function ($item) {
            $intervalosPorDia = [];

            foreach ($item['_intervalos'] as [$inicio, $fin]) {
                // Si el intervalo cruza de día, lo partimos para computar correctamente por día
                $cursor = $inicio->copy();
                while ($cursor->toDateString() !== $fin->toDateString()) {
                    $finDia = $cursor->copy()->endOfDay();
                    $dia = $cursor->toDateString();
                    $intervalosPorDia[$dia][] = [$cursor->copy(), $finDia->copy()];
                    $cursor = $finDia->copy()->addSecond();
                }

                $dia = $cursor->toDateString();
                $intervalosPorDia[$dia][] = [$cursor->copy(), $fin->copy()];
            }

            $minutosTotales = 0;
            $diasTrabajados = 0;

            foreach ($intervalosPorDia as $dia => $intervalos) {
                // Ordenar por inicio y fusionar solapes para evitar doble conteo
                usort($intervalos, fn($a, $b) => $a[0] <=> $b[0]);

                $fusionados = [];
                foreach ($intervalos as [$inicio, $fin]) {
                    if (empty($fusionados)) {
                        $fusionados[] = [$inicio, $fin];
                        continue;
                    }

                    [$uInicio, $uFin] = $fusionados[count($fusionados) - 1];
                    if ($inicio->lessThanOrEqualTo($uFin)) {
                        // Solapa: extender fin si procede
                        if ($fin->greaterThan($uFin)) {
                            $fusionados[count($fusionados) - 1][1] = $fin;
                        }
                        continue;
                    }

                    $fusionados[] = [$inicio, $fin];
                }

                $minutosDia = 0;
                foreach ($fusionados as [$inicio, $fin]) {
                    if ($fin->greaterThan($inicio)) {
                        $minutosDia += $fin->diffInMinutes($inicio);
                    }
                }

                if ($minutosDia > 0) {
                    $diasTrabajados++;
                    $minutosTotales += $minutosDia;
                }
            }

            unset($item['_entradas'], $item['_intervalos']);
            $item['dias_trabajados'] = $diasTrabajados;
            $item['horas_totales'] = round($minutosTotales / 60, 2);
            return $item;
        }, $porEmpleado));
    }
}
