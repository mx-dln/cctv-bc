<?php

namespace App\Contracts;

use Illuminate\Support\Collection;

interface CctvProviderInterface
{
    public function connect(array $config): bool;
    public function verifyConnection(): array;
    public function getCameras(): Collection;
    public function getEvents(array $params = []): Collection;
    public function getEvent(string $eventId): ?array;
    public function getRecordings(array $params = []): Collection;
    public function getStatus(): array;
    public function getUsers(): Collection;
    public function getSnapshots(string $eventId): ?string;
    public function getHealth(): array;
    public function normalizeEvent(array $rawEvent): array;
    public function getProviderInfo(): array;
    public function getProviderName(): string;
}
