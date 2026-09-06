<?php

namespace App\Http\Controllers;

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
        $provider = $this->cctvManager->provider();
        $providerConnected = ($provider->verifyConnection())['connected'] ?? false;
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
            'providerName' => $provider->getProviderName(),
            'providerStats' => $providerStats,
            'integrityScore' => $this->integrityService->getIntegrityScore(),
            'healthScore' => $this->integrityService->getForensicHealthScore(),
            'blockchainMode' => $this->integrityService->getBlockchainMode(),
        ]);
    }
}
