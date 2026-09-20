<?php

namespace App\Http\Controllers;

use App\Models\Camera;
use App\Models\ProviderConnection;
use App\Services\Cctv\CctvProviderManager;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CameraController extends Controller
{
    private CctvProviderManager $cctvManager;

    public function __construct(CctvProviderManager $cctvManager)
    {
        $this->cctvManager = $cctvManager;
    }

    public function index(Request $request): Response
    {
        if (ProviderConnection::exists() && !ProviderConnection::where('is_active', true)->exists()) {
            return Inertia::render('cameras/index', [
                'cameras' => [],
                'connected' => false,
                'providerName' => 'No active DVR/NVR provider',
            ]);
        }

        $provider = $this->cctvManager->provider();
        $connectionResult = $provider->verifyConnection();
        $connected = $connectionResult['connected'] ?? false;

        return Inertia::render('cameras/index', [
            'cameras' => $connected ? $provider->getCameras()->values()->all() : [],
            'connected' => $connected,
            'providerName' => $provider->getProviderName(),
        ]);
    }
}
