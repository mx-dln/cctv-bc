<?php

namespace App\Console\Commands;

use App\Models\Camera;
use App\Services\Cctv\CctvProviderFactory;
use Illuminate\Console\Command;

class FrigateDiscoverCamerasCommand extends Command
{
    protected $signature = 'cctv:discover-cameras';
    protected $description = 'Discover cameras from the active CCTV provider';

    public function handle(CctvProviderFactory $factory): int
    {
        $provider = $factory->create();

        $this->info('Discovering cameras from ' . $provider->getProviderName() . '...');

        $health = $provider->verifyConnection();
        if (!($health['connected'] ?? false)) {
            $this->error('Cannot connect to provider.');
            return Command::FAILURE;
        }

        $cameras = $provider->getCameras();
        $count = 0;

        foreach ($cameras as $cameraData) {
            Camera::updateOrCreate(
                ['provider' => $provider->getProviderName(), 'provider_camera_id' => $cameraData['provider_camera_id']],
                [
                    'name' => $cameraData['name'],
                    'location' => $cameraData['location'] ?? null,
                    'status' => $cameraData['status'] ?? 'online',
                    'resolution' => $cameraData['resolution'] ?? null,
                    'fps' => $cameraData['fps'] ?? null,
                ]
            );
            $count++;
        }

        $this->info("Discovered and registered {$count} cameras.");
        return Command::SUCCESS;
    }
}
