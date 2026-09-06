<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class CameraSeeder extends Seeder
{
    public function run(): void
    {
        // Cameras are discovered dynamically from the connected CCTV provider.
        // Run `php artisan cctv:discover-cameras` to populate the cameras table.
    }
}
