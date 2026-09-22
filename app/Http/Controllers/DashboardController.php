<?php

namespace App\Http\Controllers;

use App\Models\ProviderConnection;
use App\Services\Cctv\CctvProviderManager;
use App\Services\DashboardService;
use App\Services\IntegrityScoreService;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    private DashboardService $dashboardService;
    private CctvProviderManager $cctvManager;
    private IntegrityScoreService $integrityService;

    public function __construct(
        DashboardService $dashboardService,
        CctvProviderManager $cctvManager,
        IntegrityScoreService $integrityService
    ) {
        $this->dashboardService = $dashboardService;
        $this->cctvManager = $cctvManager;
        $this->integrityService = $integrityService;
    }

    public function __invoke(): Response
    {
        $hasProviderRecords = ProviderConnection::exists();
        $hasActiveProvider = ProviderConnection::where('is_active', true)->exists();
        $provider = $hasProviderRecords && !$hasActiveProvider ? null : $this->cctvManager->provider();
        $providerConnected = $provider ? (($provider->verifyConnection())['connected'] ?? false) : false;
        $providerStats = $providerConnected ? $provider->getStatus() : [];

        return Inertia::render('dashboard', [
            'stats' => $this->dashboardService->getStats(),
            'dailyEvents' => $this->dashboardService->getDailyEvents(),
            'verificationTrend' => $this->dashboardService->getVerificationTrend(),
            'tamperTrend' => $this->dashboardService->getTamperTrend(),
            'blockchainCommitTrend' => $this->dashboardService->getBlockchainCommitTrend(),
            'recentEvents' => $this->dashboardService->getRecentEvents(),
            'recentAlerts' => $this->dashboardService->getRecentAlerts(),
            'cameraStatuses' => $this->dashboardService->getCameraStatuses(),
            'providerConnected' => $providerConnected,
            'providerName' => $provider?->getProviderName() ?? 'No active evidence source',
            'providerStats' => $providerStats,
            'recentTransactions' => \App\Models\BlockchainTransaction::latest()->limit(10)->get(),
            'recentActivity' => \App\Models\ActivityLog::with('user')->latest()->limit(10)->get(),
            'blockchainMode' => $this->integrityService->getBlockchainMode(),
        ]);
    }
}
