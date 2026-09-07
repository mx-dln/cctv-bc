<?php

namespace App\Services;

use App\Models\Alert;
use App\Models\BlockchainTransaction;
use App\Models\Camera;
use App\Models\EvidenceRecord;
use App\Models\GeneratedLog;

class IntegrityScoreService
{

    public function getBlockchainMode(): array
    {
        $bc = app(BlockchainService::class);
        $simulate = $bc->isSimulateMode();
        $available = !$simulate && $bc->isAvailable();

        if ($available && !$simulate) {
            return ['mode' => 'fabric_connected', 'label' => 'Fabric Connected', 'color' => 'text-green-400'];
        }
        if (!$simulate) {
            return ['mode' => 'fabric_unavailable', 'label' => 'Fabric Unavailable', 'color' => 'text-yellow-400'];
        }
        return ['mode' => 'fabric_demo', 'label' => 'Hyperledger Fabric', 'color' => 'text-[#AD9334]', 'simulated' => true];
    }

}
