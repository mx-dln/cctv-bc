<?php

namespace App\Providers\Cctv;

use App\Contracts\CctvProviderInterface;
use App\Services\Cctv\FrigateService;
use Illuminate\Support\Collection;

class FrigateProvider implements CctvProviderInterface
{
    private array $config = [];
    private ?FrigateService $frigate = null;

    public function connect(array $config): bool
    {
        $this->config = $config;
        $this->frigate = app(FrigateService::class);

        if (!empty($config['base_url'])) {
            $this->frigate = new FrigateService();
        }

        return $this->frigate->isAvailable();
    }

    public function verifyConnection(): array
    {
        $start = microtime(true);
        try {
            $available = $this->getFrigate()->isAvailable();
            $version = $available ? $this->getFrigate()->getVersion() : 'unknown';
            return [
                'connected' => $available,
                'response_time_ms' => (int) ((microtime(true) - $start) * 1000),
                'provider' => 'Frigate NVR',
                'version' => $version,
                'features' => ['events', 'cameras', 'recordings', 'snapshots', 'review', 'stats'],
            ];
        } catch (\Exception $e) {
            return ['connected' => false, 'error' => $e->getMessage(), 'response_time_ms' => (int) ((microtime(true) - $start) * 1000)];
        }
    }

    public function getCameras(): Collection
    {
        $cameras = $this->getFrigate()->getCameras();
        return collect($cameras)->map(fn($c, $name) => [
            'provider_camera_id' => $name,
            'name' => $c['name'] ?? $name,
            'location' => null,
            'status' => 'online',
            'resolution' => ($c['width'] ?? 0) . 'x' . ($c['height'] ?? 0),
            'fps' => $c['fps'] ?? 0,
        ]);
    }

    public function getEvents(array $params = []): Collection
    {
        $events = $this->getFrigate()->getEvents([
            'limit' => $params['limit'] ?? 50,
            'after' => $params['after'] ?? now()->subDay()->timestamp,
            'before' => $params['before'] ?? now()->timestamp,
            'has_snapshot' => 1,
        ]);
        return collect($events);
    }

    public function getEvent(string $eventId): ?array
    {
        return $this->getFrigate()->getEvent($eventId);
    }

    public function getRecordings(array $params = []): Collection
    {
        return collect($this->getFrigate()->getRecordings($params));
    }

    public function getStatus(): array
    {
        return $this->getFrigate()->getStats();
    }

    public function getUsers(): Collection { return collect([]); }

    public function getSnapshots(string $eventId): ?string
    {
        return $this->getFrigate()->client()->get($this->getFrigate()->getSnapshotUrl($eventId, ''))->body() ?? null;
    }

    public function getHealth(): array
    {
        $available = $this->getFrigate()->isAvailable();
        $stats = $available ? $this->getFrigate()->getStats() : [];
        return [
            'status' => $available ? 'healthy' : 'unreachable',
            'cpu_usage' => $stats['cpu_usages']['overall'] ?? null,
            'memory_usage' => isset($stats['gpu_usages']) ? json_encode($stats['gpu_usages']) : null,
            'uptime' => $stats['uptime'] ?? null,
        ];
    }

    public function normalizeEvent(array $rawEvent): array
    {
        return [
            'event_id' => $rawEvent['id'] ?? null,
            'camera_name' => $rawEvent['camera'] ?? 'unknown',
            'camera_id' => $rawEvent['camera'] ?? 'unknown',
            'event_type' => $rawEvent['has_snapshot'] ? 'snapshot' : 'detection',
            'label' => $rawEvent['label'] ?? 'unknown',
            'sub_label' => $rawEvent['sub_label'] ?? null,
            'start_time' => $rawEvent['start_time'] ?? null,
            'end_time' => $rawEvent['end_time'] ?? null,
            'duration' => isset($rawEvent['end_time'], $rawEvent['start_time']) ? (int)($rawEvent['end_time'] - $rawEvent['start_time']) : null,
            'score' => $rawEvent['score'] ?? 0,
            'top_score' => $rawEvent['top_score'] ?? 0,
            'false_positive' => $rawEvent['false_positive'] ?? false,
            'has_snapshot' => $rawEvent['has_snapshot'] ?? false,
            'has_clip' => $rawEvent['has_clip'] ?? false,
            'snapshot_url' => $rawEvent['id'] ? $this->getFrigate()->getSnapshotUrl($rawEvent['id'], $rawEvent['camera'] ?? '') : null,
            'recording_url' => null,
            'zones' => $rawEvent['zones'] ?? [],
            'thumbnail' => $rawEvent['thumbnail'] ?? null,
            'provider' => 'frigate',
        ];
    }

    public function getProviderInfo(): array
    {
        return ['name' => 'Frigate NVR', 'version' => $this->getFrigate()->getVersion(), 'vendor' => 'Frigate', 'features' => ['events', 'cameras', 'recordings', 'snapshots', 'review', 'stats', 'audio']];
    }

    public function getProviderName(): string { return 'Frigate NVR'; }

    private function getFrigate(): FrigateService
    {
        if (!$this->frigate) {
            $this->frigate = app(FrigateService::class);
        }
        return $this->frigate;
    }
}
