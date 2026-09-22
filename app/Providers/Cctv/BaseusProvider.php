<?php

namespace App\Providers\Cctv;

use App\Contracts\CctvProviderInterface;
use App\Services\Cctv\CameraDiscovery;
use Illuminate\Support\Collection;

class BaseusProvider implements CctvProviderInterface
{
    private array $config = [];
    private bool $connected = false;
    private ?array $camera = null;

    public function __construct(private CameraDiscovery $discovery)
    {
    }

    public function connect(array $config): bool
    {
        $this->config = $config;
        $port = (int) ($config['port'] ?: config('baseus.s0tv00.port', 6668));
        $host = $config['host'] ?? null;

        if ($host && $this->isReachable($host, $port)) {
            $this->camera = [
                'id' => $this->cameraId($config['mac'] ?? config('baseus.s0tv00.known_mac')),
                'manufacturer' => 'Baseus',
                'model' => 'S0TV00',
                'ip' => $host,
                'mac' => $config['mac'] ?? null,
                'port' => $port,
                'status' => 'online',
                'verified' => true,
                'identity_method' => 'last_known_ip_tcp_verification',
            ];
            $this->connected = true;

            return true;
        }

        if (!$host) {
            $this->camera = [
                'id' => $this->cameraId(config('baseus.s0tv00.known_mac')),
                'manufacturer' => 'Baseus',
                'model' => 'S0TV00',
                'ip' => null,
                'mac' => config('baseus.s0tv00.known_mac'),
                'port' => $port,
                'status' => 'online',
                'verified' => false,
                'identity_method' => 'configured_identity_pending_lan_discovery',
            ];
            $this->connected = true;

            return true;
        }

        $this->camera = $this->discovery->findBaseus();
        $this->connected = $this->camera !== null;

        return $this->connected;
    }

    public function verifyConnection(): array
    {
        return [
            'connected' => $this->connected,
            'response_time_ms' => 1,
            'provider' => 'Baseus Wi-Fi Camera',
            'version' => 'browser-media-recorder',
            'device_name' => $this->config['name'] ?? 'Baseus S0TV00',
            'channels' => 1,
            'ip' => $this->camera['ip'] ?? null,
            'mac' => $this->camera['mac'] ?? config('baseus.s0tv00.known_mac'),
            'identity_method' => $this->camera['identity_method'] ?? null,
            'features' => ['wifi_camera', 'lan_discovery', 'tcp_6668', 'private_storage'],
        ];
    }

    public function getCameras(): Collection
    {
        if (!$this->connected) {
            return collect([]);
        }

        return collect([[
            'provider_camera_id' => $this->camera['id'] ?? 'baseus-usb-camera',
            'name' => trim('Baseus '.($this->camera['model'] ?? 'S0TV00')),
            'location' => 'Controlled browser capture source',
            'status' => $this->camera['status'] ?? 'online',
            'channel' => 0,
            'resolution' => '1920x1080',
            'fps' => 30,
            'ip' => $this->camera['ip'] ?? null,
            'mac' => $this->camera['mac'] ?? null,
        ]]);
    }

    public function getEvents(array $params = []): Collection
    {
        return collect([]);
    }

    public function getEvent(string $eventId): ?array
    {
        return null;
    }

    public function getRecordings(array $params = []): Collection
    {
        return collect([]);
    }

    public function getStatus(): array
    {
        return [
            'status' => $this->connected ? 'ready' : 'disconnected',
            'device_name' => $this->config['name'] ?? 'Baseus S0TV00',
            'model' => 'Wi-Fi security camera',
            'channels' => 1,
            'capture_mode' => 'browser MediaRecorder',
            'ip' => $this->camera['ip'] ?? null,
            'mac' => $this->camera['mac'] ?? config('baseus.s0tv00.known_mac'),
        ];
    }

    public function getUsers(): Collection
    {
        return collect([]);
    }

    public function getSnapshots(string $eventId): ?string
    {
        return null;
    }

    public function getHealth(): array
    {
        return $this->getStatus();
    }

    public function normalizeEvent(array $rawEvent): array
    {
        return [
            'event_id' => $rawEvent['event_id'] ?? uniqid('baseus-', true),
            'camera_name' => 'Baseus S0TV00',
            'camera_id' => 'baseus-usb-camera',
            'event_type' => $rawEvent['event_type'] ?? 'usb_capture',
            'label' => $rawEvent['label'] ?? 'controlled_capture',
            'sub_label' => null,
            'start_time' => $rawEvent['start_time'] ?? now()->timestamp,
            'end_time' => $rawEvent['end_time'] ?? null,
            'duration' => $rawEvent['duration'] ?? null,
            'score' => 1,
            'top_score' => 1,
            'false_positive' => false,
            'has_snapshot' => false,
            'has_clip' => true,
            'snapshot_url' => null,
            'recording_url' => $rawEvent['recording_url'] ?? null,
            'zones' => [],
            'thumbnail' => null,
            'provider' => 'baseus',
        ];
    }

    public function getProviderInfo(): array
    {
        return [
            'name' => 'Baseus Wi-Fi Camera',
            'vendor' => 'Baseus',
            'model' => 'S0TV00 Wi-Fi security camera',
            'serial' => 'Browser controlled source',
            'ip' => $this->camera['ip'] ?? null,
            'mac' => $this->camera['mac'] ?? config('baseus.s0tv00.known_mac'),
            'features' => ['wifi_camera', 'lan_discovery', 'tcp_6668', 'private_storage'],
        ];
    }

    public function getProviderName(): string
    {
        return 'Baseus Wi-Fi Camera';
    }

    private function isReachable(string $host, int $port): bool
    {
        if (!filter_var($host, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            return false;
        }

        $socket = @fsockopen($host, $port, $errno, $errstr, (float) config('baseus.discovery.connect_timeout_seconds', 0.35));
        if (!$socket) {
            return false;
        }

        fclose($socket);

        return true;
    }

    private function cameraId(?string $mac): string
    {
        $hex = strtoupper(preg_replace('/[^0-9A-Fa-f]/', '', $mac ?? '') ?? '');

        if (strlen($hex) === 12) {
            return 'baseus-'.strtolower(implode('-', str_split($hex, 2)));
        }

        return 'baseus-s0tv00';
    }
}
