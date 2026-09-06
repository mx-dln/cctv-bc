<?php

namespace App\Services;

use App\Models\BlockchainTransaction;
use App\Models\GeneratedLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

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
        $this->simulateMode = config('chainofcustody.blockchain.simulate', !$this->isAvailable());
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
            sleep(0.1);
            $blockNumber = (string) rand(100000, 999999);
            $tx->update([
                'status' => 'committed',
                'block_number' => $blockNumber,
                'response' => [
                    'block_number' => $blockNumber,
                    'transaction_id' => $tx->transaction_id,
                    'simulated' => true,
                ],
                'committed_at' => now(),
            ]);
            Log::info("Blockchain commit simulated for event {$log->event_id}");
        } else {
            try {
                $response = $this->submitTransaction('CommitCCTVCustodyLog', [
                    'event_id' => $log->event_id,
                    'camera_id' => $log->camera->provider_camera_id ?? $log->camera_id,
                    'timestamp' => $log->started_at?->toIso8601String(),
                    'hash' => $hash,
                    'event_type' => $log->event_type,
                ]);

                $tx->update([
                    'status' => 'committed',
                    'response' => $response,
                    'block_number' => $response['block_number'] ?? null,
                    'committed_at' => now(),
                ]);
            } catch (\Exception $e) {
                $tx->update([
                    'status' => 'pending',
                    'error_message' => 'Blockchain network unavailable. Transaction queued for later commit.',
                ]);
                Log::warning('Blockchain commit failed (queued): ' . $e->getMessage());
            }
        }

        return $tx->fresh();
    }

    public function verifyHash(string $eventId, string $hash): array
    {
        if ($this->simulateMode) {
            return [
                'verified' => true,
                'blockchain_hash' => $hash,
                'block_number' => (string) rand(100000, 999999),
                'transaction_id' => 'SIM-' . strtoupper(substr($eventId, 0, 16)),
                'simulated' => true,
            ];
        }

        try {
            $response = $this->queryChaincode('QueryCCTVCustodyLog', ['event_id' => $eventId]);

            if (isset($response['hash']) && $response['hash'] === $hash) {
                return [
                    'verified' => true,
                    'blockchain_hash' => $response['hash'],
                    'block_number' => $response['block_number'] ?? null,
                    'transaction_id' => $response['transaction_id'] ?? null,
                ];
            }

            return [
                'verified' => false,
                'blockchain_hash' => $response['hash'] ?? null,
                'message' => 'Hash mismatch or event not found on blockchain.',
            ];
        } catch (\Exception $e) {
            Log::error('Blockchain verification failed: ' . $e->getMessage());
            return [
                'verified' => false,
                'blockchain_hash' => null,
                'message' => 'Blockchain unavailable: ' . $e->getMessage(),
            ];
        }
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
}
