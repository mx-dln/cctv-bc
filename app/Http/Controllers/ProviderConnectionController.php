<?php

namespace App\Http\Controllers;

use App\Models\ProviderConnection;
use App\Services\Cctv\CameraDiscovery;
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

    public function __construct(CctvProviderFactory $factory, private CameraDiscovery $cameraDiscovery)
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
            'is_active' => 'boolean',
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
            $providerInfo = $provider->getProviderInfo();

            $updates = [
                'last_connected_at' => now(),
                'last_connection_status' => $connected ? 'connected' : 'failed',
                'provider_info' => $providerInfo,
            ];

            if ($connection->provider_type === 'baseus' && $connected && !empty($result['ip'])) {
                $updates['host'] = $result['ip'];
                $updates['port'] = $result['port'] ?? config('baseus.s0tv00.port', 6668);
                $updates['provider_info'] = array_merge($providerInfo, [
                    'mac' => $result['mac'] ?? config('baseus.s0tv00.known_mac'),
                    'identity_method' => $result['identity_method'] ?? null,
                ]);
            }

            $connection->update($updates);

            return response()->json([
                'success' => $connected,
                'result' => $result,
                'provider_info' => $updates['provider_info'],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function discoverBaseus(): JsonResponse
    {
        try {
            return response()->json($this->cameraDiscovery->discoverBaseus());
        } catch (\Throwable $exception) {
            report($exception);

            return response()->json([
                'status' => 'error',
                'interfaces' => [],
                'cameras' => [],
                'attempted_methods' => [
                    'existing_arp_table',
                    'local_subnet_discovery',
                    'tcp_6668_verification',
                ],
                'limitations' => [
                    'Discovery is restricted to private LAN interfaces.',
                ],
                'error' => 'Camera discovery failed. Check network permission/firewall and try again.',
            ]);
        }
    }

    public function connectDiscoveredBaseus(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ip' => 'required|ip',
            'mac' => 'nullable|string|max:32',
            'port' => 'required|integer|min:1|max:65535',
            'manufacturer' => 'required|string|max:255',
            'model' => 'required|string|max:255',
        ]);

        $connection = ProviderConnection::firstOrNew([
            'provider_type' => 'baseus',
        ]);

        $connection->fill([
            'name' => 'Baseus S0TV00',
            'host' => $validated['ip'],
            'port' => $validated['port'],
            'username' => null,
            'password' => null,
            'polling_interval' => 60,
            'connection_timeout' => 15,
            'auto_sync' => true,
            'is_active' => true,
            'last_connected_at' => now(),
            'last_connection_status' => 'connected',
            'provider_info' => [
                'name' => 'Baseus S0TV00',
                'vendor' => $validated['manufacturer'],
                'model' => $validated['model'],
                'serial' => $validated['mac'] ?: 'Identity from protocol fingerprint',
                'mac' => $validated['mac'],
                'ip' => $validated['ip'],
                'port' => $validated['port'],
                'identity' => $validated['mac'] ?: $validated['manufacturer'].' '.$validated['model'].' tcp-'.$validated['port'],
                'features' => ['lan_discovery', 'tcp_6668', 'wifi_camera', 'private_storage'],
            ],
        ]);

        ProviderConnection::where('is_active', true)
            ->when($connection->exists, fn ($query) => $query->where('id', '!=', $connection->id))
            ->update(['is_active' => false]);

        $connection->save();

        Camera::updateOrCreate(
            [
                'provider' => 'Baseus Wi-Fi Camera',
                'provider_camera_id' => $validated['mac']
                    ? 'baseus-'.strtolower(str_replace(':', '-', $validated['mac']))
                    : 'baseus-'.str_replace('.', '-', $validated['ip']),
            ],
            [
                'name' => 'Baseus S0TV00',
                'location' => 'Automatically discovered LAN camera',
                'status' => 'online',
                'resolution' => '1920x1080',
                'fps' => 30,
            ]
        );

        return response()->json([
            'success' => true,
            'connection' => $connection->fresh(),
        ]);
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

        if ($connection->provider_type === 'baseus') {
            $result = $provider->verifyConnection();
            if (!empty($result['ip'])) {
                $connection->update([
                    'host' => $result['ip'],
                    'port' => $result['port'] ?? config('baseus.s0tv00.port', 6668),
                    'last_connected_at' => now(),
                    'last_connection_status' => 'connected',
                    'provider_info' => array_merge($provider->getProviderInfo(), [
                        'mac' => $result['mac'] ?? config('baseus.s0tv00.known_mac'),
                        'identity_method' => $result['identity_method'] ?? null,
                    ]),
                ]);
            }
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
