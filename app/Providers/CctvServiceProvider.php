<?php

namespace App\Providers;

use App\Contracts\CctvProviderInterface;
use App\Services\Cctv\CctvProviderFactory;
use App\Services\Cctv\CctvProviderManager;
use Illuminate\Support\ServiceProvider;

class CctvServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(CctvProviderManager::class, function ($app) {
            return new CctvProviderManager($app->make(CctvProviderFactory::class));
        });

        $this->app->bind(CctvProviderInterface::class, function ($app) {
            return $app->make(CctvProviderManager::class)->provider();
        });
    }

    public function boot(): void
    {
        //
    }
}
