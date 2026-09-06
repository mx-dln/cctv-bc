<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class EvidenceRecord extends Model
{
    protected $fillable = [
        'custody_id', 'event_id', 'user_id', 'action', 'role', 'remarks', 'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function (EvidenceRecord $r) {
            if (empty($r->custody_id)) {
                $r->custody_id = 'CST-' . strtoupper(Str::random(12));
            }
        });
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(GeneratedLog::class, 'event_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
