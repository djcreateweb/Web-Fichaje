<?php

namespace App\Http\Controllers;

use App\Modelos\Auditoria;
use App\Modelos\Empleado;
use App\Modelos\Empresa;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AutenticacionControlador extends Controller
{
    /**
     * POST /api/auth/login
     * Autentica un empleado y devuelve un token Sanctum.
     */
    public function iniciarSesion(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'identificador' => 'required|string',
            'contrasena'    => 'required|string',
        ]);

        $empleado = Empleado::query()
            ->where(function ($q) use ($datos) {
                $q->where('correo', $datos['identificador'])
                  ->orWhere('nombre', $datos['identificador']);
            })
            ->where('activo', true)
            ->first();

        if (!$empleado || !Hash::check($datos['contrasena'], $empleado->contrasena)) {
            Auditoria::registrar(
                accion: 'login_fallido',
                tenantId: $empleado?->tenant_id,
                empleadoId: null,
                empresaId: $empleado?->empresa_id,
                datosNuevos: ['identificador' => $datos['identificador']],
                ip: $request->ip(),
                userAgent: $request->userAgent(),
            );
            return response()->json(['mensaje' => 'Credenciales incorrectas'], 422);
        }

        // Actualizar último acceso
        $empleado->update(['ultimo_acceso' => now()]);

        // Revocar tokens anteriores del mismo dispositivo (opcional: limpiar todos)
        $empleado->tokens()->delete();

        $token = $empleado->createToken('acceso', ['*'], now()->addHours(8))->plainTextToken;

        Auditoria::registrar(
            accion: 'login',
            tenantId: $empleado->tenant_id,
            empleadoId: $empleado->id,
            empresaId: $empleado->empresa_id,
            ip: $request->ip(),
            userAgent: $request->userAgent(),
        );

        return response()->json([
            'ok'    => true,
            'token' => $token,
            'datos' => [
                'id'                    => $empleado->id,
                'rol'                   => $empleado->rol_normalizado,
                'nombre'                => $empleado->nombre,
                'apellidos'             => $empleado->apellidos,
                'correo'                => $empleado->correo,
                'empresa_id'            => $empleado->empresa_id,
                'debe_cambiar_password' => $empleado->debe_cambiar_password,
            ],
        ]);
    }

    /**
     * POST /api/auth/logout  (requiere auth:sanctum)
     */
    public function cerrarSesion(Request $request): JsonResponse
    {
        $empleado = $request->user();

        Auditoria::registrar(
            accion: 'logout',
            tenantId: $empleado?->tenant_id,
            empleadoId: $empleado?->id,
            empresaId: $empleado?->empresa_id,
            ip: $request->ip(),
            userAgent: $request->userAgent(),
        );

        $request->user()?->currentAccessToken()?->delete();

        return response()->json(['ok' => true]);
    }

    /**
     * GET /api/auth/me  (requiere auth:sanctum)
     */
    public function sesionActual(Request $request): JsonResponse
    {
        $empleado = $request->user();

        return response()->json([
            'ok'    => true,
            'datos' => [
                'id'                    => $empleado->id,
                'rol'                   => $empleado->rol_normalizado,
                'nombre'                => $empleado->nombre,
                'apellidos'             => $empleado->apellidos,
                'correo'                => $empleado->correo,
                'empresa_id'            => $empleado->empresa_id,
                'departamento'          => $empleado->departamento,
                'puesto'                => $empleado->puesto,
                'debe_cambiar_password' => $empleado->debe_cambiar_password,
            ],
        ]);
    }

    /**
     * POST /api/auth/primer-acceso
     * Primer acceso: el empleado aún no tiene contraseña propia, la establece aquí.
     */
    public function primerAcceso(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'correo'     => 'required|email',
            'contrasena' => 'required|string|min:8|confirmed',
        ]);

        $empleado = Empleado::query()
            ->where('correo', $datos['correo'])
            ->where('activo', true)
            ->first();

        if (!$empleado) {
            return response()->json(['mensaje' => 'Usuario no encontrado'], 422);
        }

        $empleado->update([
            'contrasena'           => Hash::make($datos['contrasena']),
            'debe_cambiar_password' => false,
        ]);

        $empleado->tokens()->delete();
        $token = $empleado->createToken('acceso', ['*'], now()->addHours(8))->plainTextToken;

        Auditoria::registrar(
            accion: 'primer_acceso',
            tenantId: $empleado->tenant_id,
            empleadoId: $empleado->id,
            empresaId: $empleado->empresa_id,
            ip: $request->ip(),
            userAgent: $request->userAgent(),
        );

        return response()->json([
            'ok'    => true,
            'token' => $token,
            'datos' => [
                'id'                    => $empleado->id,
                'rol'                   => $empleado->rol_normalizado,
                'nombre'                => $empleado->nombre,
                'correo'                => $empleado->correo,
                'empresa_id'            => $empleado->empresa_id,
                'debe_cambiar_password' => false,
            ],
        ]);
    }

    /**
     * POST /api/auth/cambiar-password  (requiere auth:sanctum)
     */
    public function cambiarPassword(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'contrasena_actual' => 'required|string',
            'contrasena_nueva'  => 'required|string|min:8|confirmed',
        ]);

        $empleado = $request->user();

        if (!Hash::check($datos['contrasena_actual'], $empleado->contrasena)) {
            return response()->json(['mensaje' => 'La contraseña actual no es correcta'], 422);
        }

        $empleado->update([
            'contrasena'           => Hash::make($datos['contrasena_nueva']),
            'debe_cambiar_password' => false,
        ]);

        Auditoria::registrar(
            accion: 'cambio_password',
            tenantId: $empleado->tenant_id,
            empleadoId: $empleado->id,
            empresaId: $empleado->empresa_id,
            ip: $request->ip(),
            userAgent: $request->userAgent(),
        );

        return response()->json(['ok' => true]);
    }

    /**
     * POST /api/admin/configurar
     * Primer setup del administrador de una empresa (llamado desde el Panel).
     */
    public function configurarAdministrador(Request $request): JsonResponse
    {
        if (!app()->bound('tenant')) {
            return response()->json(['mensaje' => 'No se pudo resolver el tenant actual'], 422);
        }

        $tenant = app('tenant');

        $datos = $request->validate([
            'correo'    => 'required|email',
            'contrasena' => 'required|string|min:8',
        ]);

        $empresa = Empresa::query()->where('tenant_id', $tenant->id)->first();
        if (!$empresa) {
            return response()->json(['mensaje' => 'No existe empresa configurada para este tenant.'], 422);
        }

        if (strtolower((string) $empresa->correo_administrador) !== strtolower((string) $datos['correo'])) {
            return response()->json(['mensaje' => 'El correo no coincide con el admin inicial definido por Programador.'], 422);
        }

        Empleado::updateOrCreate(
            ['tenant_id' => $tenant->id, 'correo' => $datos['correo']],
            [
                'tenant_id'            => $tenant->id,
                'empresa_id'           => $empresa->id,
                'nombre'               => 'Administrador',
                'contrasena'           => Hash::make($datos['contrasena']),
                'rol'                  => 'admin',
                'activo'               => true,
                'debe_cambiar_password' => false,
            ]
        );

        return response()->json(['ok' => true], 201);
    }
}
