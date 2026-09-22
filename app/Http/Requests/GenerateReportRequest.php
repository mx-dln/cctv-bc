<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GenerateReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'type' => 'nullable|string|in:verification,tamper_check,general',
            'format' => 'nullable|string|in:pdf,excel',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
            'camera_id' => 'nullable|exists:cameras,id',
            'status' => 'nullable|in:verified,tampered,pending,registered,missing',
            'operator' => 'nullable|string|max:255',
            'search' => 'nullable|string|max:255',
        ];
    }
}
