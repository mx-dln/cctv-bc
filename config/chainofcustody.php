<?php

return [
    'cctv' => [
        'provider' => env('CCTV_PROVIDER', 'mock'),
        'dahua' => [
            'host' => env('DAHUA_HOST', '192.168.1.100'),
            'port' => env('DAHUA_PORT', 80),
            'username' => env('DAHUA_USERNAME', 'admin'),
            'password' => env('DAHUA_PASSWORD', ''),
            'https_enabled' => env('DAHUA_HTTPS', false),
            'timeout' => env('DAHUA_TIMEOUT', 15),
        ],
        'sync' => [
            'interval_seconds' => env('CCTV_SYNC_INTERVAL', 60),
            'events_limit' => env('CCTV_EVENTS_LIMIT', 50),
        ],
    ],
    'hash' => [
        'algorithm' => env('HASH_ALGORITHM', 'sha256'),
    ],
    'blockchain' => [
        'peer_endpoint' => env('BLOCKCHAIN_PEER_ENDPOINT', '127.0.0.1:8787'),
        'channel_name' => env('BLOCKCHAIN_CHANNEL', 'mychannel'),
        'chaincode_name' => env('BLOCKCHAIN_CHAINCODE', 'cctv-custody'),
        'peer_node' => env('BLOCKCHAIN_PEER_NODE', 'peer0.org1.example.com'),
        'simulate' => env('BLOCKCHAIN_SIMULATE', true),
    ],
];
