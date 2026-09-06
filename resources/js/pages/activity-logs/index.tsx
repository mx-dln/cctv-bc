import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Activity, Search, Filter, User, Monitor } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ActivityLog } from '@/types';

export default function ActivityLogIndex({ logs, actions, modules, filters }: {
    logs: { data: ActivityLog[] };
    actions: string[];
    modules: string[];
    filters: any;
}) {
    const [action, setAction] = useState(filters.action || '');
    const [module, setModule] = useState(filters.module || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const applyFilters = () => {
        router.get('/activity-logs', { action, module, date_from: dateFrom, date_to: dateTo }, { preserveState: true });
    };

    return (
        <>
            <Head title="Activity Logs" />
            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Activity Logs</h1>
                        <p className="text-sm text-gray-400">System-wide activity tracking</p>
                    </div>
                </div>

                <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Filter className="h-5 w-5 text-[#AD9334]" /> Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-4">
                            <div className="space-y-2">
                                <Label className="text-gray-400">Action</Label>
                                <Select value={action} onValueChange={setAction}>
                                    <SelectTrigger className="w-full border-white/10 bg-white/5 text-white">
                                        <SelectValue placeholder="All actions" />
                                    </SelectTrigger>
                                    <SelectContent position="popper" className="w-[--radix-select-trigger-width] border-white/10 bg-gray-900 text-white">
                                        <SelectItem value="">All</SelectItem>
                                        {actions.map(a => <SelectItem key={a} value={a}>{a.replace(/_/g, ' ')}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-400">Module</Label>
                                <Select value={module} onValueChange={setModule}>
                                    <SelectTrigger className="w-full border-white/10 bg-white/5 text-white">
                                        <SelectValue placeholder="All modules" />
                                    </SelectTrigger>
                                    <SelectContent position="popper" className="w-[--radix-select-trigger-width] border-white/10 bg-gray-900 text-white">
                                        <SelectItem value="">All</SelectItem>
                                        {modules.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
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
                        <CardTitle className="text-white">Activity Entries</CardTitle>
                        <CardDescription>System audit trail</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {logs.data.map((log) => (
                                <div key={log.id} className="flex items-start gap-3 rounded-lg bg-white/5 p-3 transition-colors hover:bg-white/10">
                                    <div className="mt-1 rounded-full bg-[#AD9334]/20 p-1.5 text-[#AD9334]">
                                        <Activity className="h-3.5 w-3.5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-white">{log.action.replace(/_/g, ' ')}</span>
                                            <Badge variant="outline" className="border-[#AD9334]/50 text-xs text-[#AD9334]">{log.module}</Badge>
                                        </div>
                                        {log.description && <p className="mt-0.5 text-xs text-gray-400">{log.description}</p>}
                                        <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <User className="h-3 w-3" /> {log.user?.name || 'System'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Monitor className="h-3 w-3" /> {log.ip_address || '-'}
                                            </span>
                                            <span>{new Date(log.created_at).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

ActivityLogIndex.layout = (props: any) => ({
    breadcrumbs: [
        { title: 'Activity Logs', href: '/activity-logs' },
    ],
});
