<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TamperLogRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'recorded_at' => 'nullable|date',
            'event_type' => 'nullable|string',
            'duration_seconds' => 'nullable|integer|min:1',
            'filename' => 'nullable|string|max:255',
            'resolution' => 'nullable|string|max:20',
            'frame_rate' => 'nullable|integer|min:1|max:120',
            'file_size_bytes' => 'nullable|integer|min:1',
        ];
    }
}
