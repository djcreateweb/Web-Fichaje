<?php

namespace App\Http\Middleware;

use App\Models\ProgramadorImpersonation;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ImpersonationReadOnly
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = (string) $request->header("X-Impersonation-Token", "");
        if ($token === "") {
            return $next($request);
        }

        $impersonation = ProgramadorImpersonation::query()
            ->where("token", $token)
            ->where("expira_en", ">", now())
            ->first();

        if (!$impersonation) {
            abort(401, "Token de impersonación inválido o expirado.");
        }

        if ($request->isMethodSafe()) {
            return $next($request);
        }

        abort(403, "Modo solo lectura activo por impersonación.");
    }
}
