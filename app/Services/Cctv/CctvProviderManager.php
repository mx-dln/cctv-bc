<?php

namespace App\Services\Cctv;

use App\Contracts\CctvProviderInterface;

class CctvProviderManager
{
    private CctvProviderFactory $factory;
    private ?CctvProviderInterface $provider = null;

    public function __construct(CctvProviderFactory $factory)
    {
        $this->factory = $factory;
    }

    public function provider(): CctvProviderInterface
    {
        if ($this->provider === null) {
            $this->provider = $this->factory->create();
        }
        return $this->provider;
    }

    public function refresh(): CctvProviderInterface
    {
        $this->provider = $this->factory->create();
        return $this->provider;
    }
}
