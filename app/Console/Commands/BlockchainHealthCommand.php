<?php

namespace App\Console\Commands;

use App\Models\Alert;
use App\Services\AlertService;
use App\Services\BlockchainService;
use Illuminate\Console\Command;

class BlockchainHealthCommand extends Command
{
    protected $signature = 'blockchain:health';
    protected $description = 'Check blockchain network health';

    public function handle(BlockchainService $blockchainService, AlertService $alertService): int
    {
        $this->info('Checking blockchain network health...');

        $status = $blockchainService->getLedgerStatus();

        if ($status['available']) {
            $this->info('Blockchain network is operational.');
            $this->info("Block height: {$status['block_height']}");
            $this->info("Channel: {$status['channel']}");

            Alert::where('type', 'blockchain_unavailable')
                ->whereNull('resolved_at')
                ->update(['resolved_at' => now()]);

            return Command::SUCCESS;
        }

        $this->error('Blockchain network is unavailable!');
        $alertService->createBlockchainUnavailableAlert();

        return Command::FAILURE;
    }
}
