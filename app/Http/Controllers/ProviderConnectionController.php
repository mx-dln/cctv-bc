<?php

namespace App\Http\Controllers;

use App\Models\ProviderConnection;
use App\Services\Cctv\CctvProviderFactory;
use App\Models\Camera;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProviderConnectionController extends Controller
{
    private CctvProviderFactory $factory;

    public function __construct(CctvProviderFactory $factory)
    {
        $this->factory = $factory;
    }

    public function index(): Response
    {
        $connections = ProviderConnection::orderBy('is_active', 'desc')->latest()->get();

        return Inertia::render('settings/provider', [
            'connections' => $connections,
            'availableProviders' => $this->factory->availableProviders(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'provider_type' => 'required|string|in:' . implode(',', array_keys($this->factory->availableProviders())),
            'base_url' => 'nullable|string|max:255',
            'host' => 'nullable|string|max:255',
            'port' => 'nullable|integer|min:1|max:65535',
            'username' => 'nullable|string|max:255',
            'password' => 'nullable|string|max:255',
            'api_key' => 'nullable|string|max:255',
            'onvif_url' => 'nullable|string|max:255',
            'rtsp_url' => 'nullable|string|max:255',
            'https_enabled' => 'boolean',
            'polling_interval' => 'nullable|integer|min:5|max:3600',
            'connection_timeout' => 'nullable|integer|min:1|max:120',
            'auto_sync' => 'boolean',
        ]);

        // Deactivate all existing connections if this one is active
        if ($validated['is_active'] ?? false) {
            ProviderConnection::where('is_active', true)->update(['is_active' => false]);
        }

        ProviderConnection::create($validated);

        return redirect()->route('settings.provider')->with('success', 'Provider connection created.');
    }

    public function update(Request $request, ProviderConnection $connection): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'provider_type' => 'required|string',
            'base_url' => 'nullable|string|max:255',
            'host' => 'nullable|string|max:255',
            'port' => 'nullable|integer|min:1|max:65535',
            'username' => 'nullable|string|max:255',
            'password' => 'nullable|string|max:255',
            'api_key' => 'nullable|string|max:255',
            'onvif_url' => 'nullable|string|max:255',
            'rtsp_url' => 'nullable|string|max:255',
            'https_enabled' => 'boolean',
            'polling_interval' => 'nullable|integer|min:5|max:3600',
            'connection_timeout' => 'nullable|integer|min:1|max:120',
            'auto_sync' => 'boolean',
            'is_active' => 'boolean',
        ]);

        if ($validated['is_active'] ?? false) {
            ProviderConnection::where('is_active', true)->where('id', '!=', $connection->id)->update(['is_active' => false]);
        }

        // Don't overwrite password/api_key with masked values
        if (empty($validated['password']) || str_starts_with($validated['password'], '***')) {
            unset($validated['password']);
        }
        if (empty($validated['api_key']) || str_starts_with($validated['api_key'], '***')) {
            unset($validated['api_key']);
        }

        $connection->update($validated);

        return redirect()->route('settings.provider')->with('success', 'Provider connection updated.');
    }

    public function destroy(ProviderConnection $connection): RedirectResponse
    {
        $connection->delete();
        return redirect()->route('settings.provider')->with('success', 'Provider connection deleted.');
    }

    public function test(ProviderConnection $connection): JsonResponse
    {
        try {
            $provider = $this->factory->resolve($connection->provider_type);
            $provider->connect($connection->toConfig());
            $result = $provider->verifyConnection();
            $connected = $result['connected'] ?? false;

            $connection->update([
                'last_connected_at' => now(),
                'last_connection_status' => $connected ? 'connected' : 'failed',
                'provider_info' => $provider->getProviderInfo(),
            ]);

            return response()->json([
                'success' => $connected,
                'result' => $result,
                'provider_info' => $provider->getProviderInfo(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function activate(ProviderConnection $connection): RedirectResponse
    {
        ProviderConnection::where('is_active', true)->update(['is_active' => false]);
        $connection->update(['is_active' => true]);
        $this->syncCameras($connection);

        return redirect()->route('settings.provider')->with('success', 'Provider activated.');
    }

    public function deactivate(ProviderConnection $connection): RedirectResponse
    {
        $connection->update(['is_active' => false]);
        return redirect()->route('settings.provider')->with('success', 'Provider deactivated.');
    }

    private function syncCameras(ProviderConnection $connection): void
    {
        $provider = $this->factory->resolve($connection->provider_type);
        $provider->connect($connection->toConfig());

        if (!(($provider->verifyConnection()['connected'] ?? false))) {
            return;
        }

        foreach ($provider->getCameras() as $cameraData) {
            Camera::updateOrCreate(
                [
                    'provider' => $provider->getProviderName(),
                    'provider_camera_id' => $cameraData['provider_camera_id'],
                ],
                [
                    'name' => $cameraData['name'],
                    'location' => $cameraData['location'] ?? null,
                    'status' => $cameraData['status'] ?? 'online',
                    'resolution' => $cameraData['resolution'] ?? null,
                    'fps' => $cameraData['fps'] ?? null,
                ]
            );
        }
    }
}
