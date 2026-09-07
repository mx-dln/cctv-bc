<?php

namespace App\Services;

use App\Models\GeneratedLog;

class VerificationService
{
    private HashService $hashService;
    private BlockchainService $blockchainService;
    private AlertService $alertService;
    private CctvRecordService $recordService;

    public function __construct()
    {
        $this->hashService = app(HashService::class);
        $this->blockchainService = app(BlockchainService::class);
        $this->alertService = app(AlertService::class);
        $this->recordService = app(CctvRecordService::class);
    }

    public function verify(GeneratedLog $log): array
    {
        if ($log->recording_url && str_contains($log->recording_url, '://')) {
            $log->update(['status' => 'pending']);
            return ['verified' => false, 'status' => 'unavailable',
                'message' => 'Remote footage must be imported before its contents can be verified.', 'verified_at' => now()];
        }
        if (!$this->recordService->footageAvailable($log)) {
            $log->update(['status' => 'missing']);
            $this->alertService->createMissingFootageAlert($log);

            return [
                'verified' => false,
                'status' => 'missing',
                'message' => 'CCTV footage is missing. Deletion is recorded separately from modification.',
                'verified_at' => now(),
            ];
        }

        $localResult = $this->hashService->verifyHash($log);

        if (($localResult['status'] ?? null) === 'no_hash') {
            $log->update(['status' => 'pending']);
            $this->alertService->createMissingHashAlert($log);
            return ['verified' => false, 'status' => 'no_hash', 'local_verification' => $localResult, 'verified_at' => now()];
        }

        $blockchainResult = $this->blockchainService->verifyHash(
            $log->event_id,
            $localResult['current_hash'] ?? ''
        );

        $isVerified = $localResult['verified'] && $blockchainResult['verified'];

        if (($blockchainResult['available'] ?? true) === false) {
            $log->update(['status' => 'pending']);
            return ['verified' => false, 'status' => 'unavailable', 'local_verification' => $localResult,
                'blockchain_verification' => $blockchainResult, 'verified_at' => now()];
        }

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
