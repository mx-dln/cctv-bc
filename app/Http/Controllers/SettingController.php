<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Services\ActivityLoggerService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    private ActivityLoggerService $logger;

    public function __construct(ActivityLoggerService $logger)
    {
        $this->logger = $logger;
    }

    public function index(): Response
    {
        $settings = Setting::all()->groupBy('group');

        return Inertia::render('settings/index', [
            'settings' => $settings,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'settings' => 'required|array',
        ]);

        foreach ($validated['settings'] as $key => $value) {
            Setting::setValue($key, $value);
        }

        $this->logger->log('settings_updated', 'settings', $request->user(), 'System settings updated');

        return back()->with('success', 'Settings updated successfully.');
    }
}
