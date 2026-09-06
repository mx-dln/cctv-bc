<?php

namespace App\Services\Cctv;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DahuaService
{
    private array $config = [];
    private ?PendingRequest $client = null;
    private string $baseUrl = '';

    public function configure(array $config): void
    {
        $this->config = $config;
        $host = $config['host'] ?? '192.168.1.100';
        $port = $config['port'] ?? 80;
        $proto = ($config['https_enabled'] ?? false) ? 'https' : 'http';
        $this->baseUrl = "{$proto}://{$host}:{$port}";

        $timeout = $config['connection_timeout'] ?? 15;

        $this->client = Http::timeout($timeout)
            ->withBasicAuth($config['username'] ?? 'admin', $config['password'] ?? '')
            ->withHeaders(['Accept' => 'application/json']);
    }

    public function getClient(): PendingRequest
    {
        if (!$this->client) {
            throw new \RuntimeException('DahuaService not configured. Call configure() first.');
        }
        return $this->client;
    }

    public function get(string $endpoint, array $params = []): array
    {
        $url = "{$this->baseUrl}/cgi-bin/{$endpoint}";
        try {
            $response = $this->getClient()->get($url, $params);
            $body = $response->body();
            return $this->parseResponse($body);
        } catch (\Exception $e) {
            Log::error("Dahua CGI error [{$endpoint}]: {$e->getMessage()}");
            throw $e;
        }
    }

    public function parseResponse(string $body): array
    {
        $result = [];
        foreach (explode("\n", trim($body)) as $line) {
            $line = trim($line);
            if (empty($line)) continue;
            if (str_contains($line, '=')) {
                [$key, $value] = explode('=', $line, 2);
                $result[trim($key)] = trim($value);
            }
        }
        return $result;
    }

    public function getDeviceInfo(): array
    {
        return $this->get('magicBox.cgi', ['action' => 'getSystemInfo']);
    }

    public function getDeviceName(): string
    {
        $info = $this->getDeviceInfo();
        return $info['deviceName'] ?? $info['sn'] ?? 'Dahua DVR';
    }

    public function getFirmwareVersion(): string
    {
        $info = $this->getDeviceInfo();
        return ($info['hardwareVersion'] ?? '') . ' / ' . ($info['softwareVersion'] ?? '');
    }

    public function getSerialNumber(): string
    {
        $info = $this->getDeviceInfo();
        return $info['sn'] ?? '';
    }

    public function getChannels(): array
    {
        $result = $this->get('devVideoInput.cgi', ['action' => 'getCaps']);
        $channels = [];
        $count = (int) ($result['maxInputChannels'] ?? 0);
        for ($i = 0; $i < $count; $i++) {
            $nameResult = $this->get('devVideoInput.cgi', ['action' => 'getVideoInputName', 'channel' => $i]);
            $channels[] = [
                'channel' => $i,
                'name' => $nameResult['name'] ?? "Channel {$i}",
                'status' => $this->getChannelStatus($i),
            ];
        }
        return $channels;
    }

    public function getChannelStatus(int $channel): string
    {
        try {
            $result = $this->get('devVideoInput.cgi', ['action' => 'getVideoInputState', 'channel' => $channel]);
            return ($result['state'] ?? '0') === '1' ? 'online' : 'offline';
        } catch (\Exception $e) {
            return 'offline';
        }
    }

    public function getEvents(int $count = 50): array
    {
        $result = $this->get('eventManager.cgi', [
            'action' => 'attach',
            'codes' => 'All',
            'count' => $count,
        ]);
        $events = [];
        foreach ($result as $key => $value) {
            if (str_starts_with($key, 'event')) {
                $events[] = $value;
            }
        }
        return $events;
    }

    public function getRecordings(int $channel = 0, int $days = 1): array
    {
        $result = $this->get('recordManager.cgi', [
            'action' => 'query',
            'channel' => $channel,
            'days' => $days,
        ]);
        return $result;
    }

    public function getSystemLogs(int $count = 100): array
    {
        $result = $this->get('log.cgi', ['action' => 'startFind', 'count' => $count]);
        return $result;
    }

    public function getUsers(): array
    {
        return $this->get('userManager.cgi', ['action' => 'getUserInfo']);
    }

    public function getStorageStatus(): array
    {
        $result = $this->get('storageManager.cgi', ['action' => 'getDiskInfo']);
        $disks = [];
        $i = 0;
        while (isset($result["disk.{$i}.state"])) {
            $disks[] = [
                'index' => $i,
                'state' => $result["disk.{$i}.state"] ?? '',
                'total' => $result["disk.{$i}.totalBytes"] ?? 0,
                'used' => $result["disk.{$i}.usedBytes"] ?? 0,
                'remain' => $result["disk.{$i}.remainBytes"] ?? 0,
                'status' => $result["disk.{$i}.status"] ?? '',
            ];
            $i++;
        }
        return [
            'disks' => $disks,
            'total' => $result['totalBytes'] ?? 0,
            'used' => $result['usedBytes'] ?? 0,
            'remain' => $result['remainBytes'] ?? 0,
        ];
    }

    public function getDeviceHealth(): array
    {
        try {
            $info = $this->getDeviceInfo();
            $storage = $this->getStorageStatus();
            $totalStorage = $storage['total'] ?? 1;
            $usedStorage = $storage['used'] ?? 0;
            $usagePercent = $totalStorage > 0 ? round(($usedStorage / $totalStorage) * 100, 1) : 0;

            return [
                'status' => 'healthy',
                'device_name' => $info['deviceName'] ?? 'Unknown',
                'model' => $info['deviceType'] ?? 'Unknown',
                'serial' => $info['sn'] ?? '',
                'firmware' => ($info['hardwareVersion'] ?? '') . ' / ' . ($info['softwareVersion'] ?? ''),
                'uptime' => $info['upTime'] ?? '0',
                'cpu_usage' => $info['cpuUsage'] ?? '0%',
                'memory_usage' => $info['memoryUsage'] ?? '0%',
                'storage_usage' => "{$usagePercent}%",
                'disk_count' => count($storage['disks'] ?? []),
                'channels' => $info['maxInputChannels'] ?? 0,
            ];
        } catch (\Exception $e) {
            return ['status' => 'unreachable', 'error' => $e->getMessage()];
        }
    }

    public function isAvailable(): bool
    {
        try {
            $this->get('magicBox.cgi', ['action' => 'getSystemInfo']);
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    public function reboot(): array
    {
        return $this->get('magicBox.cgi', ['action' => 'reboot']);
    }
}
