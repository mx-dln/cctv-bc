<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('blockchain_transactions', function (Blueprint $table) {
            $table->id();
            $table->morphs('blockchainable', 'blockchainable_idx');
            $table->string('transaction_id')->unique();
            $table->string('channel_name')->default('cctv-channel');
            $table->string('chaincode_name')->default('cctv-chaincode');
            $table->string('function_name');
            $table->json('arguments')->nullable();
            $table->string('status')->default('pending');
            $table->string('block_number')->nullable();
            $table->string('node')->default('peer0.org1.example.com');
            $table->json('response')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('committed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blockchain_transactions');
    }
};
