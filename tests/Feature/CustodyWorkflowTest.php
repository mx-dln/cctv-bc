<?php

namespace Tests\Feature;

use App\Models\Camera;
use App\Models\AuditReport;
use App\Models\GeneratedLog;
use App\Models\ProviderConnection;
use App\Services\Cctv\CameraDiscovery;
use App\Models\User;
use App\Services\CctvRecordService;
use App\Services\VerificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class CustodyWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['chainofcustody.blockchain.simulate' => true]);
        Storage::fake('public');
    }

    private function record(): GeneratedLog
    {
        $user = User::factory()->create();
        $camera = Camera::create(['provider' => 'test', 'provider_camera_id' => 'CAM-03', 'name' => 'Test camera']);
        Storage::disk('public')->put('sample.mp4', 'original video bytes');
        return app(CctvRecordService::class)->register([
            'camera_id' => $camera->id, 'recording_url' => 'sample.mp4',
            'filename' => 'sample.mp4', 'resolution' => '1920x1080',
            'metadata' => ['duration' => 10],
        ], $user)['record'];
    }

    public function test_unchanged_file_verifies_against_stored_simulation_hash(): void
    {
        $log = $this->record();
        $this->assertSame('sample.mp4', $log->filename);
        $this->assertSame('1920x1080', $log->resolution);
        $this->assertSame('CCTV-000001', $log->record_id);
        $this->assertSame('verified', app(VerificationService::class)->verify($log)['status']);
        $this->assertDatabaseHas('blockchain_transactions', [
            'log_id' => $log->id,
            'status' => 'committed',
        ]);
    }

    public function test_altered_video_generates_alert(): void
    {
        $log = $this->record();
        Storage::disk('public')->put('sample.mp4', 'altered video bytes');
        $result = app(VerificationService::class)->verify($log);
        $this->assertSame('tampered', $result['status']);
        $this->assertFalse($result['blockchain_verification']['verified']);
        $this->assertDatabaseHas('alerts', ['type' => 'tamper_detected']);
    }

    public function test_uploaded_comparison_detects_cut_or_edited_video(): void
    {
        $log = $this->record();
        $path = tempnam(sys_get_temp_dir(), 'edited-video-');
        file_put_contents($path, 'cut version of the original video');

        $result = app(VerificationService::class)->verifyUploadedFootage(
            $log,
            new UploadedFile($path, 'edited.mp4', 'video/mp4', null, true)
        );

        $this->assertSame('tampered', $result['status']);
        $this->assertSame('uploaded_comparison', $result['mode']);
        $this->assertFalse($result['blockchain_verification']['verified']);
        $this->assertDatabaseHas('alerts', ['type' => 'tamper_detected']);
        $this->assertDatabaseHas('blockchain_transactions', [
            'log_id' => $log->id,
            'status' => 'committed',
        ]);
    }

    public function test_verification_upload_endpoint_compares_against_original_record(): void
    {
        $log = $this->record();
        $user = User::factory()->create();
        $user->givePermissionTo(Permission::create(['name' => 'manage-verification']));

        $path = tempnam(sys_get_temp_dir(), 'same-video-');
        file_put_contents($path, 'original video bytes');

        $this->actingAs($user)
            ->postJson('/verification/'.$log->id.'/check-upload', [
                'footage' => new UploadedFile($path, 'same.mp4', 'video/mp4', null, true),
            ])
            ->assertOk()
            ->assertJsonPath('status', 'verified')
            ->assertJsonPath('mode', 'uploaded_comparison');
    }

    public function test_altered_metadata_is_detected(): void
    {
        $log = $this->record();
        $log->update(['metadata' => ['duration' => 99]]);
        $this->assertSame('tampered', app(VerificationService::class)->verify($log)['status']);
    }

    public function test_missing_video_is_distinct_from_alteration(): void
    {
        $log = $this->record();
        Storage::disk('public')->delete('sample.mp4');
        $this->assertSame('missing', app(VerificationService::class)->verify($log)['status']);
        $this->assertDatabaseHas('alerts', ['type' => 'missing_footage']);
        $this->assertDatabaseMissing('alerts', ['type' => 'tamper_detected']);
    }

    public function test_remote_reference_cannot_verify_without_video_bytes(): void
    {
        $log = $this->record();
        $log->update(['recording_url' => 'nvr://example.mp4']);
        $this->assertSame('unavailable', app(VerificationService::class)->verify($log)['status']);
    }

    public function test_network_failure_does_not_report_tampering(): void
    {
        $log = $this->record();
        config(['chainofcustody.blockchain.simulate' => false]);
        Http::fake(['*' => Http::response([], 503)]);
        $this->assertSame('unavailable', app(VerificationService::class)->verify($log)['status']);
        $this->assertDatabaseMissing('alerts', ['type' => 'tamper_detected']);
    }

    public function test_registration_without_commit_confirmation_stays_pending(): void
    {
        config(['chainofcustody.blockchain.simulate' => false]);
        Http::fake(['*' => Http::response(['transaction_id' => 'unconfirmed'], 200)]);
        $this->assertSame('pending', $this->record()->status);
    }

    public function test_existing_fabric_record_reconciles_pending_local_transaction(): void
    {
        config(['chainofcustody.blockchain.simulate' => false]);

        Http::fake(function ($request) {
            if (str_contains($request->url(), '/chaincode/invoke')) {
                return Http::response([
                    'error' => '10 ABORTED',
                    'details' => [[
                        'message' => 'chaincode response 500, record CCTV-000001 already exists',
                    ]],
                ], 500);
            }

            return Http::response([
                'record_id' => 'CCTV-000001',
                'event_id' => 'existing-event',
                'transaction_id' => 'fabric-existing-tx',
            ], 200);
        });

        $result = app(CctvRecordService::class)->register([
            'camera_id' => Camera::create(['provider' => 'test', 'provider_camera_id' => 'CAM-03', 'name' => 'Test camera'])->id,
            'recording_url' => 'sample.mp4',
            'filename' => 'sample.mp4',
            'resolution' => '1920x1080',
            'metadata' => ['duration' => 10],
        ], User::factory()->create());

        $this->assertSame('committed', $result['transaction']->status);
        $this->assertDatabaseHas('blockchain_transactions', [
            'log_id' => $result['record']->id,
            'status' => 'committed',
            'transaction_id' => 'fabric-existing-tx',
        ]);
    }

    public function test_unassigned_user_cannot_access_or_register_cctv(): void
    {
        $this->actingAs(User::factory()->create());
        $this->get('/custody-records')->assertForbidden();
        $this->post('/custody-records', [])->assertForbidden();
        $this->post('/tamper/1', [])->assertNotFound();
    }

    public function test_download_requires_permission_and_records_an_audit_event(): void
    {
        $log = $this->record();
        $user = User::factory()->create();
        $this->actingAs($user)->get('/custody-records/'.$log->id.'/download')->assertForbidden();
        $user->givePermissionTo(Permission::create(['name' => 'view-verification']));
        $this->get('/custody-records/'.$log->id.'/download')->assertDownload('sample.mp4');
        $this->assertDatabaseHas('activity_logs', ['action' => 'download_cctv', 'user_id' => $user->id]);
    }

    public function test_upload_is_private_and_verifies_after_database_reload(): void
    {
        Storage::fake('local');
        $log = $this->record();
        $user = User::factory()->create();
        $user->givePermissionTo(\Spatie\Permission\Models\Permission::create(['name' => 'manage-verification']));
        $this->actingAs($user)->post('/custody-records', [
            'camera_id' => $log->camera_id,
            'recorded_at' => '2026-09-06 10:20:30',
            'footage' => \Illuminate\Http\UploadedFile::fake()->create('test.mp4', 1, 'video/mp4'),
        ])->assertRedirect('/custody-records')->assertSessionHasNoErrors();
        $uploaded = GeneratedLog::latest('id')->first();
        $this->assertStringStartsWith('private-cctv/', $uploaded->recording_url);
        Storage::disk('local')->assertExists($uploaded->recording_url);
        Storage::disk('public')->assertMissing($uploaded->recording_url);
        $this->assertTrue(app(VerificationService::class)->verify($uploaded)['verified']);
    }

    public function test_role_permissions_and_core_pages(): void
    {
        $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);
        $user = User::factory()->create();
        $user->assignRole('Auditor');
        $this->actingAs($user)->post('/custody-records', [])->assertForbidden();
        $this->get('/settings/provider')->assertForbidden();
        $this->get('/audit/logs?date_from=2026-01-01')->assertOk();
        $this->get('/forensic/timeline')->assertNotFound();
        $this->get('/blockchain')->assertOk();
        $this->get('/custody-records')->assertOk();
    }

    public function test_audit_index_renders_with_reports_and_recent_logs(): void
    {
        $user = User::factory()->create();
        $user->givePermissionTo(Permission::create(['name' => 'view-audit']));
        $log = $this->record();

        AuditReport::create([
            'user_id' => $user->id,
            'title' => 'Audit Logs Export',
            'type' => 'verification',
            'format' => 'pdf',
            'total_logs' => 1,
            'verified_count' => 1,
            'tampered_count' => 0,
            'generated_at' => now(),
        ]);

        $this->actingAs($user)
            ->get('/audit')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('audit/index')
                ->has('reports.data', 1)
                ->has('recentLogs', 1)
                ->where('recentLogs.0.id', $log->id)
            );
    }

    public function test_baseus_provider_can_be_activated_as_controlled_capture_source(): void
    {
        $this->mock(CameraDiscovery::class, function ($mock) {
            $mock->shouldReceive('findBaseus')->andReturn([
                'id' => 'baseus-a4-40-3d-05-b9-87',
                'manufacturer' => 'Baseus',
                'model' => 'S0TV00',
                'ip' => '192.168.1.37',
                'mac' => 'A4:40:3D:05:B9:87',
                'port' => 6668,
                'status' => 'online',
                'verified' => true,
                'identity_method' => 'known_mac',
            ]);
        });

        $connection = ProviderConnection::create([
            'name' => 'Baseus Portable Camera',
            'provider_type' => 'baseus',
            'port' => 80,
            'username' => 'admin',
            'polling_interval' => 60,
            'connection_timeout' => 15,
            'auto_sync' => true,
        ]);

        $user = User::factory()->create();
        $user->givePermissionTo(Permission::create(['name' => 'manage-settings']));

        $this->actingAs($user)
            ->post('/settings/provider/'.$connection->id.'/activate')
            ->assertRedirect('/settings/provider');

        $this->assertDatabaseHas('provider_connections', [
            'id' => $connection->id,
            'provider_type' => 'baseus',
            'is_active' => true,
        ]);
        $this->assertDatabaseHas('cameras', [
            'provider' => 'Baseus Wi-Fi Camera',
            'provider_camera_id' => 'baseus-a4-40-3d-05-b9-87',
            'name' => 'Baseus S0TV00',
        ]);
    }

    public function test_baseus_discovery_endpoint_returns_dynamic_camera_address(): void
    {
        $user = User::factory()->create();
        $user->givePermissionTo(Permission::create(['name' => 'manage-settings']));

        $this->mock(CameraDiscovery::class, function ($mock) {
            $mock->shouldReceive('discoverBaseus')->once()->andReturn([
                'status' => 'found',
                'interfaces' => [['ip' => '192.168.1.25', 'cidr' => 24]],
                'cameras' => [[
                    'id' => 'baseus-a4-40-3d-05-b9-87',
                    'manufacturer' => 'Baseus',
                    'model' => 'S0TV00',
                    'ip' => '192.168.1.37',
                    'mac' => 'A4:40:3D:05:B9:87',
                    'port' => 6668,
                    'status' => 'online',
                    'verified' => true,
                    'identity_method' => 'known_mac',
                ]],
                'attempted_methods' => ['existing_arp_table', 'local_subnet_discovery', 'tcp_6668_verification'],
                'limitations' => [],
            ]);
        });

        $this->actingAs($user)
            ->postJson('/settings/provider/baseus/discover')
            ->assertOk()
            ->assertJsonPath('cameras.0.ip', '192.168.1.37')
            ->assertJsonPath('cameras.0.mac', 'A4:40:3D:05:B9:87');
    }

    public function test_connecting_discovered_baseus_saves_last_known_ip_without_hard_coding_current_test_ip(): void
    {
        $user = User::factory()->create();
        $user->givePermissionTo(Permission::create(['name' => 'manage-settings']));

        $this->actingAs($user)
            ->postJson('/settings/provider/baseus/connect', [
                'manufacturer' => 'Baseus',
                'model' => 'S0TV00',
                'ip' => '10.0.0.25',
                'mac' => 'A4:40:3D:05:B9:87',
                'port' => 6668,
            ])
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('provider_connections', [
            'provider_type' => 'baseus',
            'host' => '10.0.0.25',
            'port' => 6668,
            'is_active' => true,
        ]);

        $this->assertDatabaseMissing('provider_connections', [
            'provider_type' => 'baseus',
            'host' => '192.168.100.70',
        ]);
    }

    public function test_login_and_logout_are_audited(): void
    {
        $user = User::factory()->create();
        $this->post('/login', ['email' => $user->email, 'password' => 'password'])->assertRedirect();
        $this->post('/logout')->assertRedirect();
        $this->assertDatabaseHas('activity_logs', ['action' => 'login', 'user_id' => $user->id]);
        $this->assertDatabaseHas('activity_logs', ['action' => 'logout', 'user_id' => $user->id]);
    }

    public function test_excel_report_download_uses_the_export_disk(): void
    {
        Storage::fake('local');
        $log = $this->record();
        $user = User::factory()->create();
        $user->givePermissionTo(\Spatie\Permission\Models\Permission::create(['name' => 'view-audit']));
        $report = app(\App\Services\AuditService::class)->generateReport($user, 'Test report', format: 'excel');
        Storage::disk('local')->assertExists($report->file_path);
        $this->actingAs($user)->get('/audit/reports/'.$report->id.'/download')->assertDownload();
    }
}
