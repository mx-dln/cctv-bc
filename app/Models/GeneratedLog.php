<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Str;

class GeneratedLog extends Model
{
    protected $fillable = [
        'event_id',
        'record_id',
        'filename',
        'resolution',
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
        'recording_info',
        'zones',
        'metadata',
        'thumbnail',
        'status',
        'registered_by',
        'registered_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
        'zones' => 'array',
        'metadata' => 'array',
        'score' => 'float',
        'top_score' => 'float',
        'false_positive' => 'boolean',
        'duration' => 'integer',
        'registered_at' => 'datetime',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (GeneratedLog $log) {
            if (empty($log->event_id)) {
                $log->event_id = (string) Str::uuid();
            }
        });

        static::created(function (GeneratedLog $log) {
            if (empty($log->record_id)) {
                $log->forceFill([
                    'record_id' => 'CCTV-' . str_pad((string) $log->id, 6, '0', STR_PAD_LEFT),
                ])->saveQuietly();
            }
        });
    }

    public function camera(): BelongsTo
    {
        return $this->belongsTo(Camera::class);
    }

    public function registeredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registered_by');
    }

    public function hashRecord(): HasOne
    {
        return $this->hasOne(HashRecord::class, 'log_id');
    }

    public function blockchainTransactions(): HasMany
    {
        return $this->hasMany(BlockchainTransaction::class, 'log_id');
    }

    public function alerts(): MorphMany
    {
        return $this->morphMany(Alert::class, 'alertable');
    }
}
