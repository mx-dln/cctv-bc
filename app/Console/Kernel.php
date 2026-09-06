<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    protected function schedule(Schedule $schedule): void
    {
        $schedule->command('cctv:sync')->everyMinute()->withoutOverlapping();
        $schedule->command('cctv:discover-cameras')->everyFiveMinutes()->withoutOverlapping();
        $schedule->command('blockchain:health')->everyFiveMinutes();
        $schedule->command('blockchain:verify --all')->hourly();
        $schedule->command('audit:generate --format=pdf')->daily();
    }

    protected function commands(): void
    {
        $this->load(__DIR__ . '/Commands');
        require base_path('routes/console.php');
    }
}
