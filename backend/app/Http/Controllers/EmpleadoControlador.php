<?php

namespace App\Http\Controllers;

use App\Modelos\Auditoria;
use App\Modelos\Empleado;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class EmpleadoControlador extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $empleados = Empleado::query()
            ->when($request->empresa_id, fn($q, $v) => $q->where('empresa_id', $v))
            ->get()
            ->map(fn($e) => $this->serializar($e));

        return response()->json(['ok' => true, 'datos' => $empleados]);
    }

    public function store(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'empresa_id' => 'required|integer|exists:empresas,id',
            'nombre'     => 'required|string|min:2|max:150',
            'apellidos'  => 'nullable|string|max:150',
            'correo'     => 'required|email|max:190',
            'rol'        => 'required|in:admin,administrador,supervisor,superior,empleado',
            'departamento' => 'nullable|string|max:100',
            'puesto'     => 'nullable|string|max:100',
            'telefono'   => 'nullable|string|max:30',
        ]);

        $empleado = Empleado::create([
            'tenant_id'            => app()->bound('tenant') ? app('tenant')->id : null,
            'empresa_id'           => $datos['empresa_id'],
            'nombre'               => $datos['nombre'],
            'apellidos'            => $datos['apellidos'] ?? null,
            'correo'               => strtolower($datos['correo']),
            'contrasena'           => Hash::make('Temporal1234!'),
            'rol'                  => $datos['rol'],
            'departamento'         => $datos['departamento'] ?? null,
            'puesto'               => $datos['puesto'] ?? null,
            'telefono'             => $datos['telefono'] ?? null,
            'activo'               => true,
            'debe_cambiar_password' => true,
        ]);

        Auditoria::registrar(
            accion: 'crear_empleado',
            tenantId: $empleado->tenant_id,
            empleadoId: $request->user()?->id,
            empresaId: $empleado->empresa_id,
            entidadTipo: 'empleado',
            entidadId: $empleado->id,
            datosNuevos: ['nombre' => $empleado->nombre, 'correo' => $empleado->correo, 'rol' => $empleado->rol],
            ip: $request->ip(),
            userAgent: $request->userAgent(),
        );

        return response()->json(['ok' => true, 'id' => $empleado->id, 'datos' => $this->serializar($empleado)], 201);
    }

    public function show(Empleado $empleado): JsonResponse
    {
        return response()->json(['ok' => true, 'datos' => $this->serializar($empleado)]);
    }

    public function update(Request $request, Empleado $empleado): JsonResponse
    {
        $datos = $request->validate([
            'empresa_id'  => 'sometimes|integer|exists:empresas,id',
            'nombre'      => 'sometimes|string|min:2|max:150',
            'apellidos'   => 'nullable|string|max:150',
            'correo'      => 'sometimes|email|max:190',
            'rol'         => 'sometimes|in:admin,administrador,supervisor,superior,empleado',
            'departamento' => 'nullable|string|max:100',
            'puesto'      => 'nullable|string|max:100',
            'telefono'    => 'nullable|string|max:30',
            'activo'      => 'sometimes|boolean',
        ]);

        $anterior = $empleado->only(['nombre', 'correo', 'rol', 'activo']);

        if (isset($datos['correo'])) {
            $datos['correo'] = strtolower($datos['correo']);
        }

        $empleado->update($datos);

        Auditoria::registrar(
            accion: 'actualizar_empleado',
            tenantId: $empleado->tenant_id,
            empleadoId: $request->user()?->id,
            empresaId: $empleado->empresa_id,
            entidadTipo: 'empleado',
            entidadId: $empleado->id,
            datosAnteriores: $anterior,
            datosNuevos: $empleado->only(['nombre', 'correo', 'rol', 'activo']),
            ip: $request->ip(),
            userAgent: $request->userAgent(),
        );

        return response()->json(['ok' => true, 'datos' => $this->serializar($empleado->fresh())]);
    }

    public function destroy(Request $request, Empleado $empleado): JsonResponse
    {
        $empleado->update(['activo' => false]);

        Auditoria::registrar(
            accion: 'desactivar_empleado',
            tenantId: $empleado->tenant_id,
            empleadoId: $request->user()?->id,
            empresaId: $empleado->empresa_id,
            entidadTipo: 'empleado',
            entidadId: $empleado->id,
            ip: $request->ip(),
            userAgent: $request->userAgent(),
        );

        return response()->json(['ok' => true]);
    }

    public function actualizarContrasena(Request $request, Empleado $empleado): JsonResponse
    {
        $datos = $request->validate([
            'contrasena' => 'required|string|min:8',
        ]);

        $empleado->update([
            'contrasena'           => Hash::make($datos['contrasena']),
            'debe_cambiar_password' => false,
        ]);

        return response()->json(['ok' => true]);
    }

    public function eliminarContrasena(Empleado $empleado): JsonResponse
    {
        $empleado->update([
            'contrasena'           => Hash::make('Temporal1234!'),
            'debe_cambiar_password' => true,
        ]);

        return response()->json(['ok' => true]);
    }

    /**
     * POST /api/empleados/login-directo
     * Login con ID + contraseña (flujo de selector de empleado en la app).
     */
    public function loginDirecto(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'empleadoId' => 'required|integer',
            'contrasena' => 'required|string',
        ]);

        $empleado = Empleado::find($datos['empleadoId']);
        if (!$empleado || !Hash::check($datos['contrasena'], $empleado->contrasena)) {
            return response()->json(['mensaje' => 'Credenciales incorrectas'], 422);
        }

        $empleado->update(['ultimo_acceso' => now()]);
        $empleado->tokens()->delete();
        $token = $empleado->createToken('acceso', ['*'], now()->addHours(8))->plainTextToken;

        return response()->json([
            'ok'    => true,
            'token' => $token,
            'datos' => $this->serializar($empleado),
        ]);
    }

    private function serializar(Empleado $e): array
    {
        return [
            'id'                    => $e->id,
            'empresa_id'            => $e->empresa_id,
            'nombre'                => $e->nombre,
            'apellidos'             => $e->apellidos,
            'correo'                => $e->correo,
            'rol'                   => $e->rol_normalizado,
            'departamento'          => $e->departamento,
            'puesto'                => $e->puesto,
            'telefono'              => $e->telefono,
            'activo'                => $e->activo,
            'debe_cambiar_password' => $e->debe_cambiar_password,
            'ultimo_acceso'         => $e->ultimo_acceso?->toIso8601String(),
        ];
    }
}
