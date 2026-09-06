<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('provider_connections', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('provider_type', 50);
            $table->string('base_url')->nullable();
            $table->string('host')->nullable();
            $table->integer('port')->nullable();
            $table->string('username')->nullable();
            $table->string('password')->nullable();
            $table->string('api_key')->nullable();
            $table->string('onvif_url')->nullable();
            $table->string('rtsp_url')->nullable();
            $table->boolean('https_enabled')->default(false);
            $table->integer('polling_interval')->default(60);
            $table->integer('connection_timeout')->default(15);
            $table->boolean('auto_sync')->default(true);
            $table->boolean('is_active')->default(false);
            $table->timestamp('last_connected_at')->nullable();
            $table->string('last_connection_status')->nullable();
            $table->json('provider_info')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('provider_connections');
    }
};
