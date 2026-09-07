<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('settings/index', ['settings' => [
            'Hash algorithm' => 'SHA-256',
            'Blockchain mode' => 'Hyperledger Fabric',
            'Gateway endpoint' => config('chainofcustody.blockchain.peer_endpoint'),
            'Channel' => config('chainofcustody.blockchain.channel_name'),
            'Chaincode' => config('chainofcustody.blockchain.chaincode_name'),
        ]]);
    }
}
