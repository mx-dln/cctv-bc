<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthorizeCustodyAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $write = !$request->isMethod('GET');
        $permission = match ($request->segment(1)) {
            'dashboard' => 'view-dashboard',
            'cameras' => $write || in_array($request->segment(2), ['create']) || $request->segment(3) === 'edit' ? 'manage-cameras' : 'view-cameras',
            'custody-records' => $write ? 'manage-verification' : 'view-verification',
            'verification' => $write ? 'manage-verification' : 'view-verification',
            'blockchain' => 'view-blockchain',
            'audit' => $write ? 'manage-audit' : 'view-audit',
            'alerts' => $write ? 'manage-alerts' : 'view-alerts',
            'settings' => 'manage-settings',
            default => null,
        };
        abort_unless($permission && $request->user()?->can($permission), 403);

        return $next($request);
    }
}
