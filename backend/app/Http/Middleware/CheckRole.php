<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * Usage: middleware('check.role:admin') or middleware('check.role:admin,supervisor')
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['mensaje' => 'No autenticado.'], 401);
        }

        $rolUsuario = $user->rol_normalizado;

        if (!in_array($rolUsuario, $roles, true)) {
            return response()->json(['mensaje' => 'No tienes permisos para realizar esta acción.'], 403);
        }

        return $next($request);
    }
}
