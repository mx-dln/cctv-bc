<?php

namespace App\Services;

use App\Models\GeneratedLog;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CctvRecordService
{
    public function __construct(
        private HashService $hashService,
        private BlockchainService $blockchainService,
        private ActivityLoggerService $activityLogger,
        private EvidenceCustodyService $custodyService,
    ) {}

    public function register(array $data, User $user): array
    {
        return DB::transaction(function () use ($data, $user) {
            $file = $data['footage'] ?? null;
            $storedPath = $file instanceof UploadedFile
                ? $file->store('private-cctv', 'local')
                : ($data['recording_url'] ?? null);

            $log = GeneratedLog::create([
                'event_id' => $data['event_id'] ?? (string) Str::uuid(),
                'camera_id' => $data['camera_id'],
                'event_type' => $data['event_type'] ?? 'cctv_registration',
                'label' => $data['label'] ?? 'Registered CCTV footage',
                'started_at' => $data['recorded_at'] ?? now(),
                'ended_at' => $data['ended_at'] ?? null,
                'duration' => $data['duration'] ?? null,
                'score' => 0,
                'top_score' => 0,
                'snapshot_url' => $data['snapshot_url'] ?? null,
                'recording_url' => $storedPath,
                'recording_info' => $data['recording_info'] ?? null,
                'filename' => $file instanceof UploadedFile ? $file->getClientOriginalName() : ($data['filename'] ?? null),
                'resolution' => $data['resolution'] ?? null,
                'metadata' => $data['metadata'] ?? [],
                'status' => 'registered',
                'registered_by' => $user->id,
                'registered_at' => now(),
            ]);

            $log->refresh();
            $hashRecord = $this->hashService->generateHash($log);
            $transaction = $this->blockchainService->commitHash($log, $hashRecord->hash_value);

            $context = [
                'record_id' => $log->record_id,
                'event_id' => $log->event_id,
                'transaction_id' => $transaction->transaction_id,
                'hash' => $hashRecord->hash_value,
            ];

            $this->activityLogger->log('register_cctv', 'custody', $user, 'CCTV record registered', $context);
            $this->activityLogger->logHashGeneration($user, $context);
            $this->activityLogger->log('blockchain_submission', 'blockchain', $user,
                'Transaction status: ' . $transaction->status, $context + ['status' => $transaction->status, 'simulated' => $transaction->response['simulated'] ?? false]);
            if ($transaction->status !== 'committed') {
                $log->update(['status' => 'pending']);
            }
            $this->custodyService->recordCreated($log, $user);

            return [
                'record' => $log->fresh(['camera', 'hashRecord', 'hashRecord.blockchainTransaction', 'registeredBy']),
                'hash' => $hashRecord,
                'transaction' => $transaction,
            ];
        });
    }

    public function footageAvailable(GeneratedLog $log): bool
    {
        if (!$log->recording_url) {
            return false;
        }

        if (Str::contains($log->recording_url, '://')) {
            return false;
        }

        return app(FootageStorage::class)->exists($log->recording_url);
    }

    public function retryBlockchainCommit(GeneratedLog $log, User $user): array
    {
        $log->loadMissing(['hashRecord', 'hashRecord.blockchainTransaction']);

        if (!$log->hashRecord) {
            $this->hashService->generateHash($log);
            $log->load('hashRecord');
        }

        $transaction = $this->blockchainService->commitHash($log, $log->hashRecord->hash_value);

        $context = [
            'record_id' => $log->record_id,
            'event_id' => $log->event_id,
            'transaction_id' => $transaction->transaction_id,
            'status' => $transaction->status,
        ];

        $this->activityLogger->log('blockchain_retry', 'blockchain', $user,
            'Blockchain transaction retry: ' . $transaction->status, $context);

        $log->update(['status' => $transaction->status === 'committed' ? 'registered' : 'pending']);

        return [
            'record' => $log->fresh(['camera', 'hashRecord', 'hashRecord.blockchainTransaction', 'registeredBy']),
            'transaction' => $transaction,
        ];
    }
}
