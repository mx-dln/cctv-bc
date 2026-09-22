<?php

namespace App\Services;

use App\Models\GeneratedLog;
use Illuminate\Http\UploadedFile;

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
            $log->record_id,
            $localResult['current_hash'] ?? '',
            $log->event_id,
        );

        $this->blockchainService->recordVerification(
            $log,
            $localResult['current_hash'] ?? '',
            $blockchainResult,
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

    public function verifyUploadedFootage(GeneratedLog $log, UploadedFile $footage): array
    {
        $localResult = $this->hashService->verifyUploadedFootage($log, $footage->getRealPath());

        if (($localResult['status'] ?? null) === 'no_hash') {
            $log->update(['status' => 'pending']);
            $this->alertService->createMissingHashAlert($log);

            return [
                'verified' => false,
                'status' => 'no_hash',
                'mode' => 'uploaded_comparison',
                'message' => 'No original hash record found for this evidence.',
                'local_verification' => $localResult,
                'verified_at' => now(),
            ];
        }

        $blockchainResult = $this->blockchainService->verifyHash(
            $log->record_id,
            $localResult['current_hash'] ?? '',
            $log->event_id,
        );

        $this->blockchainService->recordVerification(
            $log,
            $localResult['current_hash'] ?? '',
            $blockchainResult,
            'uploaded_comparison',
        );

        if (($blockchainResult['available'] ?? true) === false) {
            return [
                'verified' => false,
                'status' => 'unavailable',
                'mode' => 'uploaded_comparison',
                'message' => 'Blockchain is unavailable. The uploaded file was compared locally only.',
                'local_verification' => $localResult,
                'blockchain_verification' => $blockchainResult,
                'verified_at' => now(),
            ];
        }

        $isVerified = $localResult['verified'] && $blockchainResult['verified'];
        $log->update(['status' => $isVerified ? 'verified' : 'tampered']);

        if (!$isVerified) {
            $this->alertService->createTamperAlert($log);
        }

        return [
            'verified' => $isVerified,
            'status' => $isVerified ? 'verified' : 'tampered',
            'mode' => 'uploaded_comparison',
            'message' => $isVerified
                ? 'Uploaded file matches the original evidence hash.'
                : 'Uploaded file does not match the original evidence hash.',
            'local_verification' => $localResult,
            'blockchain_verification' => $blockchainResult,
            'tamper_details' => [
                'differences' => [
                    'footage_sha256' => [
                        'original' => $localResult['original_footage_sha256'] ?? null,
                        'current' => $localResult['current_footage_sha256'] ?? null,
                    ],
                ],
                'original_hash' => $localResult['original_hash'] ?? null,
                'current_hash' => $localResult['current_hash'] ?? null,
            ],
            'verified_at' => now(),
        ];
    }
}
