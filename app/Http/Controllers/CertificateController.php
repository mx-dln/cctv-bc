<?php

namespace App\Http\Controllers;

use App\Models\GeneratedLog;
use App\Services\HashService;
use App\Services\BlockchainService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CertificateController extends Controller
{
    private HashService $hashService;
    private BlockchainService $blockchainService;

    public function __construct(HashService $hashService, BlockchainService $blockchainService)
    {
        $this->hashService = $hashService;
        $this->blockchainService = $blockchainService;
    }

    public function generate(GeneratedLog $log, Request $request): JsonResponse
    {
        $log->load(['camera', 'hashRecord.blockchainTransaction']);

        $hashVerification = $this->hashService->verifyHash($log);
        $blockchainResult = $this->blockchainService->verifyHash(
            $log->event_id, $hashVerification['current_hash'] ?? ''
        );

        $certificate = [
            'certificate_id' => 'CERT-' . strtoupper(\Illuminate\Support\Str::random(12)),
            'generated_at' => now()->toIso8601String(),
            'generated_by' => $request->user()?->name ?? 'System',
            'event' => [
                'event_id' => $log->event_id,
                'camera' => $log->camera->name ?? 'N/A',
                'timestamp' => $log->started_at?->toIso8601String(),
                'event_type' => $log->event_type,
                'label' => $log->label,
                'duration' => $log->duration,
            ],
            'hash' => [
                'algorithm' => 'SHA-256',
                'original_hash' => $hashVerification['original_hash'] ?? '',
                'current_hash' => $hashVerification['current_hash'] ?? '',
                'chain_index' => $hashVerification['chain_index'] ?? 0,
                'previous_hash' => $hashVerification['previous_hash'] ?? '',
            ],
            'blockchain' => [
                'status' => $blockchainResult['verified'] ? 'VERIFIED' : 'TAMPERED',
                'blockchain_hash' => $blockchainResult['blockchain_hash'] ?? 'N/A',
                'transaction_id' => $blockchainResult['transaction_id'] ?? 'N/A',
                'block_number' => $blockchainResult['block_number'] ?? 'N/A',
            ],
            'verification' => [
                'result' => $hashVerification['status'] ?? 'unknown',
                'verified_at' => now()->toIso8601String(),
            ],
            'digital_signature' => [
                'signed_by' => $request->user()?->name ?? 'System',
                'signed_at' => now()->toIso8601String(),
                'signature_hash' => hash('sha256', json_encode([
                    $log->event_id, $hashVerification['current_hash'] ?? '',
                    now()->toIso8601String(), $request->user()?->id ?? 0,
                ])),
            ],
        ];

        return response()->json([
            'success' => true,
            'certificate' => $certificate,
        ]);
    }
}
