<?php

namespace App\Services\Cctv;

use App\Contracts\CctvProviderInterface;
use App\Models\ProviderConnection;
use App\Providers\Cctv\DahuaProvider;
use App\Providers\Cctv\MockProvider;
use Illuminate\Support\Facades\Log;

class CctvProviderFactory
{
    private static array $instances = [];

    public function create(?ProviderConnection $connection = null): CctvProviderInterface
    {
        $connection ??= ProviderConnection::where('is_active', true)->first();

        if (!$connection) {
            return $this->createMock();
        }

        $cacheKey = $connection->id;
        if (isset(self::$instances[$cacheKey])) {
            return self::$instances[$cacheKey];
        }

        $provider = $this->resolve($connection->provider_type);
        $connected = $provider->connect($connection->toConfig());

        if (!$connected) {
            Log::warning("Failed to connect to provider: {$connection->provider_type}");
        }

        self::$instances[$cacheKey] = $provider;
        return $provider;
    }

    public function resolve(string $type): CctvProviderInterface
    {
        return match ($type) {
            'mock' => app(MockProvider::class),
            'dahua' => app(DahuaProvider::class),
            default => throw new \RuntimeException("Unsupported CCTV provider: {$type}"),
        };
    }

    public function createMock(): MockProvider
    {
        $provider = app(MockProvider::class);
        return $provider;
    }

    public function availableProviders(): array
    {
        return [
            'mock' => 'Mock Provider (Development)',
            'dahua' => 'Dahua DVR/NVR (Production)',
        ];
    }
}
