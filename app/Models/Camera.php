<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Camera extends Model
{
    protected $fillable = [
        'provider',
        'provider_camera_id',
        'name',
        'location',
        'status',
        'resolution',
        'fps',
        'last_seen',
    ];

    protected $casts = [
        'fps' => 'integer',
        'last_seen' => 'datetime',
    ];

    public function generatedLogs(): HasMany
    {
        return $this->hasMany(GeneratedLog::class);
    }
}
