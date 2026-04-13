<?php

namespace App\Http\Controllers;

use App\Modelos\Empleado;
use App\Modelos\Empresa;
use App\Modelos\Fichaje;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class EmpresaControlador extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['ok' => true, 'datos' => Empresa::all()]);
    }

    public function store(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'nombre'                  => 'required|string|min:2|max:150',
            'correo_administrador'    => 'nullable|email|max:190',
            'telefono'                => 'nullable|string|max:30',
            'direccion'               => 'nullable|string|max:255',
            'requiere_geolocalizacion' => 'nullable|boolean',
            'radio_permitido_metros'  => 'nullable|integer|min:0',
            'latitud_oficina'         => 'nullable|numeric|between:-90,90',
            'longitud_oficina'        => 'nullable|numeric|between:-180,180',
        ]);

        $slug = $this->generarSlugUnico($datos['nombre']);

        $empresa = Empresa::create([
            'tenant_id'               => app()->bound('tenant') ? app('tenant')->id : null,
            'nombre'                  => $datos['nombre'],
            'slug'                    => $slug,
            'correo_administrador'    => $datos['correo_administrador'] ?? '',
            'telefono'                => $datos['telefono'] ?? null,
            'direccion'               => $datos['direccion'] ?? null,
            'requiere_geolocalizacion' => $datos['requiere_geolocalizacion'] ?? false,
            'radio_permitido_metros'  => $datos['radio_permitido_metros'] ?? null,
            'latitud_oficina'         => $datos['latitud_oficina'] ?? null,
            'longitud_oficina'        => $datos['longitud_oficina'] ?? null,
            'activa'                  => true,
        ]);

        return response()->json(['ok' => true, 'id' => $empresa->id, 'datos' => $empresa], 201);
    }

    public function show(Empresa $empresa): JsonResponse
    {
        return response()->json(['ok' => true, 'datos' => $empresa]);
    }

    public function update(Request $request, Empresa $empresa): JsonResponse
    {
        $datos = $request->validate([
            'nombre'                  => 'sometimes|string|min:2|max:150',
            'correo_administrador'    => 'nullable|email|max:190',
            'telefono'                => 'nullable|string|max:30',
            'direccion'               => 'nullable|string|max:255',
            'requiere_geolocalizacion' => 'nullable|boolean',
            'radio_permitido_metros'  => 'nullable|integer|min:0',
            'latitud_oficina'         => 'nullable|numeric|between:-90,90',
            'longitud_oficina'        => 'nullable|numeric|between:-180,180',
            'activa'                  => 'sometimes|boolean',
        ]);

        $empresa->update($datos);

        return response()->json(['ok' => true, 'datos' => $empresa->fresh()]);
    }

    public function destroy(Empresa $empresa): JsonResponse
    {
        $empresa->update(['activa' => false]);
        return response()->json(['ok' => true]);
    }

    /**
     * GET /api/estado
     * Estado inicial de la app: admin + empresas + empleados.
     * Mantiene compatibilidad con el frontend actual.
     */
    public function estadoInicial(): JsonResponse
    {
        $administrador = Empleado::query()
            ->whereIn('rol', ['admin', 'administrador'])
            ->first();

        return response()->json([
            'ok'    => true,
            'datos' => [
                'admin'     => $administrador ? ['username' => $administrador->correo] : null,
                'empresas'  => Empresa::all(),
                'empleados' => Empleado::all()->map(fn($e) => [
                    'id'         => $e->id,
                    'empresa_id' => $e->empresa_id,
                    'nombre'     => $e->nombre,
                    'apellidos'  => $e->apellidos,
                    'correo'     => $e->correo,
                    'rol'        => $e->rol_normalizado,
                    'activo'     => $e->activo,
                ]),
                'fichajes'  => Fichaje::query()->latest('fecha_hora')->limit(100)->get(),
            ],
        ]);
    }

    private function generarSlugUnico(string $nombre): string
    {
        $base = Str::slug(Str::ascii($nombre));
        $slug = $base;
        $i = 1;
        while (Empresa::withoutGlobalScopes()->where('slug', $slug)->exists()) {
            $slug = $base . '-' . $i++;
        }
        return $slug;
    }
}
