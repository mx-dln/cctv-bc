<?php

return [
    'peer_endpoint' => env('BLOCKCHAIN_PEER_ENDPOINT', 'localhost:7051'),
    'channel_name' => env('BLOCKCHANNEL_CHANNEL', 'cctv-channel'),
    'chaincode_name' => env('BLOCKCHAIN_CHAINCODE', 'cctv-chaincode'),
    'peer_node' => env('BLOCKCHAIN_PEER_NODE', 'peer0.org1.example.com'),
    'orderer_endpoint' => env('BLOCKCHAIN_ORDERER_ENDPOINT', 'localhost:7050'),
    'msp_id' => env('BLOCKCHAIN_MSP_ID', 'Org1MSP'),
];
