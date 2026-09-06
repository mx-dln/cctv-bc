<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hash_records', function (Blueprint $table) {
            $table->id();
            $table->morphs('hashable');
            $table->string('algorithm')->default('sha256');
            $table->string('hash_value', 64);
            $table->string('previous_hash', 64)->nullable();
            $table->json('original_metadata')->nullable();
            $table->timestamp('hashed_at');
            $table->integer('hash_duration_ms')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hash_records');
    }
};
