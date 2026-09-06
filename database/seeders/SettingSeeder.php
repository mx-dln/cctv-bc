<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            ['key' => 'hash_algorithm', 'value' => 'sha256', 'group' => 'hashing', 'type' => 'string', 'description' => 'Hashing algorithm for log integrity'],
            ['key' => 'blockchain_peer', 'value' => 'localhost:7051', 'group' => 'blockchain', 'type' => 'string', 'description' => 'Blockchain peer endpoint'],
            ['key' => 'blockchain_channel', 'value' => 'cctv-channel', 'group' => 'blockchain', 'type' => 'string', 'description' => 'Hyperledger Fabric channel name'],
            ['key' => 'blockchain_chaincode', 'value' => 'cctv-chaincode', 'group' => 'blockchain', 'type' => 'string', 'description' => 'Chaincode name'],
            ['key' => 'simulation_interval', 'value' => '5', 'group' => 'simulation', 'type' => 'integer', 'description' => 'Log generation interval in seconds'],
            ['key' => 'simulation_enabled', 'value' => 'true', 'group' => 'simulation', 'type' => 'boolean', 'description' => 'Enable automatic log simulation'],
            ['key' => 'retention_log_days', 'value' => '90', 'group' => 'retention', 'type' => 'integer', 'description' => 'Retention period for CCTV logs in days'],
            ['key' => 'retention_alert_days', 'value' => '30', 'group' => 'retention', 'type' => 'integer', 'description' => 'Retention period for alerts in days'],
            ['key' => 'retention_activity_days', 'value' => '60', 'group' => 'retention', 'type' => 'integer', 'description' => 'Retention period for activity logs in days'],
        ];

        foreach ($settings as $setting) {
            Setting::create($setting);
        }
    }
}
