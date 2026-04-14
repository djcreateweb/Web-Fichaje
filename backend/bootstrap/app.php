<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Http\Middleware\CheckRole;
use App\Http\Middleware\ImpersonationReadOnly;
use App\Http\Middleware\ResolveTenant;
use App\Http\Middleware\SecurityHeaders;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            "resolve.tenant" => ResolveTenant::class,
            "impersonation.readonly" => ImpersonationReadOnly::class,
            "check.role" => CheckRole::class,
        ]);

        $middleware->appendToGroup("web", [
            ResolveTenant::class,
            ImpersonationReadOnly::class,
        ]);

        $middleware->appendToGroup("api", [
            ResolveTenant::class,
            ImpersonationReadOnly::class,
            SecurityHeaders::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
