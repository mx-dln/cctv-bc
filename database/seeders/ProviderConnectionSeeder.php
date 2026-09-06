<?php

namespace Database\Seeders;

use App\Models\ProviderConnection;
use Illuminate\Database\Seeder;

class ProviderConnectionSeeder extends Seeder
{
    public function run(): void
    {
        ProviderConnection::create([
            'name' => 'Development Mock',
            'provider_type' => 'mock',
            'host' => '192.168.1.100',
            'port' => 80,
            'username' => 'admin',
            'password' => 'password',
            'polling_interval' => 60,
            'connection_timeout' => 15,
            'auto_sync' => true,
            'is_active' => true,
            'provider_info' => [
                'name' => 'Dahua NVR5216 (Mock)',
                'version' => '4.001.0000009.0',
                'vendor' => 'Dahua Technology',
                'model' => 'DHI-NVR5216-16P-4KS2',
            ],
        ]);
    }
}
