<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_reports', function (Blueprint $table) {
            $table->id();
            $table->string('report_id')->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('type')->default('verification');
            $table->json('filters')->nullable();
            $table->json('summary')->nullable();
            $table->integer('total_logs')->default(0);
            $table->integer('verified_count')->default(0);
            $table->integer('tampered_count')->default(0);
            $table->string('status')->default('generated');
            $table->string('format')->default('pdf');
            $table->string('file_path')->nullable();
            $table->timestamp('generated_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_reports');
    }
};
