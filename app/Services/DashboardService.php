<?php

namespace App\Services;

use App\Models\Alert;
use App\Models\BlockchainTransaction;
use App\Models\Camera;
use App\Models\GeneratedLog;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    public function getStats(): array
    {
        return [
            'total_cameras' => Camera::count(),
            'online_cameras' => Camera::where('status', 'online')->count(),
            'offline_cameras' => Camera::where('status', 'offline')->count(),
            'disconnected_cameras' => Camera::where('status', 'disconnected')->count(),
            'events_today' => GeneratedLog::whereDate('started_at', today())->count(),
            'total_events' => GeneratedLog::count(),
            'verified_events' => GeneratedLog::where('status', 'verified')->count(),
            'tampered_events' => GeneratedLog::where('status', 'tampered')->count(),
            'pending_events' => GeneratedLog::where('status', 'pending')->count(),
            'blockchain_transactions' => BlockchainTransaction::count(),
            'successful_transactions' => BlockchainTransaction::where('status', 'committed')->count(),
            'failed_transactions' => BlockchainTransaction::where('status', 'failed')->count(),
            'active_alerts' => Alert::where('is_read', false)->count(),
            'critical_alerts' => Alert::where('is_read', false)->where('severity', 'critical')->count(),
        ];
    }

    public function getDailyEvents(int $days = 7): array
    {
        return GeneratedLog::select(
            DB::raw("DATE(started_at) as date"),
            DB::raw("COUNT(*) as total"),
            DB::raw("SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) as verified"),
            DB::raw("SUM(CASE WHEN status = 'tampered' THEN 1 ELSE 0 END) as tampered")
        )
            ->where('started_at', '>=', now()->subDays($days))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->toArray();
    }

    public function getVerificationTrend(int $days = 30): array
    {
        return GeneratedLog::select(
            DB::raw("DATE(started_at) as date"),
            DB::raw("SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) as verified_count"),
            DB::raw("SUM(CASE WHEN status = 'tampered' THEN 1 ELSE 0 END) as tampered_count")
        )
            ->where('started_at', '>=', now()->subDays($days))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->toArray();
    }

    public function getTamperTrend(int $days = 30): array
    {
        return GeneratedLog::select(
            DB::raw("DATE(started_at) as date"),
            DB::raw("COUNT(*) as tampered_count")
        )
            ->where('started_at', '>=', now()->subDays($days))
            ->where('status', 'tampered')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->toArray();
    }

    public function getBlockchainCommitTrend(int $days = 7): array
    {
        return BlockchainTransaction::select(
            DB::raw("DATE(created_at) as date"),
            DB::raw("COUNT(*) as total"),
            DB::raw("SUM(CASE WHEN status = 'committed' THEN 1 ELSE 0 END) as committed")
        )
            ->where('created_at', '>=', now()->subDays($days))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->toArray();
    }

    public function getRecentEvents(int $limit = 10): array
    {
        return GeneratedLog::with('camera')
            ->latest()
            ->take($limit)
            ->get()
            ->toArray();
    }

    public function getRecentAlerts(int $limit = 5): array
    {
        return Alert::where('is_read', false)
            ->latest()
            ->take($limit)
            ->get()
            ->toArray();
    }

    public function getCameraStatuses(): array
    {
        return Camera::select('id', 'provider_camera_id', 'name', 'location', 'status')
            ->get()
            ->toArray();
    }
}
