<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('generated_logs', function (Blueprint $table) {
            $table->id();
            $table->string('log_id')->unique();
            $table->foreignId('camera_id')->constrained()->cascadeOnDelete();
            $table->timestamp('recorded_at');
            $table->string('event_type');
            $table->integer('duration_seconds')->nullable();
            $table->string('filename')->nullable();
            $table->string('resolution')->nullable();
            $table->integer('frame_rate')->nullable();
            $table->bigInteger('file_size_bytes')->nullable();
            $table->string('checksum')->nullable();
            $table->string('operator')->nullable();
            $table->enum('status', ['pending', 'verified', 'tampered'])->default('pending');
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('generated_logs');
    }
};
