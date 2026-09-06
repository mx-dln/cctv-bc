<?php

namespace App\Http\Controllers;

use App\Models\GeneratedLog;
use App\Services\ActivityLoggerService;
use App\Services\AlertService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TamperController extends Controller
{
    private AlertService $alertService;
    private ActivityLoggerService $logger;

    public function __construct(AlertService $alertService, ActivityLoggerService $logger)
    {
        $this->alertService = $alertService;
        $this->logger = $logger;
    }

    public function tamper(GeneratedLog $log, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'started_at' => 'nullable|date',
            'ended_at' => 'nullable|date',
            'duration' => 'nullable|integer|min:1',
            'score' => 'nullable|numeric|min:0|max:1',
            'label' => 'nullable|string|max:100',
            'event_type' => 'nullable|string|max:100',
        ]);

        foreach ($validated as $field => $value) {
            if (!is_null($value)) {
                $log->$field = $value;
            }
        }

        $log->status = 'tampered';
        $log->save();

        $this->alertService->createTamperAlert($log);

        $this->logger->logTamperDetection($request->user(), [
            'event_id' => $log->event_id,
            'camera_id' => $log->camera_id,
            'changes' => $validated,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Event has been tampered. Verification will now fail.',
            'log' => $log->fresh()->load(['camera', 'hashRecord', 'hashRecord.blockchainTransaction']),
        ]);
    }
}
