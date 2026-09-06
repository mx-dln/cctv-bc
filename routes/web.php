<?php

use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\AlertController;
use App\Http\Controllers\AuditController;
use App\Http\Controllers\BlockchainController;
use App\Http\Controllers\CameraController;
use App\Http\Controllers\CctvEventController;
use App\Http\Controllers\CertificateController;
use App\Http\Controllers\CustodyController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ForensicController;
use App\Http\Controllers\ProviderConnectionController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\TamperController;
use App\Http\Controllers\VerificationController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', DashboardController::class)->name('dashboard');

    Route::resource('cameras', CameraController::class);

    Route::prefix('events')->group(function () {
        Route::get('/', [CctvEventController::class, 'index'])->name('events.index');
        Route::get('/{log}', [CctvEventController::class, 'show'])->name('events.show');
    });

    Route::prefix('verification')->group(function () {
        Route::get('/', [VerificationController::class, 'index'])->name('verification.index');
        Route::post('/{log}/check', [VerificationController::class, 'verify'])->name('verification.check');
        Route::get('/{log}', [VerificationController::class, 'show'])->name('verification.show');
    });

    Route::post('/tamper/{log}', [TamperController::class, 'tamper'])->name('tamper.log');

    Route::prefix('blockchain')->group(function () {
        Route::get('/', [BlockchainController::class, 'index'])->name('blockchain.index');
        Route::get('/{transaction}', [BlockchainController::class, 'show'])->name('blockchain.show');
    });

    Route::prefix('audit')->group(function () {
        Route::get('/', [AuditController::class, 'index'])->name('audit.index');
        Route::get('/logs', [AuditController::class, 'logs'])->name('audit.logs');
        Route::post('/generate-report', [AuditController::class, 'generateReport'])->name('audit.generate-report');
        Route::get('/reports/{report}/download', [AuditController::class, 'downloadReport'])->name('audit.reports.download');
    });

    Route::prefix('forensic')->group(function () {
        Route::get('/', [ForensicController::class, 'index'])->name('forensic.index');
        Route::post('/analyze', [ForensicController::class, 'analyze'])->name('forensic.analyze');
        Route::get('/timeline', [CustodyController::class, 'timeline'])->name('forensic.timeline');
        Route::get('/dashboard', [CustodyController::class, 'dashboard'])->name('forensic.dashboard');
        Route::get('/defense', [CustodyController::class, 'defense'])->name('forensic.defense');
    });

    Route::post('/certificate/{log}', [CertificateController::class, 'generate'])->name('certificate.generate');

    Route::prefix('alerts')->group(function () {
        Route::get('/', [AlertController::class, 'index'])->name('alerts.index');
        Route::post('/{alert}/resolve', [AlertController::class, 'resolve'])->name('alerts.resolve');
        Route::post('/{alert}/dismiss', [AlertController::class, 'dismiss'])->name('alerts.dismiss');
        Route::get('/unread-count', [AlertController::class, 'unreadCount'])->name('alerts.unread-count');
    });

    Route::prefix('activity-logs')->group(function () {
        Route::get('/', [ActivityLogController::class, 'index'])->name('activity-logs.index');
    });

    Route::prefix('settings')->group(function () {
        Route::get('/chain-of-custody', [SettingController::class, 'index'])->name('settings.chain-of-custody');
        Route::post('/chain-of-custody', [SettingController::class, 'update'])->name('settings.chain-of-custody.update');

        Route::get('/provider', [ProviderConnectionController::class, 'index'])->name('settings.provider');
        Route::post('/provider', [ProviderConnectionController::class, 'store'])->name('settings.provider.store');
        Route::post('/provider/{connection}/test', [ProviderConnectionController::class, 'test'])->name('settings.provider.test');
        Route::post('/provider/{connection}/activate', [ProviderConnectionController::class, 'activate'])->name('settings.provider.activate');
        Route::post('/provider/{connection}/deactivate', [ProviderConnectionController::class, 'deactivate'])->name('settings.provider.deactivate');
        Route::put('/provider/{connection}', [ProviderConnectionController::class, 'update'])->name('settings.provider.update');
        Route::delete('/provider/{connection}', [ProviderConnectionController::class, 'destroy'])->name('settings.provider.destroy');
    });
});

require __DIR__ . '/settings.php';
