<?php

namespace App\Services;

use App\Models\GeneratedLog;
use App\Models\HashRecord;
use Illuminate\Support\Facades\DB;

class HashService
{
    public function generateHash(GeneratedLog $log): HashRecord
    {
        $startTime = microtime(true);

        $payload = $this->buildPayload($log);
        $hashValue = $this->computeHash($payload);
        $previousHash = $this->getLastHash();
        $chainIndex = $this->getNextChainIndex();

        $duration = (int) ((microtime(true) - $startTime) * 1000);

        $hashRecord = HashRecord::create([
            'log_id' => $log->id,
            'algorithm' => 'sha256',
            'hash_value' => $hashValue,
            'previous_hash' => $previousHash,
            'hash_chain_index' => $chainIndex,
            'hashed_payload' => $payload,
            'hash_duration_ms' => $duration,
        ]);

        return $hashRecord;
    }

    public function verifyHash(GeneratedLog $log): array
    {
        $hashRecord = $log->hashRecord;

        if (!$hashRecord) {
            return [
                'verified' => false,
                'status' => 'no_hash',
                'message' => 'No hash record found for this event.',
            ];
        }

        $currentPayload = $this->buildPayload($log);
        $currentHash = $this->computeHash($currentPayload);
        $isMatch = $currentHash === $hashRecord->hash_value;

        return [
            'verified' => $isMatch,
            'status' => $isMatch ? 'verified' : 'tampered',
            'current_hash' => $currentHash,
            'original_hash' => $hashRecord->hash_value,
            'previous_hash' => $hashRecord->previous_hash,
            'chain_index' => $hashRecord->hash_chain_index,
            'original_payload' => $hashRecord->hashed_payload,
            'current_payload' => $currentPayload,
            'hashed_at' => $hashRecord->created_at,
            'hash_duration_ms' => $hashRecord->hash_duration_ms,
        ];
    }

    public function extractTamperDetails(GeneratedLog $log): array
    {
        $result = $this->verifyHash($log);
        if ($result['verified']) {
            return ['differences' => []];
        }

        $differences = [];
        $original = $result['original_payload'] ?? [];
        $current = $result['current_payload'] ?? [];

        foreach ($current as $key => $value) {
            $origVal = $original[$key] ?? null;
            if ($origVal !== $value) {
                $differences[$key] = [
                    'original' => $origVal,
                    'current' => $value,
                ];
            }
        }

        return [
            'differences' => $differences,
            'original_hash' => $result['original_hash'],
            'current_hash' => $result['current_hash'],
        ];
    }

    public function getChain(): array
    {
        return HashRecord::orderBy('hash_chain_index')->get()->toArray();
    }

    public function validateChain(): array
    {
        $hashes = HashRecord::orderBy('hash_chain_index')->get();
        $brokenLinks = [];

        foreach ($hashes as $i => $hash) {
            if ($i === 0) continue;
            $prev = $hashes[$i - 1];
            if ($hash->previous_hash !== $prev->hash_value) {
                $brokenLinks[] = [
                    'index' => $hash->hash_chain_index,
                    'expected' => $prev->hash_value,
                    'actual' => $hash->previous_hash,
                ];
            }
        }

        return [
            'total_links' => $hashes->count(),
            'broken_links' => $brokenLinks,
            'is_intact' => empty($brokenLinks),
        ];
    }

    private function buildPayload(GeneratedLog $log): array
    {
        return [
            'event_id' => $log->event_id,
            'camera_id' => $log->camera->provider_camera_id ?? $log->camera_id,
            'event_type' => $log->event_type,
            'label' => $log->label,
            'started_at' => $log->started_at?->toIso8601String(),
            'ended_at' => $log->ended_at?->toIso8601String(),
            'duration' => $log->duration,
            'score' => $log->score,
            'snapshot_url' => $log->snapshot_url,
            'recording_url' => $log->recording_url,
            'zones' => $log->zones,
        ];
    }

    private function computeHash(array $data): string
    {
        ksort($data);
        return hash('sha256', json_encode($data, JSON_UNESCAPED_SLASHES));
    }

    private function getLastHash(): string
    {
        $last = HashRecord::latest('hash_chain_index')->first();
        return $last ? $last->hash_value : str_repeat('0', 64);
    }

    private function getNextChainIndex(): int
    {
        return HashRecord::max('hash_chain_index') + 1;
    }
}
