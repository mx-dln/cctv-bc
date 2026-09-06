<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class HashRecord extends Model
{
    protected $fillable = [
        'log_id',
        'algorithm',
        'hash_value',
        'previous_hash',
        'hash_chain_index',
        'hashed_payload',
        'hash_duration_ms',
    ];

    protected $casts = [
        'hashed_payload' => 'array',
        'hash_duration_ms' => 'integer',
        'hash_chain_index' => 'integer',
    ];

    public function log(): BelongsTo
    {
        return $this->belongsTo(GeneratedLog::class, 'log_id');
    }

    public function blockchainTransaction(): HasOne
    {
        return $this->hasOne(BlockchainTransaction::class, 'log_id', 'log_id');
    }
}
