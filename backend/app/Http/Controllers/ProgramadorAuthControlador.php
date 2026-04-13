<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProgramadorAuthControlador extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $payload = $request->all();
        if (empty($payload)) {
            $decoded = json_decode($request->getContent() ?: "", true);
            if (is_array($decoded)) {
                $payload = $decoded;
            }
        }

        $datos = validator($payload, [
            "email" => "required|string",
            "password" => "required|string|min:8",
        ])->validate();

        if (!Auth::guard("superadmin")->attempt($datos)) {
            return response()->json(["mensaje" => "Credenciales de Programador incorrectas"], 422);
        }

        $superadmin = Auth::guard("superadmin")->user();
        $token = $superadmin->createToken("programador-panel")->plainTextToken;

        return response()->json([
            "ok" => true,
            "datos" => [
                "token" => $token,
                "usuario" => [
                    "email" => $superadmin->email,
                ],
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json(["ok" => true]);
    }
}
