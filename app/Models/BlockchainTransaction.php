<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class BlockchainTransaction extends Model
{
    protected $fillable = [
        'log_id',
        'transaction_id',
        'block_number',
        'channel',
        'chaincode',
        'status',
        'response',
        'error_message',
        'committed_at',
    ];

    protected $casts = [
        'response' => 'array',
        'committed_at' => 'datetime',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function (BlockchainTransaction $tx) {
            if (empty($tx->transaction_id)) {
                $tx->transaction_id = 'TX-' . strtoupper(Str::random(16));
            }
        });
    }

    public function log(): BelongsTo
    {
        return $this->belongsTo(GeneratedLog::class, 'log_id');
    }
}
