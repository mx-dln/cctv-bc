<?php

namespace App\Http\Controllers;

use App\Http\Requests\GenerateReportRequest;
use App\Models\AuditReport;
use App\Models\Camera;
use App\Models\GeneratedLog;
use App\Services\ActivityLoggerService;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Inertia\Inertia;
use Inertia\Response;

class AuditController extends Controller
{
    private AuditService $auditService;
    private ActivityLoggerService $logger;

    public function __construct(AuditService $auditService, ActivityLoggerService $logger)
    {
        $this->auditService = $auditService;
        $this->logger = $logger;
    }

    public function index(): Response
    {
        try {
            $reports = AuditReport::with('user')->latest()->paginate(10);
            $recentLogs = GeneratedLog::with(['camera', 'hashRecord.blockchainTransaction', 'registeredBy'])
                ->latest('updated_at')
                ->limit(10)
                ->get();

            $stats = [
                'total' => GeneratedLog::count(),
                'verified' => GeneratedLog::where('status', 'verified')->count(),
                'tampered' => GeneratedLog::where('status', 'tampered')->count(),
                'pending' => GeneratedLog::whereIn('status', ['pending', 'registered'])->count(),
            ];
        } catch (\Throwable $exception) {
            report($exception);

            $reports = new LengthAwarePaginator([], 0, 10);
            $recentLogs = collect();
            $stats = [
                'total' => 0,
                'verified' => 0,
                'tampered' => 0,
                'pending' => 0,
            ];
        }

        return Inertia::render('audit/index', [
            'reports' => $reports,
            'recentLogs' => $recentLogs,
            'stats' => $stats,
        ]);
    }

    public function logs(Request $request): Response
    {
        $query = GeneratedLog::with(['camera', 'hashRecord.blockchainTransaction', 'registeredBy']);

        if ($request->filled('date_from')) {
            $query->whereDate('started_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('started_at', '<=', $request->date_to);
        }

        if ($request->filled('camera_id')) {
            $query->where('camera_id', $request->camera_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('event_id', 'like', "%{$search}%")
                  ->orWhere('label', 'like', "%{$search}%")
                  ->orWhere('event_type', 'like', "%{$search}%");
            });
        }

        $logs = $query->latest()->paginate(20)->withQueryString();

        $cameras = Camera::select('id', 'name', 'provider_camera_id')->get();

        return Inertia::render('audit/logs', [
            'logs' => $logs,
            'cameras' => $cameras,
            'filters' => $request->only(['date_from', 'date_to', 'camera_id', 'status', 'search']),
        ]);
    }

    public function generateReport(GenerateReportRequest $request): JsonResponse
    {
        $report = $this->auditService->generateReport(
            user: $request->user(),
            title: $request->title,
            type: $request->type ?? 'verification',
            filters: $request->only(['date_from', 'date_to', 'camera_id', 'status', 'operator', 'search']),
            format: $request->format ?? 'pdf'
        );

        $this->logger->logReportExport($request->user(), [
            'report_id' => $report->report_id,
            'format' => $request->format,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Report generated successfully.',
            'report' => $report,
        ]);
    }

    public function downloadReport(AuditReport $report)
    {
        if (!$report->file_path) {
            return back()->with('error', 'Report file not found.');
        }

        $this->logger->logReportExport(request()->user(), ['report_id' => $report->report_id, 'result' => 'download']);
        return \Illuminate\Support\Facades\Storage::download($report->file_path);
    }
}
