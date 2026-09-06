<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Alert extends Model
{
    protected $fillable = [
        'alert_id',
        'type',
        'severity',
        'message',
        'context',
        'alertable_id',
        'alertable_type',
        'is_read',
        'read_at',
        'resolved_by',
        'resolved_at',
    ];

    protected $casts = [
        'context' => 'array',
        'is_read' => 'boolean',
        'read_at' => 'datetime',
        'resolved_at' => 'datetime',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function (Alert $alert) {
            if (empty($alert->alert_id)) {
                $alert->alert_id = 'ALERT-' . strtoupper(Str::random(10));
            }
        });
    }

    public function alertable(): MorphTo
    {
        return $this->morphTo();
    }

    public function resolver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }
}
