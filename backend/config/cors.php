<?php

return [
    "paths" => ["api/*", "sanctum/csrf-cookie"],
    "allowed_methods" => ["*"],
    "allowed_origins" => [env("FRONTEND_URL", "http://127.0.0.1:5173")],
    // En local permitimos localhost/127.0.0.1 en cualquier puerto para evitar bloqueos CORS durante desarrollo.
    "allowed_origins_patterns" => env('APP_ENV') === 'local'
        ? ["/^http:\\/\\/(localhost|127\\.0\\.0\\.1):\\d+$/"]
        : [],
    "allowed_headers" => ["*"],
    "exposed_headers" => [],
    "max_age" => 0,
    "supports_credentials" => true,
];
