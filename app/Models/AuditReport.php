<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class AuditReport extends Model
{
    protected $fillable = [
        'report_id',
        'user_id',
        'title',
        'type',
        'filters',
        'summary',
        'total_logs',
        'verified_count',
        'tampered_count',
        'status',
        'format',
        'file_path',
        'generated_at',
    ];

    protected $casts = [
        'filters' => 'array',
        'summary' => 'array',
        'generated_at' => 'datetime',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function (AuditReport $report) {
            if (empty($report->report_id)) {
                $report->report_id = 'RPT-' . strtoupper(Str::random(12));
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
