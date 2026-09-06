<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ActivityLogController extends Controller
{
    public function index(Request $request): Response
    {
        $query = ActivityLog::with('user');

        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        if ($request->filled('module')) {
            $query->where('module', $request->module);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $logs = $query->latest()->paginate(30);

        $actions = ActivityLog::select('action')->distinct()->pluck('action');
        $modules = ActivityLog::select('module')->distinct()->pluck('module');

        return Inertia::render('activity-logs/index', [
            'logs' => $logs,
            'actions' => $actions,
            'modules' => $modules,
            'filters' => $request->only(['action', 'module', 'date_from', 'date_to']),
        ]);
    }
}
