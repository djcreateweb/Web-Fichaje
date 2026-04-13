<?php

namespace App\Http\Controllers;

use App\Modelos\Empleado;
use App\Modelos\Fichaje;
use App\Modelos\Tenant;
use App\Models\ProgramadorImpersonation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProgramadorTenantControlador extends Controller
{
    public function dashboard(): JsonResponse
    {
        $activos = Tenant::query()->where("activo", true)->count();
        $fichajesHoy = Fichaje::withoutGlobalScopes()->whereDate("fecha_hora", now()->toDateString())->count();
        $empleadosTotal = Empleado::withoutGlobalScopes()->count();

        return response()->json([
            "ok" => true,
            "datos" => [
                "tenants_activos" => $activos,
                "fichajes_hoy" => $fichajesHoy,
                "empleados_total" => $empleadosTotal,
            ],
        ]);
    }

    public function index(): JsonResponse
    {
        $tenants = Tenant::query()->latest()->get()->map(function (Tenant $tenant) {
            $empresa = DB::table("empresas")
                ->where("tenant_id", $tenant->id)
                ->select("correo_administrador")
                ->first();

            $empleadosCount = Empleado::withoutGlobalScopes()->where("tenant_id", $tenant->id)->count();
            $ultimoFichaje = Fichaje::withoutGlobalScopes()
                ->where("tenant_id", $tenant->id)
                ->max("fecha_hora");

            return [
                "id" => $tenant->id,
                "nombre" => $tenant->nombre,
                "slug" => $tenant->slug,
                "plan" => $tenant->plan,
                "activo" => $tenant->activo,
                "created_at" => $tenant->created_at,
                "admin_email" => $empresa?->correo_administrador,
                "empleados_count" => $empleadosCount,
                "ultimo_fichaje" => $ultimoFichaje,
            ];
        });

        return response()->json(["ok" => true, "datos" => $tenants]);
    }

    public function store(Request $request): JsonResponse
    {
        $payload = $request->all();
        if (empty($payload)) {
            $decoded = json_decode($request->getContent() ?: "", true);
            if (is_array($decoded)) {
                $payload = $decoded;
            }
        }

        $datos = validator($payload, [
            "nombre" => "required|string|min:2",
            "slug" => "nullable|string|min:2|max:120",
            "plan" => "required|in:basico,pro,enterprise",
            "admin_email" => "required|email",
        ])->validate();

        $slug = $datos["slug"] ?: Tenant::generarSlug($datos["nombre"]);

        $tenant = null;

        DB::transaction(function () use ($datos, $slug, &$tenant) {
            $tenant = Tenant::query()->create([
                "nombre" => $datos["nombre"],
                "slug" => $slug,
                "plan" => $datos["plan"],
                "activo" => true,
            ]);

            DB::table("empresas")->insertGetId([
                "tenant_id" => $tenant->id,
                "nombre" => $tenant->nombre,
                "correo_administrador" => $datos["admin_email"],
                "created_at" => now(),
                "updated_at" => now(),
            ]);
        });

        return response()->json(["ok" => true, "id" => $tenant?->id], 201);
    }

    public function update(Request $request, Tenant $tenant): JsonResponse
    {
        $payload = $request->all();
        if (empty($payload)) {
            $decoded = json_decode($request->getContent() ?: "", true);
            if (is_array($decoded)) {
                $payload = $decoded;
            }
        }

        $datos = validator($payload, [
            "nombre" => "required|string|min:2",
            "plan" => "required|in:basico,pro,enterprise",
            "activo" => "required|boolean",
        ])->validate();

        $tenant->update($datos);

        return response()->json(["ok" => true]);
    }

    public function destroy(Tenant $tenant): JsonResponse
    {
        DB::transaction(function () use ($tenant) {
            DB::table("fichajes")->where("tenant_id", $tenant->id)->delete();
            DB::table("ausencias")->where("tenant_id", $tenant->id)->delete();
            DB::table("empleados")->where("tenant_id", $tenant->id)->delete();
            DB::table("empresas")->where("tenant_id", $tenant->id)->delete();
            $tenant->delete();
        });

        return response()->json(["ok" => true]);
    }

    public function impersonar(Tenant $tenant): JsonResponse
    {
        $admin = Empleado::withoutGlobalScopes()
            ->where("tenant_id", $tenant->id)
            ->where("rol", "administrador")
            ->first();

        $token = Str::random(64);

        ProgramadorImpersonation::query()->create([
            "tenant_id" => $tenant->id,
            "empleado_id" => $admin?->id,
            "token" => $token,
            "solo_lectura" => true,
            "expira_en" => now()->addMinutes(20),
        ]);

        return response()->json([
            "ok" => true,
            "datos" => [
                "token" => $token,
                "expira_en" => now()->addMinutes(20)->toIso8601String(),
                "tenant_slug" => $tenant->slug,
                "modo" => "solo_lectura",
            ],
        ]);
    }

    public function validarImpersonacion(string $token): JsonResponse
    {
        $impersonation = ProgramadorImpersonation::query()
            ->where("token", $token)
            ->where("expira_en", ">", now())
            ->first();

        if (!$impersonation) {
            return response()->json(["mensaje" => "Token inválido o expirado"], 404);
        }

        $tenant = Tenant::query()->findOrFail($impersonation->tenant_id);

        return response()->json([
            "ok" => true,
            "datos" => [
                "tenant_id" => $tenant->id,
                "tenant_slug" => $tenant->slug,
                "tenant_nombre" => $tenant->nombre,
                "solo_lectura" => true,
                "expira_en" => $impersonation->expira_en?->toIso8601String(),
            ],
        ]);
    }
}
