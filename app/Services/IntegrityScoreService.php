<?php

namespace App\Services;

use App\Models\Alert;
use App\Models\BlockchainTransaction;
use App\Models\Camera;
use App\Models\EvidenceRecord;
use App\Models\GeneratedLog;

class IntegrityScoreService
{
    public function getIntegrityScore(): array
    {
        $total = GeneratedLog::count();
        $verified = GeneratedLog::where('status', 'verified')->count();
        $score = $total > 0 ? round(($verified / $total) * 100, 2) : 100;

        return [
            'score' => $score,
            'total' => $total,
            'verified' => $verified,
            'tampered' => GeneratedLog::where('status', 'tampered')->count(),
            'level' => $this->colorCode($score),
            'label' => $this->label($score),
        ];
    }

    public function getForensicHealthScore(): array
    {
        $integrity = $this->getIntegrityScore();
        $integrityWeight = 0.35;
        $blockchainWeight = 0.20;
        $camerasWeight = 0.15;
        $tamperWeight = 0.15;
        $alertsWeight = 0.15;

        $totalCameras = max(Camera::count(), 1);
        $onlineCameras = Camera::where('status', 'online')->count();
        $cameraScore = ($onlineCameras / $totalCameras) * 100;

        $totalTx = max(BlockchainTransaction::count(), 1);
        $committedTx = BlockchainTransaction::where('status', 'committed')->count();
        $blockchainScore = ($committedTx / $totalTx) * 100;

        $tampered = GeneratedLog::where('status', 'tampered')->count();
        $tamperPenalty = min($tampered * 5, 50);
        $tamperScore = max(100 - $tamperPenalty, 0);

        $activeAlerts = Alert::where('is_read', false)->count();
        $alertPenalty = min($activeAlerts * 10, 50);
        $alertScore = max(100 - $alertPenalty, 0);

        $healthScore = round(
            ($integrity['score'] * $integrityWeight) +
            ($blockchainScore * $blockchainWeight) +
            ($cameraScore * $camerasWeight) +
            ($tamperScore * $tamperWeight) +
            ($alertScore * $alertsWeight),
            2
        );

        return [
            'score' => $healthScore,
            'level' => $this->colorCode($healthScore),
            'label' => $this->label($healthScore),
            'factors' => [
                'integrity_score' => ['score' => $integrity['score'], 'weight' => $integrityWeight],
                'blockchain_health' => ['score' => $blockchainScore, 'weight' => $blockchainWeight],
                'camera_health' => ['score' => $cameraScore, 'weight' => $camerasWeight],
                'tamper_status' => ['score' => $tamperScore, 'weight' => $tamperWeight],
                'alert_status' => ['score' => $alertScore, 'weight' => $alertsWeight],
            ],
        ];
    }

    public function getBlockchainMode(): array
    {
        $bc = app(BlockchainService::class);
        $simulate = $bc->isSimulateMode();
        $available = $bc->isAvailable();

        if ($available && !$simulate) {
            return ['mode' => 'fabric_connected', 'label' => 'Fabric Connected', 'color' => 'text-green-400'];
        }
        if (!$simulate) {
            return ['mode' => 'fabric_ready', 'label' => 'Fabric Ready', 'color' => 'text-yellow-400'];
        }
        return ['mode' => 'simulation', 'label' => 'Simulation', 'color' => 'text-[#AD9334]'];
    }

    private function colorCode(float $score): string
    {
        return match (true) {
            $score >= 95 => 'text-green-400',
            $score >= 85 => 'text-[#AD9334]',
            $score >= 70 => 'text-yellow-400',
            default => 'text-red-400',
        };
    }

    private function label(float $score): string
    {
        return match (true) {
            $score >= 95 => 'Excellent',
            $score >= 85 => 'Good',
            $score >= 70 => 'Warning',
            default => 'Critical',
        };
    }
}
