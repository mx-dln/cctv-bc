<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\User;

class ActivityLoggerService
{
    public function log(
        string $action,
        string $module,
        ?User $user = null,
        ?string $description = null,
        array $properties = []
    ): ActivityLog {
        return ActivityLog::create([
            'user_id' => $user?->id,
            'action' => $action,
            'module' => $module,
            'description' => $description,
            'properties' => $properties,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }

    public function logLogin(User $user): ActivityLog
    {
        return $this->log('login', 'auth', $user, 'User logged in');
    }

    public function logLogout(User $user): ActivityLog
    {
        return $this->log('logout', 'auth', $user, 'User logged out');
    }

    public function logHashGeneration(User $user, array $context = []): ActivityLog
    {
        return $this->log('hash_generated', 'hashing', $user, 'Hash generated for CCTV log', $context);
    }

    public function logBlockchainCommit(User $user, array $context = []): ActivityLog
    {
        return $this->log('blockchain_commit', 'blockchain', $user, 'Hash committed to blockchain', $context);
    }

    public function logVerification(User $user, array $context = []): ActivityLog
    {
        return $this->log('verification', 'verification', $user, 'Log verification performed', $context);
    }

    public function logTamperDetection(?User $user, array $context = []): ActivityLog
    {
        return $this->log('tamper_detected', 'security', $user, 'Tampering detected in CCTV log', $context);
    }

    public function logReportExport(User $user, array $context = []): ActivityLog
    {
        return $this->log('report_export', 'audit', $user, 'Audit report exported', $context);
    }
}
