<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create("tenants", function (Blueprint $table) {
            $table->id();
            $table->string("nombre", 150);
            $table->string("slug", 120)->unique();
            $table->enum("plan", ["basico", "pro", "enterprise"])->default("basico");
            $table->boolean("activo")->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists("tenants");
    }
};
