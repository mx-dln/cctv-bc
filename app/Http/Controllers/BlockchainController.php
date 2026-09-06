<?php

namespace App\Http\Controllers;

use App\Models\BlockchainTransaction;
use App\Services\BlockchainService;
use Inertia\Inertia;
use Inertia\Response;

class BlockchainController extends Controller
{
    private BlockchainService $blockchainService;

    public function __construct(BlockchainService $blockchainService)
    {
        $this->blockchainService = $blockchainService;
    }

    public function index(): Response
    {
        $transactions = BlockchainTransaction::latest()->paginate(20);
        $isSimulated = $this->blockchainService->isSimulateMode();
        $isAvailable = $isSimulated || $this->blockchainService->isAvailable();

        return Inertia::render('blockchain/index', [
            'transactions' => $transactions,
            'isAvailable' => $isAvailable,
            'isSimulated' => $isSimulated,
        ]);
    }

    public function show(BlockchainTransaction $transaction): Response
    {
        $transaction->load('log.camera');

        return Inertia::render('blockchain/show', [
            'transaction' => $transaction,
        ]);
    }
}
