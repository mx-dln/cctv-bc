<?php

namespace App\Services;

use App\Models\EvidenceRecord;
use App\Models\GeneratedLog;
use App\Models\User;

class EvidenceCustodyService
{
    public const ACTIONS = [
        'evidence_created', 'evidence_verified', 'evidence_viewed',
        'evidence_exported', 'evidence_printed', 'evidence_investigated',
        'evidence_archived', 'evidence_reopened',
    ];

    public function record(
        GeneratedLog $event,
        string $action,
        ?User $user = null,
        ?string $remarks = null,
        array $metadata = []
    ): EvidenceRecord {
        return EvidenceRecord::create([
            'event_id' => $event->id,
            'user_id' => $user?->id,
            'action' => $action,
            'role' => $user?->getRoleNames()->first(),
            'remarks' => $remarks,
            'metadata' => $metadata,
        ]);
    }

    public function recordCreated(GeneratedLog $event, ?User $user = null): EvidenceRecord
    {
        return $this->record($event, 'evidence_created', $user, 'CCTV event recorded and hashed');
    }

    public function recordVerified(GeneratedLog $event, ?User $user = null, array $result = []): EvidenceRecord
    {
        return $this->record($event, 'evidence_verified', $user,
            'Verification: ' . ($result['status'] ?? 'pending'),
            ['verification_result' => $result]
        );
    }

    public function recordViewed(GeneratedLog $event, ?User $user = null): EvidenceRecord
    {
        return $this->record($event, 'evidence_viewed', $user, 'Event details accessed');
    }

    public function recordExported(GeneratedLog $event, ?User $user = null, string $format = 'pdf'): EvidenceRecord
    {
        return $this->record($event, 'evidence_exported', $user, "Exported as {$format}");
    }

    public function recordInvestigated(GeneratedLog $event, ?User $user = null, string $notes = ''): EvidenceRecord
    {
        return $this->record($event, 'evidence_investigated', $user, $notes ?: 'Forensic investigation performed');
    }

    public function getTimeline(?array $filters = []): array
    {
        $query = EvidenceRecord::with(['event.camera', 'user'])
            ->latest();

        if (!empty($filters['date_from'])) $query->whereDate('created_at', '>=', $filters['date_from']);
        if (!empty($filters['date_to'])) $query->whereDate('created_at', '<=', $filters['date_to']);
        if (!empty($filters['action'])) $query->where('action', $filters['action']);
        if (!empty($filters['user_id'])) $query->where('user_id', $filters['user_id']);
        if (!empty($filters['event_id'])) $query->where('event_id', $filters['event_id']);

        return $query->paginate(30)->toArray();
    }

    public function getStats(): array
    {
        return [
            'total_records' => EvidenceRecord::count(),
            'unique_events' => EvidenceRecord::distinct('event_id')->count('event_id'),
            'unique_users' => EvidenceRecord::whereNotNull('user_id')->distinct('user_id')->count('user_id'),
            'action_counts' => EvidenceRecord::selectRaw('action, count(*) as count')
                ->groupBy('action')->pluck('count', 'action')->toArray(),
        ];
    }
}
