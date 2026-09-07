<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProviderConnection extends Model
{
    protected $hidden = ['password', 'api_key'];
    protected $fillable = [
        'name', 'provider_type', 'base_url', 'host', 'port',
        'username', 'password', 'api_key', 'onvif_url', 'rtsp_url',
        'https_enabled', 'polling_interval', 'connection_timeout',
        'auto_sync', 'is_active', 'last_connected_at',
        'last_connection_status', 'provider_info',
    ];

    protected $casts = [
        'https_enabled' => 'boolean',
        'auto_sync' => 'boolean',
        'is_active' => 'boolean',
        'polling_interval' => 'integer',
        'connection_timeout' => 'integer',
        'port' => 'integer',
        'last_connected_at' => 'datetime',
        'provider_info' => 'array',
    ];

    public function toConfig(): array
    {
        return [
            'name' => $this->name,
            'provider_type' => $this->provider_type,
            'base_url' => $this->base_url,
            'host' => $this->host,
            'port' => $this->port,
            'username' => $this->username,
            'password' => $this->password,
            'api_key' => $this->api_key,
            'onvif_url' => $this->onvif_url,
            'rtsp_url' => $this->rtsp_url,
            'https_enabled' => $this->https_enabled,
            'polling_interval' => $this->polling_interval,
            'connection_timeout' => $this->connection_timeout,
            'auto_sync' => $this->auto_sync,
        ];
    }
}
