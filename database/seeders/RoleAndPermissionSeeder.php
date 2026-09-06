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
            'manage-simulator',
            'view-simulator',
            'manage-verification',
            'view-verification',
            'manage-tamper',
            'view-blockchain',
            'manage-audit',
            'view-audit',
            'manage-forensic',
            'view-forensic',
            'manage-alerts',
            'view-alerts',
            'view-activity-logs',
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
            'manage-simulator',
            'view-simulator',
            'manage-verification',
            'view-verification',
            'manage-tamper',
            'view-blockchain',
            'view-audit',
            'view-forensic',
            'manage-alerts',
            'view-alerts',
            'view-activity-logs',
        ]);

        $auditorRole = Role::create(['name' => 'Auditor']);
        $auditorRole->givePermissionTo([
            'view-dashboard',
            'view-cameras',
            'view-simulator',
            'view-verification',
            'view-blockchain',
            'manage-audit',
            'view-audit',
            'manage-forensic',
            'view-forensic',
            'view-alerts',
            'view-activity-logs',
            'export-reports',
        ]);
    }
}
