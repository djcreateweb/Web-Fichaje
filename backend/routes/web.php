<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get("/programador", function () {
    return response()->json([
        "ok" => true,
        "mensaje" => "Panel Programador activo. Usa /api/programador/* para operar.",
    ]);
});
