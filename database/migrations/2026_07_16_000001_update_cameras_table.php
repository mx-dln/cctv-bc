<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('generated_logs');
        Schema::dropIfExists('hash_records');
        Schema::dropIfExists('blockchain_transactions');
        Schema::dropIfExists('cameras');

        Schema::create('cameras', function (Blueprint $table) {
            $table->id();
            $table->string('provider', 50);
            $table->string('provider_camera_id');
            $table->string('name');
            $table->string('location')->nullable();
            $table->enum('status', ['online', 'offline', 'disconnected'])->default('offline');
            $table->string('resolution')->nullable();
            $table->integer('fps')->nullable();
            $table->timestamp('last_seen')->nullable();
            $table->timestamps();
            $table->unique(['provider', 'provider_camera_id']);
        });

        Schema::create('generated_logs', function (Blueprint $table) {
            $table->id();
            $table->string('event_id')->unique();
            $table->foreignId('camera_id')->constrained()->cascadeOnDelete();
            $table->string('event_type', 100);
            $table->string('label', 100)->nullable();
            $table->string('sub_label', 100)->nullable();
            $table->string('object_type', 100)->nullable();
            $table->timestamp('started_at');
            $table->timestamp('ended_at')->nullable();
            $table->integer('duration')->nullable();
            $table->float('score')->default(0);
            $table->float('top_score')->default(0);
            $table->boolean('false_positive')->default(false);
            $table->text('snapshot_url')->nullable();
            $table->text('recording_url')->nullable();
            $table->json('zones')->nullable();
            $table->text('thumbnail')->nullable();
            $table->string('record_id')->nullable()->unique();
            $table->string('filename')->nullable();
            $table->string('resolution')->nullable();
            $table->text('recording_info')->nullable();
            $table->json('metadata')->nullable();
            $table->enum('status', ['pending', 'registered', 'verified', 'tampered', 'missing'])->default('pending');
            $table->foreignId('registered_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('registered_at')->nullable();
            $table->timestamps();
        });

        Schema::create('hash_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('log_id')->constrained('generated_logs')->cascadeOnDelete();
            $table->string('algorithm', 20)->default('sha256');
            $table->string('hash_value', 64);
            $table->string('previous_hash', 64)->nullable();
            $table->integer('hash_chain_index')->default(0);
            $table->json('hashed_payload')->nullable();
            $table->integer('hash_duration_ms')->nullable();
            $table->timestamps();
        });

        Schema::create('blockchain_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('log_id')->constrained('generated_logs')->cascadeOnDelete();
            $table->string('transaction_id')->unique();
            $table->string('block_number')->nullable();
            $table->string('channel', 100)->default('cctv-channel');
            $table->string('chaincode', 100)->default('cctv-chaincode');
            $table->string('status', 20)->default('pending');
            $table->json('response')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('committed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blockchain_transactions');
        Schema::dropIfExists('hash_records');
        Schema::dropIfExists('generated_logs');
        Schema::dropIfExists('cameras');
    }
};
