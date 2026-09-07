<?php

namespace App\Services;

use App\Models\Alert;
use App\Models\GeneratedLog;
use App\Models\User;

class AlertService
{
    public function createTamperAlert(GeneratedLog $log): Alert
    {
        return $this->createAlert(
            'tamper_detected',
            'critical',
            'Tampering detected on event ' . $log->event_id .
                ' (Camera: ' . ($log->camera->name ?? 'Unknown') . ')',
            $log,
            [
                'event_id' => $log->event_id,
                'camera_id' => $log->camera->provider_camera_id ?? null,
                'camera_name' => $log->camera->name ?? null,
                'event_type' => $log->event_type,
                'started_at' => $log->started_at?->toIso8601String(),
            ]
        );
    }

    public function createMissingHashAlert(GeneratedLog $log): Alert
    {
        return $this->createAlert(
            'missing_hash',
            'high',
            'Missing hash record for event ' . $log->event_id,
            $log
        );
    }

    public function createMissingFootageAlert(GeneratedLog $log): Alert
    {
        return $this->createAlert(
            'missing_footage',
            'critical',
            'Missing CCTV footage for record ' . ($log->record_id ?? $log->event_id),
            $log,
            [
                'record_id' => $log->record_id,
                'event_id' => $log->event_id,
                'camera_id' => $log->camera->provider_camera_id ?? null,
                'filename' => $log->filename,
            ]
        );
    }

    public function createBlockchainUnavailableAlert(): Alert
    {
        return $this->createSystemAlert(
            'blockchain_unavailable',
            'critical',
            'Blockchain network is unavailable. Event integrity cannot be verified.'
        );
    }

    public function createCameraOfflineAlert(string $cameraName): Alert
    {
        return $this->createSystemAlert(
            'camera_offline',
            'high',
            "Camera '{$cameraName}' is offline."
        );
    }

    public function createAnomalyAlert(string $description, array $context = []): Alert
    {
        return $this->createSystemAlert(
            'event_anomaly',
            'medium',
            $description,
            $context
        );
    }

    public function createUnauthorizedChangeAlert(string $description, array $context = []): Alert
    {
        return $this->createSystemAlert(
            'unauthorized_change',
            'critical',
            $description,
            $context
        );
    }

    public function createAlert(string $type, string $severity, string $message, GeneratedLog $log, array $context = []): Alert
    {
        return Alert::create([
            'alert_id' => 'ALERT-' . strtoupper(\Illuminate\Support\Str::random(10)),
            'type' => $type,
            'severity' => $severity,
            'message' => $message,
            'context' => $context ?: null,
            'alertable_id' => $log->id,
            'alertable_type' => GeneratedLog::class,
        ]);
    }

    private function createSystemAlert(string $type, string $severity, string $message, array $context = []): Alert
    {
        return Alert::create([
            'alert_id' => 'ALERT-' . strtoupper(\Illuminate\Support\Str::random(10)),
            'type' => $type,
            'severity' => $severity,
            'message' => $message,
            'context' => $context ?: null,
            'alertable_id' => 0,
            'alertable_type' => 'system',
        ]);
    }

    public function resolveAlert(Alert $alert, User $user): Alert
    {
        $alert->update([
            'is_read' => true,
            'read_at' => now(),
            'resolved_by' => $user->id,
            'resolved_at' => now(),
        ]);
        return $alert;
    }
}
