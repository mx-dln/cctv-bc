<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCameraRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'provider_camera_id' => 'nullable|string|max:255',
            'name' => 'required|string|max:255',
            'location' => 'nullable|string|max:255',
            'resolution' => 'nullable|string|max:20',
            'fps' => 'nullable|integer|min:0|max:120',
            'status' => 'nullable|in:online,offline,disconnected',
        ];
    }
}
