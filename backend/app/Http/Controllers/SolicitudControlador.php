<?php

namespace App\Http\Controllers;

use App\Modelos\Auditoria;
use App\Modelos\Solicitud;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SolicitudControlador extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $empleado = $request->user();
        $esAdmin = in_array($empleado->rol, ['admin', 'administrador', 'supervisor', 'superior']);

        $query = Solicitud::query()->with([
            'empleado:id,nombre,apellidos,correo',
            'revisor:id,nombre,apellidos',
        ]);

        if (!$esAdmin) {
            // Un empleado solo ve sus propias solicitudes
            $query->where('empleado_id', $empleado->id);
        } else {
            // Admin/supervisor ve todas las de su empresa
            $query->where('empresa_id', $empleado->empresa_id);
        }

        if ($request->filled('estado')) {
            $query->where('estado', $request->estado);
        }
        if ($request->filled('tipo')) {
            $query->where('tipo', $request->tipo);
        }

        return response()->json(['ok' => true, 'datos' => $query->latest()->get()]);
    }

    public function pendientes(Request $request): JsonResponse
    {
        $empleado = $request->user();

        $solicitudes = Solicitud::query()
            ->with('empleado:id,nombre,apellidos,correo')
            ->where('empresa_id', $empleado->empresa_id)
            ->where('estado', 'pendiente')
            ->latest()
            ->get();

        return response()->json(['ok' => true, 'datos' => $solicitudes]);
    }

    public function store(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'tipo'        => 'required|in:vacaciones,ausencia,correccion_fichaje,otro',
            'fecha_inicio' => 'required|date',
            'fecha_fin'   => 'nullable|date|after_or_equal:fecha_inicio',
            'motivo'      => 'required|string|max:1000',
        ]);

        $empleado = $request->user();

        $solicitud = Solicitud::create([
            'tenant_id'   => $empleado->tenant_id,
            'empleado_id' => $empleado->id,
            'empresa_id'  => $empleado->empresa_id,
            'tipo'        => $datos['tipo'],
            'fecha_inicio' => $datos['fecha_inicio'],
            'fecha_fin'   => $datos['fecha_fin'] ?? null,
            'motivo'      => $datos['motivo'],
            'estado'      => 'pendiente',
        ]);

        Auditoria::registrar(
            accion: 'crear_solicitud',
            tenantId: $empleado->tenant_id,
            empleadoId: $empleado->id,
            empresaId: $empleado->empresa_id,
            entidadTipo: 'solicitud',
            entidadId: $solicitud->id,
            datosNuevos: ['tipo' => $datos['tipo'], 'motivo' => $datos['motivo']],
            ip: $request->ip(),
            userAgent: $request->userAgent(),
        );

        return response()->json(['ok' => true, 'id' => $solicitud->id, 'datos' => $solicitud], 201);
    }

    public function show(Solicitud $solicitud): JsonResponse
    {
        return response()->json([
            'ok'    => true,
            'datos' => $solicitud->load(['empleado:id,nombre,apellidos', 'revisor:id,nombre,apellidos']),
        ]);
    }

    public function update(Request $request, Solicitud $solicitud): JsonResponse
    {
        // Solo se puede editar si está pendiente
        if ($solicitud->estado !== 'pendiente') {
            return response()->json(['mensaje' => 'Solo se pueden editar solicitudes pendientes'], 422);
        }

        $datos = $request->validate([
            'tipo'        => 'sometimes|in:vacaciones,ausencia,correccion_fichaje,otro',
            'fecha_inicio' => 'sometimes|date',
            'fecha_fin'   => 'nullable|date',
            'motivo'      => 'sometimes|string|max:1000',
        ]);

        $solicitud->update($datos);

        return response()->json(['ok' => true]);
    }

    public function aprobar(Request $request, Solicitud $solicitud): JsonResponse
    {
        $datos = $request->validate([
            'comentario' => 'nullable|string|max:500',
        ]);

        $revisor = $request->user();

        $solicitud->update([
            'estado'              => 'aprobada',
            'revisado_por'        => $revisor->id,
            'fecha_revision'      => now(),
            'comentario_revision' => $datos['comentario'] ?? null,
        ]);

        Auditoria::registrar(
            accion: 'aprobar_solicitud',
            tenantId: $solicitud->tenant_id,
            empleadoId: $revisor->id,
            empresaId: $solicitud->empresa_id,
            entidadTipo: 'solicitud',
            entidadId: $solicitud->id,
            datosNuevos: ['estado' => 'aprobada', 'comentario' => $datos['comentario'] ?? null],
            ip: $request->ip(),
            userAgent: $request->userAgent(),
        );

        return response()->json(['ok' => true]);
    }

    public function rechazar(Request $request, Solicitud $solicitud): JsonResponse
    {
        $datos = $request->validate([
            'comentario' => 'required|string|max:500',
        ]);

        $revisor = $request->user();

        $solicitud->update([
            'estado'              => 'rechazada',
            'revisado_por'        => $revisor->id,
            'fecha_revision'      => now(),
            'comentario_revision' => $datos['comentario'],
        ]);

        Auditoria::registrar(
            accion: 'rechazar_solicitud',
            tenantId: $solicitud->tenant_id,
            empleadoId: $revisor->id,
            empresaId: $solicitud->empresa_id,
            entidadTipo: 'solicitud',
            entidadId: $solicitud->id,
            datosNuevos: ['estado' => 'rechazada', 'comentario' => $datos['comentario']],
            ip: $request->ip(),
            userAgent: $request->userAgent(),
        );

        return response()->json(['ok' => true]);
    }
}
