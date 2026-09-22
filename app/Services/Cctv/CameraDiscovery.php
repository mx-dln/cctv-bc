<?php

namespace App\Services\Cctv;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class CameraDiscovery
{
    public function discoverBaseus(): array
    {
        $target = config('baseus.s0tv00');
        $interfaces = $this->activePrivateInterfaces();
        $arpDevices = $this->arpDevices();
        $candidates = $this->baseusCandidatesFromArp($arpDevices, $target);

        if ($candidates->isEmpty()) {
            $candidates = $this->scanPrivateSubnets($interfaces, (int) $target['port'])
                ->map(fn (array $device) => $this->withArpIdentity($device, $arpDevices, $target));
        }

        $verified = $candidates
            ->map(fn (array $device) => $this->verifyBaseusDevice($device, $target))
            ->filter(fn (array $device) => $device['verified'] === true)
            ->values();

        return [
            'status' => $verified->isNotEmpty() ? 'found' : 'not_found',
            'interfaces' => $interfaces->values()->all(),
            'cameras' => $verified->all(),
            'attempted_methods' => [
                'existing_arp_table',
                'local_subnet_discovery',
                'tcp_6668_verification',
                'udp_discovery_not_supported_without_vendor_packet',
                'mdns_not_observed_for_baseus_s0tv00',
                'ssdp_not_observed_for_baseus_s0tv00',
                'ws_discovery_onvif_not_assumed',
            ],
            'limitations' => [
                'Discovery is restricted to private LAN interfaces.',
                'The camera IP is dynamic and is not used as persistent identity.',
                'TCP 6668 is treated as a reachability/protocol fingerprint until Baseus publishes protocol details.',
            ],
        ];
    }

    public function findBaseus(): ?array
    {
        return $this->discoverBaseus()['cameras'][0] ?? null;
    }

    public function activePrivateInterfaces(): Collection
    {
        $output = PHP_OS_FAMILY === 'Windows'
            ? $this->runCommand('ipconfig')
            : $this->runCommand('ip -o -4 addr show up');

        return PHP_OS_FAMILY === 'Windows'
            ? $this->parseWindowsInterfaces($output)
            : $this->parseUnixInterfaces($output);
    }

    public function arpDevices(): Collection
    {
        $output = $this->runCommand('arp -a');
        preg_match_all('/(?P<ip>(?:\d{1,3}\.){3}\d{1,3})\s+(?P<mac>(?:[0-9a-fA-F]{2}[:-]){5}[0-9a-fA-F]{2})/', $output, $matches, PREG_SET_ORDER);

        return collect($matches)
            ->map(fn (array $match) => [
                'ip' => $match['ip'],
                'mac' => $this->normalizeMac($match['mac']),
            ])
            ->filter(fn (array $device) => $this->isPrivateIpv4($device['ip']))
            ->unique('ip')
            ->values();
    }

    private function baseusCandidatesFromArp(Collection $arpDevices, array $target): Collection
    {
        $knownMac = $this->normalizeMac($target['known_mac'] ?? '');
        $oui = substr($knownMac, 0, 8);

        return $arpDevices
            ->filter(fn (array $device) => $device['mac'] === $knownMac || str_starts_with($device['mac'], $oui))
            ->filter(fn (array $device) => $this->tcpPortOpen($device['ip'], (int) $target['port']))
            ->values();
    }

    private function scanPrivateSubnets(Collection $interfaces, int $port): Collection
    {
        $hosts = $interfaces
            ->flatMap(function (array $interface) use ($port) {
                return $this->hostsForInterface($interface);
            })
            ->unique()
            ->values();

        return $this->tcpPortOpenMany($hosts, $port)
            ->map(fn (string $ip) => ['ip' => $ip, 'mac' => null])
            ->values();
    }

    private function withArpIdentity(array $device, Collection $arpDevices, array $target): array
    {
        $arp = $arpDevices->firstWhere('ip', $device['ip']);

        return [
            ...$device,
            'mac' => $arp['mac'] ?? $device['mac'] ?? null,
            'port' => (int) $target['port'],
        ];
    }

    private function verifyBaseusDevice(array $device, array $target): array
    {
        $knownMac = $this->normalizeMac($target['known_mac'] ?? '');
        $deviceMac = $this->normalizeMac($device['mac'] ?? '');
        $port = (int) $target['port'];
        $portOpen = $this->tcpPortOpen($device['ip'], $port);
        $macMatches = $deviceMac !== '' && $deviceMac === $knownMac;
        $ouiMatches = $deviceMac !== '' && str_starts_with($deviceMac, substr($knownMac, 0, 8));
        $protocolFingerprint = $this->protocolFingerprint($device['ip'], $port);
        $verified = $portOpen && ($macMatches || ($ouiMatches && $protocolFingerprint['tcp_reachable']));

        return [
            'id' => $deviceMac !== '' ? 'baseus-'.$this->slugMac($deviceMac) : 'baseus-'.str_replace('.', '-', $device['ip']),
            'manufacturer' => $target['manufacturer'],
            'model' => $target['model'],
            'ip' => $device['ip'],
            'mac' => $deviceMac ?: null,
            'port' => $port,
            'status' => $portOpen ? 'online' : 'offline',
            'verified' => $verified,
            'identity_method' => $macMatches ? 'known_mac' : ($ouiMatches ? 'mac_oui_and_tcp_fingerprint' : 'unverified'),
            'protocol_fingerprint' => $protocolFingerprint,
        ];
    }

    private function protocolFingerprint(string $ip, int $port): array
    {
        $started = microtime(true);
        $socket = @fsockopen($ip, $port, $errno, $errstr, (float) config('baseus.discovery.connect_timeout_seconds', 0.35));

        if (!$socket) {
            return [
                'tcp_reachable' => false,
                'response_time_ms' => null,
                'banner' => null,
                'note' => 'TCP port is closed or filtered.',
            ];
        }

        stream_set_timeout($socket, 0, 200000);
        $banner = @fread($socket, 64);
        fclose($socket);

        return [
            'tcp_reachable' => true,
            'response_time_ms' => (int) round((microtime(true) - $started) * 1000),
            'banner' => $banner !== false && $banner !== '' ? bin2hex($banner) : null,
            'note' => 'Non-invasive TCP connect check only; no authentication bypass or command sent.',
        ];
    }

    private function tcpPortOpen(string $ip, int $port): bool
    {
        if (!$this->isPrivateIpv4($ip)) {
            return false;
        }

        $socket = @fsockopen($ip, $port, $errno, $errstr, (float) config('baseus.discovery.connect_timeout_seconds', 0.35));
        if (!$socket) {
            return false;
        }

        fclose($socket);

        return true;
    }

    private function tcpPortOpenMany(Collection $hosts, int $port): Collection
    {
        $open = collect();
        $timeout = (float) config('baseus.discovery.connect_timeout_seconds', 0.25);
        $batchSize = max(8, (int) config('baseus.discovery.batch_size', 64));

        foreach ($hosts->chunk($batchSize) as $batch) {
            $sockets = [];

            foreach ($batch as $ip) {
                if (!$this->isPrivateIpv4($ip)) {
                    continue;
                }

                $socket = @stream_socket_client(
                    "tcp://{$ip}:{$port}",
                    $errno,
                    $errstr,
                    $timeout,
                    STREAM_CLIENT_ASYNC_CONNECT | STREAM_CLIENT_CONNECT
                );

                if ($socket) {
                    stream_set_blocking($socket, false);
                    $sockets[(int) $socket] = ['ip' => $ip, 'socket' => $socket];
                }
            }

            if ($sockets === []) {
                continue;
            }

            $write = array_column($sockets, 'socket');
            $read = [];
            $except = [];
            $seconds = (int) floor($timeout);
            $microseconds = (int) (($timeout - $seconds) * 1_000_000);

            if (@stream_select($read, $write, $except, $seconds, $microseconds) !== false) {
                foreach ($write as $socket) {
                    $ip = $sockets[(int) $socket]['ip'];
                    $open->push($ip);
                }
            }

            foreach ($sockets as $item) {
                fclose($item['socket']);
            }
        }

        return $open->unique()->values();
    }

    private function parseWindowsInterfaces(string $output): Collection
    {
        $interfaces = collect();
        $blocks = preg_split('/\R(?=[^\s].*adapter\s)/i', $output) ?: [];

        foreach ($blocks as $block) {
            preg_match('/IPv4 Address[.\s]*:\s*(?<ip>(?:\d{1,3}\.){3}\d{1,3})/i', $block, $ip);
            preg_match('/Subnet Mask[.\s]*:\s*(?<mask>(?:\d{1,3}\.){3}\d{1,3})/i', $block, $mask);

            if (!empty($ip['ip']) && !empty($mask['mask']) && $this->isPrivateIpv4($ip['ip'])) {
                $interfaces->push([
                    'name' => trim(strtok($block, "\r\n")),
                    'ip' => $ip['ip'],
                    'netmask' => $mask['mask'],
                    'cidr' => $this->netmaskToCidr($mask['mask']),
                ]);
            }
        }

        return $interfaces->unique('ip')->values();
    }

    private function parseUnixInterfaces(string $output): Collection
    {
        preg_match_all('/\d+:\s+(?<name>\S+)\s+inet\s+(?<ip>(?:\d{1,3}\.){3}\d{1,3})\/(?<cidr>\d+)/', $output, $matches, PREG_SET_ORDER);

        return collect($matches)
            ->filter(fn (array $match) => $this->isPrivateIpv4($match['ip']))
            ->map(fn (array $match) => [
                'name' => $match['name'],
                'ip' => $match['ip'],
                'netmask' => null,
                'cidr' => (int) $match['cidr'],
            ])
            ->unique('ip')
            ->values();
    }

    private function hostsForInterface(array $interface): Collection
    {
        $cidr = (int) ($interface['cidr'] ?? 24);
        if ($cidr < 24) {
            $cidr = 24;
        }

        $network = ip2long($interface['ip']) & (-1 << (32 - $cidr));
        $size = min((2 ** (32 - $cidr)) - 2, (int) config('baseus.discovery.max_subnet_hosts', 254));

        return collect(range(1, max(1, $size)))
            ->map(fn (int $offset) => long2ip($network + $offset))
            ->filter(fn (string $ip) => $ip !== $interface['ip'] && $this->isPrivateIpv4($ip));
    }

    private function isPrivateIpv4(string $ip): bool
    {
        return filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4 | FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false
            && filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) !== false
            && !str_starts_with($ip, '127.');
    }

    private function netmaskToCidr(string $netmask): int
    {
        return substr_count(decbin((int) sprintf('%u', ip2long($netmask))), '1');
    }

    private function normalizeMac(?string $mac): string
    {
        if (!$mac) {
            return '';
        }

        $hex = strtoupper(preg_replace('/[^0-9A-Fa-f]/', '', $mac) ?? '');

        return strlen($hex) === 12 ? implode(':', str_split($hex, 2)) : '';
    }

    private function slugMac(string $mac): string
    {
        return strtolower(str_replace(':', '-', $mac));
    }

    private function runCommand(string $command): string
    {
        try {
            return shell_exec($command) ?: '';
        } catch (\Throwable $exception) {
            Log::debug('Camera discovery command failed', ['command' => $command, 'error' => $exception->getMessage()]);

            return '';
        }
    }
}
