<?php

namespace App\Services;

use App\Models\AuditReport;
use App\Models\GeneratedLog;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use Spatie\SimpleExcel\SimpleExcelWriter;

class AuditService
{
    public function generateReport(User $user, string $title, string $type = 'verification', array $filters = [], string $format = 'pdf'): AuditReport
    {
        $query = GeneratedLog::query()->with(['camera', 'hashRecord', 'hashRecord.blockchainTransaction']);

        if (!empty($filters['date_from'])) $query->where('started_at', '>=', $filters['date_from']);
        if (!empty($filters['date_to'])) $query->whereDate('started_at', '<=', $filters['date_to']);
        if (!empty($filters['camera_id'])) $query->where('camera_id', $filters['camera_id']);
        if (!empty($filters['status'])) $query->where('status', $filters['status']);
        if (!empty($filters['label'])) $query->where('label', $filters['label']);

        $logs = $query->get();

        $totalLogs = $logs->count();
        $verifiedCount = $logs->where('status', 'verified')->count();
        $tamperedCount = $logs->where('status', 'tampered')->count();

        $report = AuditReport::create([
            'user_id' => $user->id,
            'title' => $title,
            'type' => $type,
            'filters' => $filters,
            'summary' => [
                'total_logs' => $totalLogs,
                'verified_count' => $verifiedCount,
                'tampered_count' => $tamperedCount,
                'missing_count' => $logs->where('status', 'missing')->count(),
                'verification_rate' => $totalLogs > 0 ? round(($verifiedCount / $totalLogs) * 100, 2) : 0,
                'tamper_rate' => $totalLogs > 0 ? round(($tamperedCount / $totalLogs) * 100, 2) : 0,
            ],
            'total_logs' => $totalLogs,
            'verified_count' => $verifiedCount,
            'tampered_count' => $tamperedCount,
            'status' => 'generated',
            'format' => $format,
            'generated_at' => now(),
        ]);

        if ($format === 'pdf') {
            $this->exportPdf($report, $logs);
        } elseif ($format === 'excel') {
            $this->exportExcel($report, $logs);
        }

        return $report;
    }

    private function exportPdf(AuditReport $report, $logs): void
    {
        $pdf = Pdf::loadView('audit.report', [
            'report' => $report,
            'logs' => $logs,
        ]);
        $filename = "audit_report_{$report->report_id}.pdf";
        Storage::put("reports/{$filename}", $pdf->output());
        $report->update(['file_path' => "reports/{$filename}"]);
    }

    private function exportExcel(AuditReport $report, $logs): void
    {
        $filename = "audit_report_{$report->report_id}.xlsx";
        Storage::makeDirectory('reports');
        $path = Storage::path("reports/{$filename}");

        $writer = SimpleExcelWriter::create($path);
        $writer->addRow(['Event ID', 'Camera', 'Timestamp', 'Event Type', 'Label', 'Duration (s)', 'Score', 'Status', 'Hash']);

        foreach ($logs as $log) {
            $hash = $log->hashRecord;
            $writer->addRow([
                $log->event_id,
                $log->camera->name ?? 'N/A',
                $log->started_at?->toIso8601String(),
                $log->event_type,
                $log->label,
                $log->duration,
                $log->score,
                $log->status,
                $hash ? $hash->hash_value : 'N/A',
            ]);
        }

        $writer->close();
        $report->update(['file_path' => "reports/{$filename}"]);
    }
}
