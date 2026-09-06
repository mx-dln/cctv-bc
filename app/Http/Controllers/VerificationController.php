<?php

namespace App\Http\Controllers;

use App\Models\GeneratedLog;
use App\Services\ActivityLoggerService;
use App\Services\EvidenceCustodyService;
use App\Services\VerificationService;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class VerificationController extends Controller
{
    private VerificationService $verificationService;
    private ActivityLoggerService $logger;
    private EvidenceCustodyService $custody;

    public function __construct(
        VerificationService $verificationService,
        ActivityLoggerService $logger,
        EvidenceCustodyService $custody
    ) {
        $this->verificationService = $verificationService;
        $this->logger = $logger;
        $this->custody = $custody;
    }

    public function index(): Response
    {
        $logs = GeneratedLog::with(['camera', 'hashRecord', 'hashRecord.blockchainTransaction'])
            ->latest()
            ->paginate(20);

        return Inertia::render('verification/index', [
            'logs' => $logs,
        ]);
    }

    public function verify(GeneratedLog $log): JsonResponse
    {
        $result = $this->verificationService->verify($log);

        $this->custody->recordVerified($log, request()->user(), $result);

        $this->logger->log('verification_performed', 'verification', request()->user(),
            'Verification for event ' . $log->event_id . ': ' . $result['status'],
            ['event_id' => $log->event_id, 'status' => $result['status']]
        );

        return response()->json($result);
    }

    public function show(GeneratedLog $log): Response
    {
        $log->load(['camera', 'hashRecord', 'hashRecord.blockchainTransaction']);

        return Inertia::render('verification/show', [
            'log' => $log,
        ]);
    }
}
