<?php

namespace App\Console\Commands;

use App\Models\GeneratedLog;
use App\Services\VerificationService;
use Illuminate\Console\Command;

class BlockchainVerifyCommand extends Command
{
    protected $signature = 'blockchain:verify {--event= : Verify a specific event by ID} {--all : Verify all pending events}';
    protected $description = 'Verify event integrity against blockchain';

    public function handle(VerificationService $verificationService): int
    {
        $eventId = $this->option('event');
        $all = $this->option('all');

        if ($eventId) {
            $log = GeneratedLog::where('event_id', $eventId)->first();
            if (!$log) {
                $this->error("Event '{$eventId}' not found.");
                return Command::FAILURE;
            }
            $result = $verificationService->verify($log);
            $this->displayResult($log, $result);
            return Command::SUCCESS;
        }

        if ($all) {
            $logs = GeneratedLog::whereIn('status', ['pending', 'verified'])->get();
            $this->info("Verifying {$logs->count()} events...");

            $bar = $this->output->createProgressBar($logs->count());
            $bar->start();

            foreach ($logs as $log) {
                $verificationService->verify($log);
                $bar->advance();
            }

            $bar->finish();
            $this->newLine(2);
            $this->info('Verification completed.');
            return Command::SUCCESS;
        }

        $this->error('Specify --event=ID or --all');
        return Command::FAILURE;
    }

    private function displayResult(GeneratedLog $log, array $result): void
    {
        $this->table(
            ['Field', 'Value'],
            [
                ['Event ID', $log->event_id],
                ['Camera', $log->camera->name ?? 'N/A'],
                ['Status', strtoupper($result['status'])],
                ['Local Verification', $result['local_verification']['status'] ?? 'N/A'],
                ['Blockchain Verified', $result['blockchain_verification']['verified'] ? 'YES' : 'NO'],
                ['Verified At', $result['verified_at']->toIso8601String()],
            ]
        );

        if (!empty($result['tamper_details']['differences'])) {
            $this->warn('Tampered fields detected:');
            foreach ($result['tamper_details']['differences'] as $field => $diff) {
                $this->warn("  {$field}: '{$diff['original']}' -> '{$diff['current']}'");
            }
        }
    }
}
