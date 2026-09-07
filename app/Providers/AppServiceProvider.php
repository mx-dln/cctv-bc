<?php

namespace App\Providers;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->configureUploadRuntime();
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        \Illuminate\Support\Facades\Event::listen(\Illuminate\Auth\Events\Login::class,
            fn ($event) => app(\App\Services\ActivityLoggerService::class)->logLogin($event->user));
        \Illuminate\Support\Facades\Event::listen(\Illuminate\Auth\Events\Logout::class, function ($event) {
            if ($event->user) app(\App\Services\ActivityLoggerService::class)->logLogout($event->user);
        });
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }

    protected function configureUploadRuntime(): void
    {
        $memoryLimit = env('CCTV_UPLOAD_MEMORY_LIMIT', '512M');
        $uploadLimit = env('CCTV_UPLOAD_MAX_FILESIZE', '500M');
        $postLimit = env('CCTV_UPLOAD_POST_MAX_SIZE', '520M');

        ini_set('memory_limit', $memoryLimit);
        ini_set('upload_max_filesize', $uploadLimit);
        ini_set('post_max_size', $postLimit);
    }
}
