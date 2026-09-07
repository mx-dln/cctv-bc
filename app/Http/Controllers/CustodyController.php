<?php

namespace App\Http\Controllers;

use App\Models\EvidenceRecord;
use App\Services\EvidenceCustodyService;
use Inertia\Inertia;
use Inertia\Response;

class CustodyController extends Controller
{
    private EvidenceCustodyService $custody;

    public function __construct(EvidenceCustodyService $custody)
    {
        $this->custody = $custody;
    }

    public function timeline(): Response
    {
        $records = EvidenceRecord::with(['event.camera', 'user'])
            ->latest()
            ->paginate(30);

        return Inertia::render('forensic/timeline', [
            'records' => $records,
            'stats' => $this->custody->getStats(),
            'actions' => EvidenceCustodyService::ACTIONS,
        ]);
    }

}
