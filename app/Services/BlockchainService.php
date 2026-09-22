<?php

namespace App\Services;

use App\Models\BlockchainTransaction;
use App\Models\GeneratedLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class BlockchainService
{
    private string $peerEndpoint;
    private string $channelName;
    private string $chaincodeName;
    private bool $simulateMode;

    public function __construct()
    {
        $this->peerEndpoint = config('chainofcustody.blockchain.peer_endpoint', 'localhost:7051');
        $this->channelName = config('chainofcustody.blockchain.channel_name', 'cctv-channel');
        $this->chaincodeName = config('chainofcustody.blockchain.chaincode_name', 'cctv-chaincode');
        $this->simulateMode = (bool) config('chainofcustody.blockchain.simulate', false);
    }

    public function commitHash(GeneratedLog $log, string $hash): BlockchainTransaction
    {
        $tx = BlockchainTransaction::create([
            'log_id' => $log->id,
            'channel' => $this->channelName,
            'chaincode' => $this->chaincodeName,
            'status' => 'pending',
        ]);

        if ($this->simulateMode) {
            $blockNumber = (string) rand(100000, 999999);
            $tx->update([
                'status' => 'committed',
                'block_number' => $blockNumber,
                'response' => [
                    'block_number' => $blockNumber,
                    'transaction_id' => $tx->transaction_id,
                    'simulated' => true,
                    'hash' => $hash,
                ],
                'committed_at' => now(),
            ]);
            Log::info("Blockchain commit simulated for event {$log->event_id}");
        } else {
            try {
                $response = $this->submitTransaction('CommitCCTVCustodyLog', [
                    'record_id' => $log->record_id,
                    'event_id' => $log->event_id,
                    'camera_id' => $log->camera->provider_camera_id ?? $log->camera_id,
                    'timestamp' => $log->started_at?->toIso8601String(),
                    'hash' => $hash,
                    'event_type' => $log->event_type,
                    'metadata' => $log->metadata ?? [],
                    'filename' => (string) $log->filename,
                    'recording_reference' => (string) $log->recording_url,
                    'registered_at' => $log->registered_at?->toIso8601String(),
                    'registered_by' => (string) $log->registered_by,
                    'status' => 'registered',
                ]);

                if (empty($response['transaction_id']) || ($response['status'] ?? null) !== 'committed') {
                    throw new \RuntimeException('Gateway did not confirm a committed transaction.');
                }

                $tx->update([
                    'status' => 'committed',
                    'response' => $response,
                    'transaction_id' => $response['transaction_id'],
                    'block_number' => $response['block_number'] ?? null,
                    'committed_at' => now(),
                ]);
            } catch (\Exception $e) {
                if ($this->reconcileExistingRecord($tx, $log, $hash, $e)) {
                    return $tx->fresh();
                }

                if ($this->resubmitWithFreshRecordId($tx, $log, $hash, $e)) {
                    return $tx->fresh();
                }

                $tx->update([
                    'status' => 'pending',
                    'error_message' => 'Blockchain commit not confirmed. Registration requires a retry.',
                ]);
                Log::warning('Blockchain commit failed (queued): ' . $e->getMessage());
            }
        }

        return $tx->fresh();
    }

    public function verifyHash(string $recordId, string $hash, ?string $eventId = null): array
    {
        if ($this->simulateMode) {
            $tx = BlockchainTransaction::whereHas('log', fn ($query) => $query
                    ->where('record_id', $recordId)
                    ->orWhere('event_id', $eventId ?? $recordId)
                )
                ->where('status', 'committed')->latest('id')->first();
            $original = $tx?->response['hash'] ?? null;
            return [
                'verified' => is_string($original) && hash_equals($original, $hash),
                'available' => is_string($original),
                'blockchain_hash' => $original,
                'block_number' => $tx?->block_number,
                'transaction_id' => $tx?->transaction_id,
                'simulated' => true,
            ];
        }

        try {
            $response = $this->queryChaincode('QueryCCTVCustodyLog', [
                'record_id' => $recordId,
                'event_id' => $eventId,
            ]);

            if (isset($response['hash']) && $response['hash'] === $hash) {
                return [
                    'verified' => true,
                    'available' => true,
                    'blockchain_hash' => $response['hash'],
                    'block_number' => $response['block_number'] ?? null,
                    'transaction_id' => $response['transaction_id'] ?? null,
                ];
            }

            return [
                'verified' => false,
                'blockchain_hash' => $response['hash'] ?? null,
                'available' => isset($response['hash']),
                'message' => 'Hash mismatch or event not found on blockchain.',
            ];
        } catch (\Exception $e) {
            Log::error('Blockchain verification failed: ' . $e->getMessage());
            return [
                'verified' => false,
                'blockchain_hash' => null,
                'available' => false,
                'message' => 'Blockchain unavailable: ' . $e->getMessage(),
            ];
        }
    }

    public function recordVerification(GeneratedLog $log, string $hash, array $verification, string $mode = 'stored_original'): BlockchainTransaction
    {
        $available = (bool) ($verification['available'] ?? false);
        $verified = (bool) ($verification['verified'] ?? false);

        return BlockchainTransaction::create([
            'log_id' => $log->id,
            'channel' => $this->channelName,
            'chaincode' => $this->chaincodeName,
            'status' => $available ? 'committed' : 'failed',
            'block_number' => $verification['block_number'] ?? null,
            'response' => [
                'operation' => 'verification',
                'function' => 'QueryCCTVCustodyLog',
                'mode' => $mode,
                'record_id' => $log->record_id,
                'event_id' => $log->event_id,
                'checked_hash' => $hash,
                'blockchain_hash' => $verification['blockchain_hash'] ?? null,
                'verification_status' => $verified ? 'verified' : 'mismatch',
                'available' => $available,
                'message' => $verification['message'] ?? null,
                'fabric_transaction_id' => $verification['transaction_id'] ?? null,
                'simulated' => $verification['simulated'] ?? false,
            ],
            'error_message' => $available ? null : ($verification['message'] ?? 'Blockchain verification unavailable.'),
            'committed_at' => now(),
        ]);
    }

    public function retrieveTransaction(string $transactionId): ?array
    {
        if ($this->simulateMode) {
            return ['transaction_id' => $transactionId, 'simulated' => true];
        }
        try {
            return $this->queryChaincode('QueryTransaction', ['transaction_id' => $transactionId]);
        } catch (\Exception $e) {
            Log::error('Blockchain retrieval failed: ' . $e->getMessage());
            return null;
        }
    }

    public function retrieveBlock(string $blockNumber): ?array
    {
        if ($this->simulateMode) {
            return ['block_number' => $blockNumber, 'simulated' => true];
        }
        try {
            return $this->queryChaincode('QueryBlock', ['block_number' => $blockNumber]);
        } catch (\Exception $e) {
            Log::error('Block retrieval failed: ' . $e->getMessage());
            return null;
        }
    }

    public function getLedgerStatus(): array
    {
        if ($this->simulateMode) {
            return [
                'available' => true,
                'block_height' => rand(1000, 9999),
                'current_block_hash' => str_repeat('a', 64),
                'channel' => $this->channelName,
                'simulated' => true,
            ];
        }

        try {
            $info = $this->queryChaincode('GetLedgerInfo', []);
            return [
                'available' => true,
                'block_height' => $info['block_height'] ?? 0,
                'current_block_hash' => $info['current_block_hash'] ?? null,
                'channel' => $this->channelName,
            ];
        } catch (\Exception $e) {
            return [
                'available' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    public function isAvailable(): bool
    {
        try {
            $response = Http::timeout(3)->get("http://{$this->peerEndpoint}/health");
            return $response->successful();
        } catch (\Exception $e) {
            return false;
        }
    }

    public function isSimulateMode(): bool
    {
        return $this->simulateMode;
    }

    private function submitTransaction(string $function, array $args): array
    {
        $payload = [
            'channel' => $this->channelName,
            'chaincode' => $this->chaincodeName,
            'function' => $function,
            'args' => [$args],
        ];

        $response = Http::timeout(10)
            ->post("http://{$this->peerEndpoint}/chaincode/invoke", $payload);

        if ($response->failed()) {
            throw new \RuntimeException('Blockchain submit failed: ' . $response->body());
        }

        return $response->json();
    }

    private function queryChaincode(string $function, array $args): array
    {
        $payload = [
            'channel' => $this->channelName,
            'chaincode' => $this->chaincodeName,
            'function' => $function,
            'args' => [$args],
        ];

        $response = Http::timeout(10)
            ->post("http://{$this->peerEndpoint}/chaincode/query", $payload);

        if ($response->failed()) {
            throw new \RuntimeException('Blockchain query failed: ' . $response->body());
        }

        return $response->json();
    }

    private function reconcileExistingRecord(BlockchainTransaction $tx, GeneratedLog $log, string $hash, \Exception $exception): bool
    {
        if (!str_contains($exception->getMessage(), 'already exists')) {
            return false;
        }

        try {
            $existing = $this->queryChaincode('QueryCCTVCustodyLog', [
                'record_id' => $log->record_id,
                'event_id' => $log->event_id,
            ]);

            if (isset($existing['hash']) && $existing['hash'] !== $hash) {
                return false;
            }

            $tx->update([
                'status' => 'committed',
                'response' => [
                    ...$existing,
                    'reconciled_existing_record' => true,
                    'message' => 'Fabric already contained this custody record; local transaction was reconciled.',
                ],
                'transaction_id' => $existing['transaction_id'] ?? $tx->transaction_id,
                'block_number' => $existing['block_number'] ?? null,
                'error_message' => null,
                'committed_at' => now(),
            ]);

            Log::info("Blockchain commit reconciled for existing record {$log->record_id}");

            return true;
        } catch (\Exception $queryException) {
            Log::warning('Blockchain duplicate reconciliation failed: ' . $queryException->getMessage());

            return false;
        }
    }

    private function resubmitWithFreshRecordId(BlockchainTransaction $tx, GeneratedLog $log, string $hash, \Exception $exception): bool
    {
        if (!str_contains($exception->getMessage(), 'already exists')) {
            return false;
        }

        $oldRecordId = $log->record_id;
        $newRecordId = 'CCTV-' . now()->format('YmdHis') . '-' . strtoupper(Str::random(4));
        $log->forceFill(['record_id' => $newRecordId])->saveQuietly();

        try {
            $response = $this->submitTransaction('CommitCCTVCustodyLog', [
                'record_id' => $log->record_id,
                'event_id' => $log->event_id,
                'camera_id' => $log->camera->provider_camera_id ?? $log->camera_id,
                'timestamp' => $log->started_at?->toIso8601String(),
                'hash' => $hash,
                'event_type' => $log->event_type,
                'metadata' => $log->metadata ?? [],
                'filename' => (string) $log->filename,
                'recording_reference' => (string) $log->recording_url,
                'registered_at' => $log->registered_at?->toIso8601String(),
                'registered_by' => (string) $log->registered_by,
                'status' => 'registered',
            ]);

            if (empty($response['transaction_id']) || ($response['status'] ?? null) !== 'committed') {
                return false;
            }

            $tx->update([
                'status' => 'committed',
                'response' => [
                    ...$response,
                    'record_id_conflict_resolved' => true,
                    'old_record_id' => $oldRecordId,
                    'new_record_id' => $newRecordId,
                ],
                'transaction_id' => $response['transaction_id'],
                'block_number' => $response['block_number'] ?? null,
                'error_message' => null,
                'committed_at' => now(),
            ]);

            Log::info("Blockchain record ID conflict resolved: {$oldRecordId} -> {$newRecordId}");

            return true;
        } catch (\Exception $retryException) {
            $log->forceFill(['record_id' => $oldRecordId])->saveQuietly();
            Log::warning('Blockchain conflict resubmit failed: ' . $retryException->getMessage());

            return false;
        }
    }
}
