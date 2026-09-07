<?php

namespace App\Http\Controllers;

use App\Models\Alert;
use App\Services\AlertService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AlertController extends Controller
{
    private AlertService $alertService;

    public function __construct(AlertService $alertService)
    {
        $this->alertService = $alertService;
    }

    public function index(Request $request): Response
    {
        $query = Alert::with('resolver');

        if ($request->filled('severity')) {
            $query->where('severity', $request->severity);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('status') && $request->status === 'unresolved') {
            $query->whereNull('resolved_at');
        }
        if ($request->input('status') === 'resolved') {
            $query->whereNotNull('resolved_at');
        }

        $alerts = $query->latest()->paginate(20);

        return Inertia::render('alerts/index', [
            'alerts' => $alerts,
            'filters' => $request->only(['severity', 'type', 'status']),
        ]);
    }

    public function resolve(Alert $alert): JsonResponse
    {
        $this->alertService->resolveAlert($alert, request()->user());

        return response()->json([
            'success' => true,
            'message' => 'Alert resolved.',
        ]);
    }

    public function dismiss(Alert $alert): JsonResponse
    {
        $alert->update(['is_read' => true, 'read_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Alert dismissed.',
        ]);
    }

    public function unreadCount(): JsonResponse
    {
        return response()->json([
            'count' => Alert::where('is_read', false)->count(),
            'critical' => Alert::where('is_read', false)->where('severity', 'critical')->count(),
        ]);
    }
}
