<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class GeneratedLog extends Model
{
    protected $fillable = [
        'event_id',
        'camera_id',
        'event_type',
        'label',
        'sub_label',
        'object_type',
        'started_at',
        'ended_at',
        'duration',
        'score',
        'top_score',
        'false_positive',
        'snapshot_url',
        'recording_url',
        'zones',
        'thumbnail',
        'status',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
        'zones' => 'array',
        'score' => 'float',
        'top_score' => 'float',
        'false_positive' => 'boolean',
        'duration' => 'integer',
    ];

    public function camera(): BelongsTo
    {
        return $this->belongsTo(Camera::class);
    }

    public function hashRecord(): HasOne
    {
        return $this->hasOne(HashRecord::class, 'log_id');
    }

    public function blockchainTransactions(): HasManyThrough
    {
        return $this->hasManyThrough(BlockchainTransaction::class, HashRecord::class, 'log_id', 'log_id', 'id', 'id');
    }

    public function alerts(): HasManyThrough
    {
        return $this->hasManyThrough(Alert::class, HashRecord::class, 'log_id', 'alertable_id', 'id', 'id')
            ->where('alerts.alertable_type', GeneratedLog::class);
    }
}
