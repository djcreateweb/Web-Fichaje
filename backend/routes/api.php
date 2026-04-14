<?php

use App\Http\Controllers\AuditoriaControlador;
use App\Http\Controllers\AutenticacionControlador;
use App\Http\Controllers\EmpleadoControlador;
use App\Http\Controllers\EmpresaControlador;
use App\Http\Controllers\FichajeControlador;
use App\Http\Controllers\SolicitudControlador;
use Illuminate\Support\Facades\Route;

// ─────────────────────────────────────────────────────────────────────────────
// Panel Programador (superadmin) — sin middleware de tenant ni impersonación
// Usa middleware 'api' (no 'web') para no necesitar CSRF con Bearer tokens
// ─────────────────────────────────────────────────────────────────────────────
Route::prefix('programador')
    ->withoutMiddleware(['resolve.tenant', 'impersonation.readonly'])
    ->group(function () {
        require __DIR__ . '/programador.php';
    });

// ─────────────────────────────────────────────────────────────────────────────
// Rutas públicas de autenticación (sin Sanctum)
// ─────────────────────────────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::middleware('throttle:login')->post('/login', [AutenticacionControlador::class, 'iniciarSesion']);
    Route::middleware('throttle:login')->post('/primer-acceso', [AutenticacionControlador::class, 'primerAcceso']);
});

// Configurar admin (llamado desde el Panel Programador cuando impersona)
Route::middleware('throttle:login')->post('/admin/configurar', [AutenticacionControlador::class, 'configurarAdministrador']);

// Estado inicial (usado por el frontend para boot sin sesión)
Route::get('/estado', [EmpresaControlador::class, 'estadoInicial']);

// Login directo con ID (selector de empleado)
Route::middleware('throttle:login')->post('/empleados/login-directo', [EmpleadoControlador::class, 'loginDirecto']);

// ─────────────────────────────────────────────────────────────────────────────
// Rutas protegidas con Sanctum — cualquier empleado autenticado
// ─────────────────────────────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AutenticacionControlador::class, 'cerrarSesion']);
        Route::get('/me', [AutenticacionControlador::class, 'sesionActual']);
        Route::post('/cambiar-password', [AutenticacionControlador::class, 'cambiarPassword']);
    });

    // Fichajes — cualquier empleado puede ver/fichar
    Route::get('fichajes/hoy', [FichajeControlador::class, 'hoy']);
    Route::get('fichajes/empleado/{empleado}', [FichajeControlador::class, 'porEmpleado']);
    Route::post('fichajes/{empleado}/entrada', [FichajeControlador::class, 'ficharEntrada']);
    Route::post('fichajes/{empleado}/salida', [FichajeControlador::class, 'ficharSalida']);
    Route::get('fichajes/{fichaje}', [FichajeControlador::class, 'show']);

    // Solicitudes — cualquier empleado puede crear y ver las suyas
    Route::post('solicitudes', [SolicitudControlador::class, 'store']);
    Route::get('solicitudes/{solicitud}', [SolicitudControlador::class, 'show']);
    Route::put('solicitudes/{solicitud}', [SolicitudControlador::class, 'update']);
    Route::delete('solicitudes/{solicitud}', [SolicitudControlador::class, 'destroy']);
});

// ─────────────────────────────────────────────────────────────────────────────
// Rutas protegidas con Sanctum — supervisor y admin
// ─────────────────────────────────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'check.role:admin,supervisor'])->group(function () {

    // Fichajes — vistas de gestión
    Route::get('fichajes/mapa', [FichajeControlador::class, 'mapa']);
    Route::get('fichajes/resumen', [FichajeControlador::class, 'resumen']);
    Route::get('fichajes', [FichajeControlador::class, 'index']);
    Route::post('fichajes', [FichajeControlador::class, 'store']);
    Route::put('fichajes/{fichaje}', [FichajeControlador::class, 'update']);
    Route::delete('fichajes/{fichaje}', [FichajeControlador::class, 'destroy']);

    // Solicitudes — gestión
    Route::get('solicitudes/pendientes', [SolicitudControlador::class, 'pendientes']);
    Route::get('solicitudes', [SolicitudControlador::class, 'index']);
    Route::post('solicitudes/{solicitud}/aprobar', [SolicitudControlador::class, 'aprobar']);
    Route::post('solicitudes/{solicitud}/rechazar', [SolicitudControlador::class, 'rechazar']);

    // Empleados — lectura
    Route::get('empleados', [EmpleadoControlador::class, 'index']);
    Route::get('empleados/{empleado}', [EmpleadoControlador::class, 'show']);
});

// ─────────────────────────────────────────────────────────────────────────────
// Rutas protegidas con Sanctum — solo admin
// ─────────────────────────────────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'check.role:admin'])->group(function () {

    // Empresas
    Route::apiResource('empresas', EmpresaControlador::class);

    // Empleados — escritura
    Route::post('empleados', [EmpleadoControlador::class, 'store']);
    Route::put('empleados/{empleado}', [EmpleadoControlador::class, 'update']);
    Route::patch('empleados/{empleado}', [EmpleadoControlador::class, 'update']);
    Route::delete('empleados/{empleado}', [EmpleadoControlador::class, 'destroy']);
    Route::post('empleados/{empleado}/contrasena', [EmpleadoControlador::class, 'actualizarContrasena']);
    Route::delete('empleados/{empleado}/contrasena', [EmpleadoControlador::class, 'eliminarContrasena']);

    // Auditoría
    Route::get('auditoria', [AuditoriaControlador::class, 'index']);
});
