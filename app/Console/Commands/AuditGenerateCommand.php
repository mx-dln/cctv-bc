<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\AuditService;
use Illuminate\Console\Command;

class AuditGenerateCommand extends Command
{
    protected $signature = 'audit:generate {--format=pdf : pdf or excel}';
    protected $description = 'Generate a daily audit report';

    public function handle(AuditService $auditService): int
    {
        $format = $this->option('format');
        $user = User::first();

        if (!$user) {
            $this->error('No user found to associate the report.');
            return Command::FAILURE;
        }

        $this->info("Generating daily audit report ({$format})...");

        $report = $auditService->generateReport(
            user: $user,
            title: 'Daily Audit Report - ' . now()->format('Y-m-d'),
            type: 'verification',
            filters: ['date_from' => now()->startOfDay()->toIso8601String()],
            format: $format
        );

        $this->info("Report generated: {$report->report_id}");
        $this->info("Total events: {$report->total_logs}");
        $this->info("Verified: {$report->verified_count}");
        $this->info("Tampered: {$report->tampered_count}");
        $this->info("File: {$report->file_path}");

        return Command::SUCCESS;
    }
}
