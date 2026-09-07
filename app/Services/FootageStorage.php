<?php

namespace App\Services;

use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Support\Facades\Storage;

class FootageStorage
{
    public function disk(string $path): Filesystem
    {
        return Storage::disk(str_starts_with($path, 'private-cctv/') ? 'local' : 'public');
    }

    public function exists(?string $path): bool
    {
        return $path && !str_contains($path, ':') && !str_contains($path, '..')
            && !str_starts_with($path, '/') && !str_contains($path, '\\')
            && $this->disk($path)->exists($path);
    }
}
