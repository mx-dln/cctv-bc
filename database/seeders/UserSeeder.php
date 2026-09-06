<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@ficobank.com',
            'password' => bcrypt('password'),
        ]);
        $admin->assignRole('Administrator');

        $officer = User::factory()->create([
            'name' => 'Security Officer',
            'email' => 'officer@ficobank.com',
            'password' => bcrypt('password'),
        ]);
        $officer->assignRole('Security Officer');

        $auditor = User::factory()->create([
            'name' => 'Auditor User',
            'email' => 'auditor@ficobank.com',
            'password' => bcrypt('password'),
        ]);
        $auditor->assignRole('Auditor');
    }
}
