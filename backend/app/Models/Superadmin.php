<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class Superadmin extends Authenticatable
{
    use HasApiTokens;

    protected $table = "superadmins";

    protected $fillable = [
        "email",
        "password",
    ];

    protected $hidden = [
        "password",
        "remember_token",
    ];
}
