<?php

namespace App\Providers\Cctv;

use App\Contracts\CctvProviderInterface;
use App\Services\Cctv\DahuaService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class DahuaProvider implements CctvProviderInterface
{
    private DahuaService $dahua;
    private array $config = [];
    private bool $connected = false;

    public function __construct(DahuaService $dahua)
    {
        $this->dahua = $dahua;
    }

    public function connect(array $config): bool
    {
        $this->config = $config;
        try {
            $this->dahua->configure($config);
            $this->connected = $this->dahua->isAvailable();
            return $this->connected;
        } catch (\Exception $e) {
            Log::error("Dahua connection failed: {$e->getMessage()}");
            $this->connected = false;
            return false;
        }
    }

    public function verifyConnection(): array
    {
        $start = microtime(true);
        try {
            $info = $this->dahua->getDeviceInfo();
            $ms = (int) ((microtime(true) - $start) * 1000);
            return [
                'connected' => true,
                'response_time_ms' => $ms,
                'provider' => 'Dahua ' . ($info['deviceType'] ?? 'DVR'),
                'version' => $info['softwareVersion'] ?? 'unknown',
                'serial' => $info['sn'] ?? '',
                'device_name' => $info['deviceName'] ?? '',
                'channels' => (int) ($info['maxInputChannels'] ?? 0),
                'features' => ['events', 'cameras', 'recordings', 'smart_events', 'alarm', 'storage', 'logs'],
            ];
        } catch (\Exception $e) {
            return ['connected' => false, 'error' => $e->getMessage(), 'response_time_ms' => (int) ((microtime(true) - $start) * 1000)];
        }
    }

    public function getCameras(): Collection
    {
        $channels = $this->dahua->getChannels();
        return collect($channels)->map(fn($ch) => [
            'provider_camera_id' => 'dahua-channel-' . $ch['channel'],
            'name' => $ch['name'],
            'location' => null,
            'status' => $ch['status'],
            'channel' => $ch['channel'],
            'resolution' => '1920x1080',
            'fps' => 15,
        ]);
    }

    public function getEvents(array $params = []): Collection
    {
        $count = $params['limit'] ?? 50;
        $rawEvents = $this->dahua->getEvents($count);

        return collect($rawEvents)->map(function ($event) {
            return $this->normalizeEvent($event);
        });
    }

    public function getEvent(string $eventId): ?array
    {
        $events = $this->getEvents(['limit' => 100]);
        return $events->firstWhere('event_id', $eventId);
    }

    public function getRecordings(array $params = []): Collection
    {
        $channel = $params['channel'] ?? 0;
        $days = $params['days'] ?? 1;
        $recordings = $this->dahua->getRecordings($channel, $days);
        return collect($recordings);
    }

    public function getStatus(): array
    {
        return $this->dahua->getDeviceHealth();
    }

    public function getUsers(): Collection
    {
        $users = $this->dahua->getUsers();
        return collect($users);
    }

    public function getSnapshots(string $eventId): ?string
    {
        return null;
    }

    public function getHealth(): array
    {
        return $this->dahua->getDeviceHealth();
    }

    public function normalizeEvent(array $rawEvent): array
    {
        return [
            'event_id' => $rawEvent['eventID'] ?? $rawEvent['id'] ?? uniqid('dahua-', true),
            'camera_name' => $rawEvent['cameraName'] ?? $rawEvent['channel'] ?? 'unknown',
            'camera_id' => $rawEvent['cameraId'] ?? $rawEvent['channel'] ?? '0',
            'event_type' => $rawEvent['eventType'] ?? $rawEvent['action'] ?? 'motion',
            'label' => $rawEvent['objectType'] ?? $rawEvent['ruleName'] ?? $rawEvent['eventType'] ?? 'unknown',
            'sub_label' => null,
            'start_time' => $rawEvent['startTime'] ?? $rawEvent['UTC'] ?? now()->timestamp,
            'end_time' => $rawEvent['endTime'] ?? null,
            'duration' => $rawEvent['duration'] ?? null,
            'score' => (float) ($rawEvent['score'] ?? $rawEvent['confidence'] ?? 0),
            'top_score' => (float) ($rawEvent['topScore'] ?? 0),
            'false_positive' => (bool) ($rawEvent['falsePositive'] ?? $rawEvent['false_positive'] ?? false),
            'has_snapshot' => (bool) ($rawEvent['hasSnapshot'] ?? $rawEvent['has_snapshot'] ?? false),
            'has_clip' => (bool) ($rawEvent['hasVideo'] ?? $rawEvent['has_clip'] ?? false),
            'snapshot_url' => $rawEvent['snapshotUrl'] ?? $rawEvent['pictureUrl'] ?? null,
            'recording_url' => $rawEvent['recordingUrl'] ?? null,
            'zones' => $rawEvent['zones'] ?? [],
            'thumbnail' => $rawEvent['thumbnail'] ?? null,
            'provider' => 'dahua',
        ];
    }

    public function getProviderInfo(): array
    {
        try {
            $info = $this->dahua->getDeviceInfo();
            return [
                'name' => 'Dahua ' . ($info['deviceType'] ?? 'DVR'),
                'version' => $info['softwareVersion'] ?? 'unknown',
                'vendor' => 'Dahua Technology',
                'model' => $info['deviceType'] ?? '',
                'serial' => $info['sn'] ?? '',
                'features' => ['events', 'cameras', 'recordings', 'smart_events', 'alarm', 'storage', 'logs'],
            ];
        } catch (\Exception $e) {
            return ['name' => 'Dahua DVR', 'vendor' => 'Dahua Technology', 'features' => []];
        }
    }

    public function getProviderName(): string
    {
        return 'Dahua DVR';
    }
}
