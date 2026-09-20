<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleAndPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'view-dashboard',
            'manage-cameras',
            'view-cameras',
            'manage-verification',
            'view-verification',
            'view-blockchain',
            'manage-audit',
            'view-audit',
            'manage-alerts',
            'view-alerts',
            'manage-settings',
            'view-settings',
            'export-reports',
            'manage-users',
        ];

        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission]);
        }

        $adminRole = Role::create(['name' => 'Administrator']);
        $adminRole->givePermissionTo(Permission::all());

        $officerRole = Role::create(['name' => 'Security Officer']);
        $officerRole->givePermissionTo([
            'view-dashboard',
            'view-cameras',
            'manage-verification',
            'view-verification',
            'view-blockchain',
            'view-audit',
            'manage-alerts',
            'view-alerts',
        ]);

        $auditorRole = Role::create(['name' => 'Auditor']);
        $auditorRole->givePermissionTo([
            'view-dashboard',
            'view-cameras',
            'view-verification',
            'view-blockchain',
            'manage-audit',
            'view-audit',
            'view-alerts',
            'export-reports',
        ]);
    }
}
