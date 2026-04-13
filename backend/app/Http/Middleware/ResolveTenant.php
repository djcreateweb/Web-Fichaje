<?php

namespace App\Http\Middleware;

use App\Modelos\Tenant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveTenant
{
    public function handle(Request $request, Closure $next): Response
    {
        $slug = $this->resolverSlug($request);

        if ($slug === "programador") {
            return $next($request);
        }

        $tenant = Tenant::query()->where("slug", $slug)->first();
        if (!$tenant) {
            abort(404, "Tenant no encontrado.");
        }

        if (!$tenant->activo) {
            abort(403, "Acceso suspendido. Contacte con Presentia.");
        }

        app()->instance("tenant", $tenant);

        return $next($request);
    }

    private function resolverSlug(Request $request): string
    {
        if (app()->environment("local")) {
            $tenantSlug = trim((string) env("TENANT_SLUG", ""));
            if ($tenantSlug !== "") {
                // En producción esta rama no se ejecuta: solo sirve para desarrollo local sin subdominios reales.
                return strtolower($tenantSlug);
            }

            if ($request->is("programador") || $request->is("programador/*")) {
                return "programador";
            }

            $host = strtolower($request->getHost());
            if (in_array($host, ["localhost", "127.0.0.1"], true)) {
                return "demo";
            }
        }

        $host = $request->getHost();
        $partes = explode(".", $host);
        return strtolower($partes[0] ?? "");
    }
}
