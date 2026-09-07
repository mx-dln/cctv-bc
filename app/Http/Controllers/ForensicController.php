<?php

namespace App\Http\Controllers;

use App\Models\GeneratedLog;
use App\Services\BlockchainService;
use App\Services\HashService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ForensicController extends Controller
{
    private HashService $hashService;
    private BlockchainService $blockchainService;

    public function __construct(HashService $hashService, BlockchainService $blockchainService)
    {
        $this->hashService = $hashService;
        $this->blockchainService = $blockchainService;
    }

    public function index(): Response
    {
        return Inertia::render('forensic/index');
    }

    public function analyze(Request $request): JsonResponse
    {
        $log = GeneratedLog::with(['camera', 'hashRecord.blockchainTransaction'])
            ->where('event_id', $request->input('log_id'))
            ->first();

        if (!$log) {
            return response()->json(['error' => 'Event not found'], 404);
        }

        $log->load(['camera', 'hashRecord.blockchainTransaction']);

        app(\App\Services\EvidenceCustodyService::class)->recordInvestigated($log, $request->user(), 'Forensic analysis performed');

        $verification = app(\App\Services\VerificationService::class)->verify($log);
        $hashVerification = $verification['local_verification'] ?? ['status' => $verification['status'], 'verified' => false];
        $blockchainResult = $verification['blockchain_verification'] ?? ['verified' => false, 'available' => false];
        $tamperDetails = $verification['tamper_details'] ?? [];
        app(\App\Services\EvidenceCustodyService::class)->recordVerified($log, $request->user(), $verification);

        return response()->json([
            'log' => $log,
            'status' => $verification['status'],
            'hash_verification' => $hashVerification,
            'blockchain_verification' => $blockchainResult,
            'tamper_details' => $tamperDetails,
            'timeline' => $this->buildTimeline($log),
        ]);
    }

    private function buildTimeline(GeneratedLog $log): array
    {
        $events = [];

        $events[] = [
            'type' => 'log_created',
            'label' => 'Event Created',
            'timestamp' => $log->created_at->toIso8601String(),
            'description' => 'CCTV event recorded',
        ];

        if ($log->hashRecord) {
            $hash = $log->hashRecord;
            $events[] = [
                'type' => 'hash_generated',
                'label' => 'SHA-256 Hash Generated',
                'timestamp' => $hash->created_at->toIso8601String(),
                'description' => 'Hash: ' . substr($hash->hash_value, 0, 16) . '...',
            ];

            if ($hash->blockchainTransaction) {
                $tx = $hash->blockchainTransaction;
                $events[] = [
                    'type' => 'blockchain_commit',
                    'label' => 'Blockchain Commit',
                    'timestamp' => $tx->committed_at?->toIso8601String() ?? $tx->created_at->toIso8601String(),
                    'description' => 'TX: ' . $tx->transaction_id . ' [' . $tx->status . ']',
                ];
            }
        }

        $events[] = [
            'type' => 'verification',
            'label' => 'Verification Status',
            'timestamp' => $log->updated_at->toIso8601String(),
            'description' => 'Status: ' . strtoupper($log->status),
        ];

        usort($events, fn($a, $b) => strtotime($a['timestamp']) - strtotime($b['timestamp']));

        return $events;
    }
}
