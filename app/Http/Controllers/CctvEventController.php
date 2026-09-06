<?php

namespace App\Http\Controllers;

use App\Models\GeneratedLog;
use App\Services\Cctv\CctvProviderManager;
use App\Services\EvidenceCustodyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CctvEventController extends Controller
{
    private CctvProviderManager $cctvManager;

    public function __construct(CctvProviderManager $cctvManager)
    {
        $this->cctvManager = $cctvManager;
    }

    public function index(Request $request): Response|JsonResponse
    {
        $logs = GeneratedLog::with(['camera', 'hashRecord', 'hashRecord.blockchainTransaction'])
            ->latest()
            ->paginate(min((int) $request->integer('limit', 20), 100));

        if ($request->wantsJson() || $request->expectsJson()) {
            return response()->json(['logs' => $logs]);
        }

        $provider = $this->cctvManager->provider();
        $providerConnected = ($provider->verifyConnection())['connected'] ?? false;

        return Inertia::render('events/index', [
            'logs' => $logs,
            'providerConnected' => $providerConnected,
            'providerName' => $provider->getProviderName(),
        ]);
    }

    public function show(GeneratedLog $log): Response
    {
        $log->load(['camera', 'hashRecord', 'hashRecord.blockchainTransaction']);

        app(EvidenceCustodyService::class)->recordViewed($log, request()->user());

        return Inertia::render('events/show', [
            'log' => $log,
        ]);
    }
}
