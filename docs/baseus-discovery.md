# Baseus S0TV00 LAN Discovery

The application does not use `192.168.100.70` as a permanent camera address. That value is only a current test-network example. Baseus S0TV00 is identified by device identity first, then by its current DHCP IP.

## Identity

- Manufacturer: Baseus
- Model: S0TV00
- Known MAC: `A4:40:3D:05:B9:87`
- Discovery/verification port: TCP `6668`

The persistent identity is the MAC address when available. If MAC information is unavailable on a network, the system falls back to a conservative fingerprint using manufacturer/model, TCP `6668`, and a non-invasive protocol reachability check.

## Discovery Flow

The `CameraDiscovery` service runs discovery in this order:

1. Read active private IPv4 interfaces on the PC.
2. Determine the local subnet for each active private LAN interface.
3. Read the existing ARP table.
4. Look for the known Baseus MAC or matching OUI.
5. Verify TCP `6668` is reachable.
6. If ARP does not reveal the camera, scan only private local subnet hosts, capped to `/24` scale by default.
7. Return structured camera objects for verified Baseus candidates.

Example result:

```json
{
  "id": "baseus-a4-40-3d-05-b9-87",
  "manufacturer": "Baseus",
  "model": "S0TV00",
  "ip": "192.168.1.37",
  "mac": "A4:40:3D:05:B9:87",
  "port": 6668,
  "status": "online"
}
```

## DHCP/IP Changes

When the camera moves from `192.168.100.70` to another DHCP address such as `192.168.1.37` or `10.0.0.25`, the saved IP is treated only as the last known address. If it fails, discovery can run again and reconnect to the same camera identity.

## Security Limits

- Scans only private local IPv4 ranges.
- Does not scan public/external IP addresses.
- Does not guess passwords.
- Does not bypass authentication.
- Does not exploit, modify firmware, or factory reset the device.
- Does not assume RTSP, ONVIF, or that TCP `6668` carries video.

## UI

Go to `Settings > CCTV Provider`, then use `Baseus LAN Camera Discovery > Scan Network`. If a camera is found, the page shows the current IP, MAC, port, and status. Press `Connect` to save it as the active Baseus evidence source.
