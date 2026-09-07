<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('generated_logs', function (Blueprint $table) {
            if (!Schema::hasColumn('generated_logs', 'record_id')) {
                $table->string('record_id')->nullable()->unique()->after('id');
            }
            if (!Schema::hasColumn('generated_logs', 'filename')) {
                $table->string('filename')->nullable()->after('duration');
            }
            if (!Schema::hasColumn('generated_logs', 'resolution')) {
                $table->string('resolution')->nullable()->after('filename');
            }
            if (!Schema::hasColumn('generated_logs', 'recording_info')) {
                $table->text('recording_info')->nullable()->after('recording_url');
            }
            if (!Schema::hasColumn('generated_logs', 'metadata')) {
                $table->json('metadata')->nullable()->after('zones');
            }
            if (!Schema::hasColumn('generated_logs', 'registered_by')) {
                $table->foreignId('registered_by')->nullable()->after('status')->constrained('users')->nullOnDelete();
            }
            if (!Schema::hasColumn('generated_logs', 'registered_at')) {
                $table->timestamp('registered_at')->nullable()->after('registered_by');
            }
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE generated_logs MODIFY status ENUM('pending', 'registered', 'verified', 'tampered', 'missing') NOT NULL DEFAULT 'pending'");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE generated_logs MODIFY status ENUM('pending', 'verified', 'tampered') NOT NULL DEFAULT 'pending'");
        }

        Schema::table('generated_logs', function (Blueprint $table) {
            if (Schema::hasColumn('generated_logs', 'registered_by')) {
                $table->dropConstrainedForeignId('registered_by');
            }
            $table->dropColumn([
                'record_id',
                'filename',
                'resolution',
                'recording_info',
                'metadata',
                'registered_at',
            ]);
        });
    }
};
