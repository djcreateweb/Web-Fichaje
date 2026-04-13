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
// ─────────────────────────────────────────────────────────────────────────────
Route::prefix('programador')
    ->middleware('web')
    ->withoutMiddleware(['resolve.tenant', 'impersonation.readonly'])
    ->group(function () {
        require __DIR__ . '/programador.php';
    });

// ─────────────────────────────────────────────────────────────────────────────
// Rutas públicas de autenticación (sin Sanctum)
// ─────────────────────────────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::middleware('throttle:login')->post('/login', [AutenticacionControlador::class, 'iniciarSesion']);
    Route::post('/primer-acceso', [AutenticacionControlador::class, 'primerAcceso']);
});

// Configurar admin (llamado desde el Panel Programador cuando impersona)
Route::post('/admin/configurar', [AutenticacionControlador::class, 'configurarAdministrador']);

// Estado inicial (usado por el frontend para boot sin sesión)
Route::get('/estado', [EmpresaControlador::class, 'estadoInicial']);

// Login directo con ID (selector de empleado)
Route::post('/empleados/login-directo', [EmpleadoControlador::class, 'loginDirecto']);

// ─────────────────────────────────────────────────────────────────────────────
// Rutas protegidas con Sanctum
// ─────────────────────────────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AutenticacionControlador::class, 'cerrarSesion']);
        Route::get('/me', [AutenticacionControlador::class, 'sesionActual']);
        Route::post('/cambiar-password', [AutenticacionControlador::class, 'cambiarPassword']);
    });

    // Empresas
    Route::apiResource('empresas', EmpresaControlador::class);

    // Empleados
    Route::get('empleados', [EmpleadoControlador::class, 'index']);
    Route::post('empleados', [EmpleadoControlador::class, 'store']);
    Route::get('empleados/{empleado}', [EmpleadoControlador::class, 'show']);
    Route::put('empleados/{empleado}', [EmpleadoControlador::class, 'update']);
    Route::patch('empleados/{empleado}', [EmpleadoControlador::class, 'update']);
    Route::delete('empleados/{empleado}', [EmpleadoControlador::class, 'destroy']);
    Route::post('empleados/{empleado}/contrasena', [EmpleadoControlador::class, 'actualizarContrasena']);
    Route::delete('empleados/{empleado}/contrasena', [EmpleadoControlador::class, 'eliminarContrasena']);

    // Fichajes
    Route::get('fichajes/hoy', [FichajeControlador::class, 'hoy']);
    Route::get('fichajes/mapa', [FichajeControlador::class, 'mapa']);
    Route::get('fichajes/resumen', [FichajeControlador::class, 'resumen']);
    Route::get('fichajes/empleado/{empleado}', [FichajeControlador::class, 'porEmpleado']);
    Route::apiResource('fichajes', FichajeControlador::class);
    Route::post('fichajes/{empleado}/entrada', [FichajeControlador::class, 'ficharEntrada']);
    Route::post('fichajes/{empleado}/salida', [FichajeControlador::class, 'ficharSalida']);

    // Solicitudes
    Route::get('solicitudes/pendientes', [SolicitudControlador::class, 'pendientes']);
    Route::post('solicitudes/{solicitud}/aprobar', [SolicitudControlador::class, 'aprobar']);
    Route::post('solicitudes/{solicitud}/rechazar', [SolicitudControlador::class, 'rechazar']);
    Route::apiResource('solicitudes', SolicitudControlador::class);

    // Auditoría
    Route::get('auditoria', [AuditoriaControlador::class, 'index']);
});
