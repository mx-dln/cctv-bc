<?php

namespace App\Http\Controllers;

use App\Models\GeneratedLog;
use App\Services\EvidenceCustodyService;
use App\Services\IntegrityScoreService;
use Inertia\Inertia;
use Inertia\Response;

class CustodyController extends Controller
{
    private EvidenceCustodyService $custody;
    private IntegrityScoreService $integrity;

    public function __construct(EvidenceCustodyService $custody, IntegrityScoreService $integrity)
    {
        $this->custody = $custody;
        $this->integrity = $integrity;
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

    public function dashboard(): Response
    {
        $integrityScore = $this->integrity->getIntegrityScore();
        $healthScore = $this->integrity->getForensicHealthScore();
        $blockchainMode = $this->integrity->getBlockchainMode();

        return Inertia::render('forensic/dashboard', [
            'integrityScore' => $integrityScore,
            'healthScore' => $healthScore,
            'blockchainMode' => $blockchainMode,
            'custodyStats' => $this->custody->getStats(),
        ]);
    }

    public function defense(): Response
    {
        $integrityScore = $this->integrity->getIntegrityScore();
        $healthScore = $this->integrity->getForensicHealthScore();
        $blockchainMode = $this->integrity->getBlockchainMode();
        $recentCustody = EvidenceRecord::with(['event.camera', 'user'])
            ->latest()->take(20)->get();

        return Inertia::render('forensic/defense', [
            'integrityScore' => $integrityScore,
            'healthScore' => $healthScore,
            'blockchainMode' => $blockchainMode,
            'recentCustody' => $recentCustody,
            'custodyStats' => $this->custody->getStats(),
        ]);
    }
}
