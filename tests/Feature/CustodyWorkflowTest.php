<?php

namespace Tests\Feature;

use App\Models\Camera;
use App\Models\GeneratedLog;
use App\Models\User;
use App\Services\CctvRecordService;
use App\Services\VerificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
