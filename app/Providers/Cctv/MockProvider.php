<?php

namespace App\Providers\Cctv;

use App\Contracts\CctvProviderInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class MockProvider implements CctvProviderInterface
{
    private array $config = [];
    private bool $connected = false;

    private const CHANNELS = [
        ['channel' => 0, 'name' => 'Main Entrance', 'status' => 'online'],
        ['channel' => 1, 'name' => 'Lobby', 'status' => 'online'],
        ['channel' => 2, 'name' => 'Parking Lot', 'status' => 'online'],
        ['channel' => 3, 'name' => 'Server Room', 'status' => 'online'],
        ['channel' => 4, 'name' => 'Vault Door', 'status' => 'online'],
        ['channel' => 5, 'name' => 'ATM Area', 'status' => 'online'],
        ['channel' => 6, 'name' => 'Back Entrance', 'status' => 'offline'],
        ['channel' => 7, 'name' => 'Rooftop', 'status' => 'offline'],
    ];

    private const EVENT_TYPES = [
        'MotionDetect', 'VideoLoss', 'VideoBlind', 'AlarmLocal',
        'StorageFull', 'StorageNotExist', 'HDDFull', 'HDFailure',
        'RecordingStarted', 'RecordingStopped', 'UserLogin', 'UserLogout',
        'SystemRestart', 'NetAbnormal', 'NetRecover', 'CameraOnline', 'CameraOffline',
    ];

    private const OBJECT_TYPES = ['person', 'vehicle', 'face', 'unknown'];

    public function connect(array $config): bool
    {
        $this->config = $config;
        $this->connected = true;
        return true;
    }

    public function verifyConnection(): array
    {
        if (!$this->connected) {
            return ['connected' => false, 'error' => 'No active provider connection.'];
        }
        $responseTime = rand(3, 30);
        return [
            'connected' => true,
            'response_time_ms' => $responseTime,
            'provider' => 'Dahua DVR/NVR (Mock)',
            'version' => '4.001.0000009.0',
            'device_name' => $this->config['name'] ?? 'FICOBank DVR-01',
            'serial' => 'DH-' . strtoupper(Str::random(12)),
            'channels' => count(self::CHANNELS),
            'features' => ['events', 'cameras', 'recordings', 'smart_events', 'alarm', 'storage', 'logs'],
        ];
    }

    public function getCameras(): Collection
    {
        if (!$this->connected) return collect([]);
        return collect(self::CHANNELS)->map(fn($ch) => [
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
        $limit = min($params['limit'] ?? 50, 200);
        $events = [];

        for ($i = 0; $i < $limit; $i++) {
            $channel = self::CHANNELS[array_rand(self::CHANNELS)];
            $eventType = self::EVENT_TYPES[array_rand(self::EVENT_TYPES)];
            $startTime = now()->subMinutes(rand(0, 1440))->timestamp;
            $endTime = $startTime + rand(5, 300);
            $objectType = in_array($eventType, ['MotionDetect', 'VideoBlind']) ? self::OBJECT_TYPES[array_rand(self::OBJECT_TYPES)] : null;

            $events[] = [
                'eventID' => strtoupper('DH-' . Str::random(16)),
                'channel' => (string) $channel['channel'],
                'cameraName' => $channel['name'],
                'cameraId' => (string) $channel['channel'],
                'eventType' => $eventType,
                'ruleName' => $eventType,
                'objectType' => $objectType,
                'startTime' => $startTime,
                'endTime' => $endTime,
                'duration' => $endTime - $startTime,
                'score' => round(mt_rand(55, 99) / 100, 2),
                'topScore' => round(mt_rand(70, 99) / 100, 2),
                'falsePositive' => false,
                'hasSnapshot' => (bool) rand(0, 1),
                'hasVideo' => in_array($eventType, ['RecordingStarted', 'RecordingStopped', 'MotionDetect']),
                'snapshotUrl' => null,
                'recordingUrl' => null,
                'zones' => [],
                'thumbnail' => null,
                'UTC' => $startTime,
            ];
        }

        return collect($events);
    }

    public function getEvent(string $eventId): ?array
    {
        $event = $this->getEvents(['limit' => 1])->first();
        if ($event) $event['eventID'] = $eventId;
        return $event;
    }

    public function getRecordings(array $params = []): Collection
    {
        return collect([]);
    }

    public function getStatus(): array
    {
        $totalStorage = 4 * 1024 * 1024 * 1024 * 1024; // 4TB
        $usedStorage = rand(1, 3) * 1024 * 1024 * 1024 * 1024;
        $usagePercent = round(($usedStorage / $totalStorage) * 100, 1);

        return [
            'status' => 'healthy',
            'device_name' => $this->config['name'] ?? 'FICOBank DVR-01',
            'model' => 'DHI-NVR5216-16P-4KS2',
            'serial' => 'DH-' . strtoupper(Str::random(12)),
            'firmware' => '4.001.0000009.0 / V4.001.0000009.0',
            'uptime' => (string) rand(86400, 2592000),
            'cpu_usage' => rand(15, 55) . '%',
            'memory_usage' => rand(30, 70) . '%',
            'storage_usage' => "{$usagePercent}%",
            'disk_count' => 2,
            'channels' => count(self::CHANNELS),
        ];
    }

    public function getUsers(): Collection
    {
        return collect([
            ['id' => 1, 'name' => 'admin', 'role' => 'administrator', 'group' => 'admin'],
            ['id' => 2, 'name' => 'operator', 'role' => 'operator', 'group' => 'operator'],
            ['id' => 3, 'name' => 'auditor', 'role' => 'viewer', 'group' => 'viewer'],
        ]);
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
        return [
            'name' => 'Dahua NVR5216 (Mock)',
            'version' => '4.001.0000009.0',
            'vendor' => 'Dahua Technology',
            'model' => 'DHI-NVR5216-16P-4KS2',
            'serial' => 'DH-MOCK' . strtoupper(Str::random(8)),
            'features' => ['events', 'cameras', 'recordings', 'smart_events', 'alarm', 'storage', 'logs'],
        ];
    }

    public function getProviderName(): string
    {
        return 'Dahua DVR (Mock)';
    }
}
