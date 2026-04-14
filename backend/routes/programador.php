<?php

use App\Http\Controllers\ProgramadorAuthControlador;
use App\Http\Controllers\ProgramadorTenantControlador;
use Illuminate\Support\Facades\Route;

Route::middleware('throttle:superadmin-login')->post("/login", [ProgramadorAuthControlador::class, "login"]);
Route::get("/login", function () {
    return response()->json([
        "ok" => false,
        "mensaje" => "Esta ruta requiere POST con email y password.",
        "ejemplo" => [
            "metodo" => "POST",
            "url" => "/api/programador/login",
            "body" => [
                "email" => "tu_correo@ejemplo.com",
                "password" => "tu_contraseña",
            ],
        ],
    ], 200);
});
Route::get("/impersonacion/{token}", [ProgramadorTenantControlador::class, "validarImpersonacion"]);

Route::middleware("auth:sanctum")->group(function () {
    Route::post("/logout", [ProgramadorAuthControlador::class, "logout"]);
    Route::get("/stats", [ProgramadorTenantControlador::class, "dashboard"]);
    Route::get("/dashboard", [ProgramadorTenantControlador::class, "dashboard"]);
    Route::get("/tenants", [ProgramadorTenantControlador::class, "index"]);
    Route::post("/tenants", [ProgramadorTenantControlador::class, "store"]);
    Route::put("/tenants/{tenant}", [ProgramadorTenantControlador::class, "update"]);
    Route::delete("/tenants/{tenant}", [ProgramadorTenantControlador::class, "destroy"]);
    Route::post("/tenants/{tenant}/impersonate", [ProgramadorTenantControlador::class, "impersonar"]);
    Route::post("/tenants/{tenant}/impersonar", [ProgramadorTenantControlador::class, "impersonar"]);
});
