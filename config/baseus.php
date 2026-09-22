<?php

return [
    's0tv00' => [
        'manufacturer' => 'Baseus',
        'model' => 'S0TV00',
        'known_mac' => env('BASEUS_S0TV00_MAC', 'A4:40:3D:05:B9:87'),
        'port' => (int) env('BASEUS_S0TV00_PORT', 6668),
    ],
    'discovery' => [
        'connect_timeout_seconds' => (float) env('BASEUS_DISCOVERY_TIMEOUT', 0.25),
        'scan_private_lan_only' => true,
        'max_subnet_hosts' => (int) env('BASEUS_DISCOVERY_MAX_HOSTS', 254),
        'batch_size' => (int) env('BASEUS_DISCOVERY_BATCH_SIZE', 64),
    ],
];
