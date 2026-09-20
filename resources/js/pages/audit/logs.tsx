import { apiFetch } from '@/lib/api-fetch';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Search, Filter, FileText, Download, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { GeneratedLog, Camera } from '@/types';

export default function AuditLogs({ logs, cameras, filters }: {
    logs: { data: GeneratedLog[] };
    cameras: Camera[];
    filters: any;
}) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [cameraId, setCameraId] = useState(filters.camera_id || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const applyFilters = () => {
        router.get('/audit/logs', {
            search,
            status,
            camera_id: cameraId,
            date_from: dateFrom,
            date_to: dateTo,
        }, { preserveState: true });
    };

    const exportReport = async () => {
        const res = await apiFetch('/audit/generate-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: 'Audit Logs Export',
                format: 'pdf',
                type: 'verification',
                ...(search && { search }),
                ...(status && { status }),
                ...(cameraId && { camera_id: cameraId }),
                ...(dateFrom && { date_from: dateFrom }),
                ...(dateTo && { date_to: dateTo }),
            }),
        });
        const data = await res.json();
        if (data.success) {
            window.location.assign(`/audit/reports/${data.report.id}/download`);
        }
    };

    return (
        <>
            <Head title="Audit Logs" />
            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
                        <p className="text-sm text-gray-400">Search and filter chain-of-custody activity logs</p>
                    </div>
                    <Button onClick={exportReport} className="bg-gradient-to-r from-[#AD9334] to-[#C2A74A] text-white hover:from-[#C2A74A] hover:to-[#AD9334]">
                        <Download className="mr-2 h-4 w-4" /> Export Report
                    </Button>
                </div>

                <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Filter className="h-5 w-5 text-[#AD9334]" /> Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-5">
                            <div className="space-y-2">
                                <Label className="text-gray-400">Search</Label>
                                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Log ID, filename..." className="border-white/10 bg-white/5 text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-400">Status</Label>
                                <Select value={status || 'all'} onValueChange={value => setStatus(value === 'all' ? '' : value)}>
                                    <SelectTrigger className="w-full border-white/10 bg-white/5 text-white">
                                        <SelectValue placeholder="All statuses" />
                                    </SelectTrigger>
                                    <SelectContent position="popper" className="w-[--radix-select-trigger-width] border-white/10 bg-gray-900 text-white">
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="verified">Verified</SelectItem>
                                        <SelectItem value="tampered">Tampered</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-400">Camera</Label>
                                <Select value={cameraId || 'all'} onValueChange={value => setCameraId(value === 'all' ? '' : value)}>
                                    <SelectTrigger className="w-full border-white/10 bg-white/5 text-white">
                                        <SelectValue placeholder="All cameras" />
                                    </SelectTrigger>
                                    <SelectContent position="popper" className="w-[--radix-select-trigger-width] border-white/10 bg-gray-900 text-white">
                                        <SelectItem value="all">All</SelectItem>
                                        {cameras.map(cam => (
                                            <SelectItem key={cam.id} value={String(cam.id)}>{cam.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-400">From</Label>
                                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border-white/10 bg-white/5 text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-400">To</Label>
                                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border-white/10 bg-white/5 text-white" />
                            </div>
                        </div>
                        <Button onClick={applyFilters} className="mt-4 bg-[#AD9334] text-white hover:bg-[#C2A74A]">
                            <Search className="mr-2 h-4 w-4" /> Apply Filters
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="text-white">Log Records</CardTitle>
                        <CardDescription>{logs.data.length} logs found</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10 text-left text-sm text-gray-400">
                                        <th className="pb-3 font-medium">Log ID</th>
                                        <th className="pb-3 font-medium">Camera</th>
                                        <th className="pb-3 font-medium">Timestamp</th>
                                        <th className="pb-3 font-medium">Event</th>
                                        <th className="pb-3 font-medium">Operator</th>
                                        <th className="pb-3 font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.data.map((log) => (
                                        <tr key={log.id} className="border-b border-white/5 text-sm transition-colors hover:bg-white/5">
                                            <td className="py-3 font-mono text-xs text-[#AD9334]">{log.record_id ?? log.event_id}</td>
                                            <td className="py-3 text-gray-300">{log.camera?.name || '-'}</td>
                                            <td className="py-3 text-gray-400">{new Date(log.started_at ?? log.created_at).toLocaleString()}</td>
                                            <td className="py-3">
                                                <Badge variant="outline" className="border-gray-500 text-gray-300">
                                                    {log.event_type.replace(/_/g, ' ')}
                                                </Badge>
                                            </td>
                                            <td className="py-3 text-gray-400">{log.registered_by?.name || '-'}</td>
                                            <td className="py-3">
                                                <Badge variant="outline" className={`flex w-fit items-center gap-1 ${
                                                    log.status === 'verified' ? 'border-green-500 text-green-400' :
                                                    log.status === 'tampered' ? 'border-red-500 text-red-400' :
                                                    'border-yellow-500 text-yellow-400'
                                                }`}>
                                                    {log.status === 'verified' ? <CheckCircle2 className="h-3 w-3" /> :
                                                     log.status === 'tampered' ? <XCircle className="h-3 w-3" /> :
                                                     <Clock className="h-3 w-3" />}
                                                    {log.status}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

AuditLogs.layout = (props: any) => ({
    breadcrumbs: [
        { title: 'Audit Reports', href: '/audit' },
        { title: 'Logs', href: '/audit/logs' },
    ],
});
