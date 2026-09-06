<?php

namespace App\Services;

use App\Models\GeneratedLog;

class VerificationService
{
    private HashService $hashService;
    private BlockchainService $blockchainService;
    private AlertService $alertService;

    public function __construct()
    {
        $this->hashService = app(HashService::class);
        $this->blockchainService = app(BlockchainService::class);
        $this->alertService = app(AlertService::class);
    }

    public function verify(GeneratedLog $log): array
    {
        $localResult = $this->hashService->verifyHash($log);

        $blockchainResult = $this->blockchainService->verifyHash(
            $log->event_id,
            $localResult['current_hash'] ?? ''
        );

        $isVerified = $localResult['verified'] && $blockchainResult['verified'];

        $log->update(['status' => $isVerified ? 'verified' : 'tampered']);

        if (!$isVerified) {
            $this->alertService->createTamperAlert($log);
        }

        $tamperDetails = $isVerified ? [] : $this->hashService->extractTamperDetails($log);

        return [
            'verified' => $isVerified,
            'status' => $isVerified ? 'verified' : 'tampered',
            'local_verification' => $localResult,
            'blockchain_verification' => $blockchainResult,
            'tamper_details' => $tamperDetails,
            'verified_at' => now(),
        ];
    }
}
