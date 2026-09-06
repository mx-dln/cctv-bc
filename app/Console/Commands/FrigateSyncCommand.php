<?php

namespace App\Console\Commands;

use App\Models\Camera;
use App\Models\GeneratedLog;
use App\Models\ProviderConnection;
use App\Services\Cctv\CctvProviderFactory;
use App\Services\HashService;
use App\Services\BlockchainService;
use App\Services\AlertService;
use Illuminate\Console\Command;

class FrigateSyncCommand extends Command
{
    protected $signature = 'cctv:sync {--provider=}';
    protected $description = 'Sync CCTV events from the active provider';

    public function handle(CctvProviderFactory $factory): int
    {
        $connection = null;
        if ($providerOption = $this->option('provider')) {
            $connection = ProviderConnection::find($providerOption);
        }

        $provider = $factory->create($connection);
        $providerName = $provider->getProviderName();

        $this->info("Syncing events from {$providerName}...");

        $health = $provider->verifyConnection();

        if (!($health['connected'] ?? false)) {
            $this->error("Cannot connect to {$providerName}. Check connection settings.");
            app(AlertService::class)->createBlockchainUnavailableAlert();
            return Command::FAILURE;
        }

        $this->info("Connected to {$providerName}.");

        $rawEvents = $provider->getEvents(['limit' => 50, 'after' => now()->subDay()->timestamp]);

        if ($rawEvents->isEmpty()) {
            $this->info('No new events found.');
            return Command::SUCCESS;
        }

        $this->info("Found {$rawEvents->count()} events.");
        $bar = $this->output->createProgressBar($rawEvents->count());
        $bar->start();

        $hashService = app(HashService::class);
        $blockchainService = app(BlockchainService::class);
        $alertService = app(AlertService::class);

        foreach ($rawEvents as $raw) {
            $event = $provider->normalizeEvent($raw);
            if (!$event['event_id']) continue;

            if (GeneratedLog::where('event_id', $event['event_id'])->exists()) {
                $bar->advance();
                continue;
            }

            $camera = Camera::firstOrCreate(
                ['provider' => $event['provider'], 'provider_camera_id' => $event['camera_id']],
                ['name' => $event['camera_name'], 'status' => 'online']
            );

            $log = GeneratedLog::create([
                'event_id' => $event['event_id'],
                'camera_id' => $camera->id,
                'event_type' => $event['event_type'],
                'label' => $event['label'],
                'sub_label' => $event['sub_label'],
                'object_type' => $event['label'],
                'started_at' => $event['start_time'] ? now()->createFromTimestamp($event['start_time']) : null,
                'ended_at' => $event['end_time'] ? now()->createFromTimestamp($event['end_time']) : null,
                'duration' => $event['duration'],
                'score' => $event['score'],
                'top_score' => $event['top_score'],
                'false_positive' => $event['false_positive'] ?? false,
                'snapshot_url' => $event['snapshot_url'],
                'recording_url' => $event['recording_url'],
                'zones' => $event['zones'],
                'thumbnail' => $event['thumbnail'],
                'status' => 'pending',
            ]);

            $hashRecord = $hashService->generateHash($log);
            $blockchainTx = $blockchainService->commitHash($log, $hashRecord->hash_value);

            if ($blockchainTx->status === 'committed') {
                $log->update(['status' => 'verified']);
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);
        $this->info('Sync completed successfully.');

        return Command::SUCCESS;
    }
}
