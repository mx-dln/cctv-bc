<?php

namespace Database\Seeders;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RoleAndPermissionSeeder::class,
            CameraSeeder::class,
            SettingSeeder::class,
            ProviderConnectionSeeder::class,
            UserSeeder::class,
        ]);
    }
}
