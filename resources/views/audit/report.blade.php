<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $report->title }}</title>
    <style>
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 11px; color: #1a1a2e; }
        .header { text-align: center; border-bottom: 2px solid #AD9334; padding-bottom: 15px; margin-bottom: 20px; }
        .header h1 { color: #352A6F; font-size: 20px; margin: 0; }
        .header p { color: #666; font-size: 11px; margin: 5px 0 0; }
        .summary { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .summary-box { background: #f5f5f5; padding: 10px 15px; border-radius: 5px; text-align: center; flex: 1; margin: 0 5px; }
        .summary-box h3 { margin: 0; font-size: 22px; color: #352A6F; }
        .summary-box p { margin: 3px 0 0; font-size: 10px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th { background: #352A6F; color: #fff; padding: 8px 10px; text-align: left; font-size: 10px; }
        td { padding: 6px 10px; border-bottom: 1px solid #e0e0e0; font-size: 10px; }
        tr:nth-child(even) { background: #fafafa; }
        .footer { text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #e0e0e0; font-size: 9px; color: #999; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 9px; }
        .badge-verified { background: #AD9334; color: #fff; }
        .badge-tampered { background: #dc3545; color: #fff; }
        .badge-pending { background: #ffc107; color: #333; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $report->title }}</h1>
        <p>Generated: {{ $report->generated_at->format('Y-m-d H:i:s') }} | Report ID: {{ $report->report_id }}</p>
    </div>

    <div class="summary">
        <div class="summary-box"><h3>{{ $report->summary['total_logs'] ?? 0 }}</h3><p>Total Events</p></div>
        <div class="summary-box"><h3 style="color:#AD9334">{{ $report->summary['verified_count'] ?? 0 }}</h3><p>Verified</p></div>
        <div class="summary-box"><h3 style="color:#dc3545">{{ $report->summary['tampered_count'] ?? 0 }}</h3><p>Tampered</p></div>
        <div class="summary-box"><h3>{{ $report->summary['verification_rate'] ?? 0 }}%</h3><p>Integrity Rate</p></div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Event ID</th>
                <th>Camera</th>
                <th>Timestamp</th>
                <th>Type</th>
                <th>Duration</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @forelse($logs as $log)
            <tr>
                <td>{{ substr($log->event_id, 0, 16) }}...</td>
                <td>{{ $log->camera->name ?? 'N/A' }}</td>
                <td>{{ $log->started_at ? $log->started_at->format('Y-m-d H:i') : '-' }}</td>
                <td>{{ $log->label ?? $log->event_type }}</td>
                <td>{{ $log->duration ? $log->duration . 's' : '-' }}</td>
                <td><span class="badge badge-{{ $log->status }}">{{ strtoupper($log->status) }}</span></td>
            </tr>
            @empty
            <tr><td colspan="6" style="text-align:center;color:#999;">No events found matching the report criteria.</td></tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">
        FICOBank Chain of Custody System | Blockchain-Augmented CCTV Forensic Integrity Platform
    </div>
</body>
</html>
