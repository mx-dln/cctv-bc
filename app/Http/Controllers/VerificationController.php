<?php

namespace App\Http\Controllers;

use App\Models\GeneratedLog;
use App\Services\ActivityLoggerService;
use App\Services\EvidenceCustodyService;
use App\Services\VerificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
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

    public function verify(GeneratedLog $log): JsonResponse|RedirectResponse
    {
        $result = $this->verificationService->verify($log);

        $this->custody->recordVerified($log, request()->user(), $result);

        $this->logger->log('verification_performed', 'verification', request()->user(),
            'Verification for event ' . $log->event_id . ': ' . $result['status'],
            ['event_id' => $log->event_id, 'status' => $result['status']]
        );

        if (request()->expectsJson()) {
            return response()->json($result);
        }

        $message = $result['message'] ?? ('Verification result: ' . $result['status']);

        return back()->with('success', $message);
    }

    public function show(GeneratedLog $log): Response
    {
        $log->load(['camera', 'hashRecord', 'hashRecord.blockchainTransaction']);
        $this->custody->recordViewed($log, request()->user());

        return Inertia::render('verification/show', [
            'log' => $log,
        ]);
    }
}
