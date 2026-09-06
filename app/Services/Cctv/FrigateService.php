<?php

namespace App\Services\Cctv;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FrigateService
{
    private string $baseUrl;
    private ?string $apiKey;
    private int $timeout;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('chainofcustody.cctv.frigate.url', 'http://localhost:5000'), '/');
        $this->apiKey = config('chainofcustody.cctv.frigate.api_key');
        $this->timeout = (int) config('chainofcustody.cctv.frigate.timeout', 15);
    }

    public function client(): PendingRequest
    {
        $client = Http::timeout($this->timeout)
            ->withHeaders(['Accept' => 'application/json']);

        if ($this->apiKey) {
            $client->withToken($this->apiKey);
        }

        return $client;
    }

    public function get(string $endpoint, array $query = []): array
    {
        $url = "{$this->baseUrl}/api/{$endpoint}";
        $response = $this->client()->get($url, $query);

        if ($response->failed()) {
            Log::error("Frigate API error [GET {$url}]: {$response->status()} {$response->body()}");
            throw new \RuntimeException("Frigate API returned status {$response->status()}: {$response->body()}");
        }

        return $response->json() ?? [];
    }

    public function getCameras(): array
    {
        return $this->get('config')['cameras'] ?? [];
    }

    public function getEvents(array $params = []): array
    {
        return $this->get('events', $params);
    }

    public function getEvent(string $eventId): array
    {
        return $this->get("events/{$eventId}");
    }

    public function getStats(): array
    {
        return $this->get('stats');
    }

    public function getRecordings(array $params = []): array
    {
        return $this->get('recordings', $params);
    }

    public function getReview(array $params = []): array
    {
        return $this->get('review', $params);
    }

    public function getVersion(): string
    {
        return $this->get('version')['version'] ?? 'unknown';
    }

    public function isAvailable(): bool
    {
        try {
            $response = $this->client()->get("{$this->baseUrl}/api/version");
            return $response->successful();
        } catch (\Exception $e) {
            return false;
        }
    }

    public function getSnapshotUrl(string $eventId, string $cameraName): string
    {
        return "{$this->baseUrl}/api/events/{$eventId}/snapshot.jpg";
    }

    public function getRecordingUrl(string $eventId, string $cameraName): string
    {
        $event = $this->getEvent($eventId);
        $path = $event['recording_path'] ?? '';
        return $path ? "{$this->baseUrl}/api/recordings/{$path}" : '';
    }
}
