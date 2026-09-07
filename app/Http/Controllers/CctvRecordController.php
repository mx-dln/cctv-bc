<?php

namespace App\Http\Controllers;

use App\Models\Camera;
use App\Models\GeneratedLog;
use App\Services\CctvRecordService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CctvRecordController extends Controller
{
    public function __construct(private CctvRecordService $records) {}

    public function index(Request $request): Response
    {
        return Inertia::render('custody/index', [
            'cameras' => Camera::orderBy('name')->get(['id', 'provider_camera_id', 'name', 'resolution']),
            'records' => GeneratedLog::with(['camera', 'hashRecord', 'hashRecord.blockchainTransaction', 'registeredBy'])
                ->latest('registered_at')
                ->when($request->filled('search'), fn ($query) => $query->where(function ($query) use ($request) {
                    $query->where('record_id', 'like', '%' . $request->string('search') . '%')
                        ->orWhere('filename', 'like', '%' . $request->string('search') . '%');
                }))
                ->paginate(20)->withQueryString(),
            'search' => $request->string('search')->toString(),
            'uploadConfig' => [
                'maxFileSize' => ini_get('upload_max_filesize'),
                'postMaxSize' => ini_get('post_max_size'),
                'memoryLimit' => ini_get('memory_limit'),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'camera_id' => ['required', 'exists:cameras,id'],
            'footage' => ['nullable', 'file', 'mimetypes:video/mp4,video/avi,video/mpeg,video/quicktime,video/x-msvideo', 'max:1048576'],
            'filename' => ['nullable', 'string', 'max:255'],
            'recording_url' => ['nullable', 'string', 'max:2048'],
            'recorded_at' => ['required', 'date'],
            'ended_at' => ['nullable', 'date', 'after_or_equal:recorded_at'],
            'duration' => ['nullable', 'integer', 'min:0'],
            'resolution' => ['nullable', 'string', 'max:100'],
            'recording_info' => ['nullable', 'string'],
            'label' => ['nullable', 'string', 'max:100'],
        ], [
            'footage.max' => 'The CCTV footage must be 1 GB or smaller.',
            'footage.mimetypes' => 'The CCTV footage must be an MP4, AVI, MPEG, or QuickTime video.',
            'footage.uploaded' => 'The footage failed to upload. Restart PHP/Herd, then try again. If it still fails, use a file smaller than 1 GB.',
        ]);

        if (!$request->hasFile('footage') && (empty($data['recording_url'])
            || str_contains($data['recording_url'], '://')
            || str_contains($data['recording_url'], '..')
            || !app(\App\Services\FootageStorage::class)->exists($data['recording_url']))) {
            return back()->withErrors(['footage' => 'Upload footage or select an existing relative storage path. Remote references cannot be hashed.'])->withInput();
        }

        $data['metadata'] = [
            'camera_id' => Camera::find($data['camera_id'])?->provider_camera_id,
            'date' => substr((string) $data['recorded_at'], 0, 10),
            'time' => substr((string) $data['recorded_at'], 11, 8),
            'duration' => $data['duration'] ?? null,
            'filename' => $data['filename'] ?? $request->file('footage')?->getClientOriginalName(),
            'resolution' => $data['resolution'] ?? null,
            'recording_information' => $data['recording_info'] ?? null,
        ];

        $result = $this->records->register($data, $request->user());

        return to_route('custody.records.index')
            ->with('success', $result['record']->record_id . ': blockchain transaction ' . $result['transaction']->status);
    }

    public function download(GeneratedLog $log, Request $request)
    {
        abort_unless($this->records->footageAvailable($log), 404, 'Footage is unavailable.');
        app(\App\Services\EvidenceCustodyService::class)->recordExported($log, $request->user(), 'video');
        app(\App\Services\ActivityLoggerService::class)->log('download_cctv', 'custody', $request->user(),
            'CCTV footage retrieved', ['record_id' => $log->record_id, 'result' => 'success',
                'transaction_id' => $log->hashRecord?->blockchainTransaction?->transaction_id]);

        return app(\App\Services\FootageStorage::class)->disk($log->recording_url)->download($log->recording_url, $log->filename);
    }

    public function retryCommit(GeneratedLog $log, Request $request): RedirectResponse
    {
        $result = $this->records->retryBlockchainCommit($log, $request->user());

        return to_route('custody.records.index')
            ->with('success', $log->record_id . ': blockchain transaction ' . $result['transaction']->status);
    }
}
