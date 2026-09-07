import { apiFetch } from '@/lib/api-fetch';
import { Head, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Bell, AlertTriangle, CheckCircle2, Loader2, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useState } from 'react';
import type { Alert } from '@/types';

const severityDot: Record<string, string> = {
    low: 'bg-gray-500',
    medium: 'bg-yellow-500',
    high: 'bg-orange-500',
    critical: 'bg-red-500 animate-pulse',
};

const severityBadge: Record<string, string> = {
    low: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
};

export default function AlertIndex({ alerts, filters }: { alerts: { data: Alert[] }; filters: any }) {
    const [resolving, setResolving] = useState<number | null>(null);
    const [severity, setSeverity] = useState(filters.severity || '');
    const [type, setType] = useState(filters.type || '');
    const [status, setStatus] = useState(filters.status || '');

    const applyFilters = () => {
        router.get('/alerts', { severity, type, status }, { preserveState: true });
    };

    const handleResolve = async (alert: Alert) => {
        setResolving(alert.id);
        try {
            await apiFetch(`/alerts/${alert.id}/resolve`, { method: 'POST' });
            toast.success('Alert resolved');
            router.reload({ only: ['alerts'] });
        } catch {
            toast.error('Failed to resolve alert');
        }
        setResolving(null);
    };

    return (
        <>
            <Head title="Alert Center" />
            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Alert Center</h1>
                        <p className="text-sm text-gray-400">Security alerts and notifications</p>
                    </div>
                </div>

                <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Filter className="h-5 w-5 text-[#AD9334]" /> Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-3">
                            <Select value={severity || 'all'} onValueChange={value => setSeverity(value === 'all' ? '' : value)}>
                                <SelectTrigger className="w-full border-white/10 bg-white/5 text-white">
                                    <SelectValue placeholder="Severity" />
                                </SelectTrigger>
                                <SelectContent position="popper" className="w-[--radix-select-trigger-width] border-white/10 bg-gray-900 text-white">
                                    <SelectItem value="all">All Severities</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="critical">Critical</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={type || 'all'} onValueChange={value => setType(value === 'all' ? '' : value)}>
                                <SelectTrigger className="w-full border-white/10 bg-white/5 text-white">
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent position="popper" className="w-[--radix-select-trigger-width] border-white/10 bg-gray-900 text-white">
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="tamper_detected">Tamper Detected</SelectItem>
                                    <SelectItem value="missing_footage">Missing Footage</SelectItem>
                                    <SelectItem value="missing_hash">Missing Hash</SelectItem>
                                    <SelectItem value="blockchain_unavailable">Blockchain Unavailable</SelectItem>
                                    <SelectItem value="duplicate_log">Duplicate Log</SelectItem>
                                    <SelectItem value="unauthorized_change">Unauthorized Change</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={status || 'all'} onValueChange={value => setStatus(value === 'all' ? '' : value)}>
                                <SelectTrigger className="w-full border-white/10 bg-white/5 text-white">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent position="popper" className="w-[--radix-select-trigger-width] border-white/10 bg-gray-900 text-white">
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="unresolved">Unresolved</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button onClick={applyFilters} className="bg-[#AD9334] text-white hover:bg-[#C2A74A]">
                                <Filter className="mr-2 h-4 w-4" /> Apply
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="text-white">Security Alerts</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {alerts.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                                <CheckCircle2 className="mb-2 h-12 w-12 text-green-500" />
                                <p className="text-lg font-medium">No alerts</p>
                                <p className="text-sm">All systems are secure</p>
                            </div>
                        ) : (
                            alerts.data.map((alert) => (
                                <motion.div
                                    key={alert.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`rounded-xl border p-4 transition-all ${
                                        alert.is_read
                                            ? 'border-white/5 bg-white/5 opacity-60'
                                            : alert.severity === 'critical'
                                                ? 'border-red-500/50 bg-red-500/10'
                                                : alert.severity === 'high'
                                                    ? 'border-orange-500/50 bg-orange-500/10'
                                                    : 'border-white/10 bg-white/5'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-1 rounded-full p-1.5 ${
                                            alert.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                                            alert.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                                            'bg-yellow-500/20 text-yellow-400'
                                        }`}>
                                            <AlertTriangle className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-medium text-white">{alert.message}</p>
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        {new Date(alert.created_at).toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge className={severityBadge[alert.severity] || ''}>
                                                        {alert.severity}
                                                    </Badge>
                                                    {!alert.resolved_at && (
                                                        <Button
                                                            onClick={() => handleResolve(alert)}
                                                            disabled={resolving === alert.id}
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-green-400 hover:text-green-300"
                                                        >
                                                            {resolving === alert.id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <CheckCircle2 className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                            {alert.context && (
                                                <pre className="mt-2 overflow-x-auto rounded-lg bg-black/30 p-2 text-xs text-gray-400">
                                                    {JSON.stringify(alert.context, null, 2)}
                                                </pre>
                                            )}
                                            {alert.resolved_at && (
                                                <p className="mt-2 text-xs text-green-400">
                                                    Resolved at {new Date(alert.resolved_at).toLocaleString()}
                                                    {alert.resolver && ` by ${alert.resolver.name}`}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

AlertIndex.layout = (props: any) => ({
    breadcrumbs: [
        { title: 'Alert Center', href: '/alerts' },
    ],
});
