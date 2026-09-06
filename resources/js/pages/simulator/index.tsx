import { Head, router } from '@inertiajs/react';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Cctv, Play, Layers, RefreshCw, Loader2, CheckCircle2, XCircle, Clock, Hash, Blocks } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { GeneratedLog } from '@/types';

const eventTypeStyles: Record<string, string> = {
    recording_started: 'border-blue-500 text-blue-400 bg-blue-500/10',
    recording_stopped: 'border-gray-500 text-gray-400 bg-gray-500/10',
    motion_detection: 'border-yellow-500 text-yellow-400 bg-yellow-500/10',
    door_open: 'border-orange-500 text-orange-400 bg-orange-500/10',
    door_closed: 'border-green-500 text-green-400 bg-green-500/10',
    system_restart: 'border-purple-500 text-purple-400 bg-purple-500/10',
    storage_warning: 'border-red-500 text-red-400 bg-red-500/10',
    user_login: 'border-cyan-500 text-cyan-400 bg-cyan-500/10',
    user_logout: 'border-pink-500 text-pink-400 bg-pink-500/10',
    connection_lost: 'border-red-500 text-red-400 bg-red-500/10',
    connection_restored: 'border-green-500 text-green-400 bg-green-500/10',
};

export default function SimulatorIndex({ logs }: { logs: { data: GeneratedLog[] } }) {
    const [generating, setGenerating] = useState(false);
    const [batchGenerating, setBatchGenerating] = useState(false);
    const [autoSimulate, setAutoSimulate] = useState(false);
    const [localLogs, setLocalLogs] = useState(logs.data);

    useEffect(() => {
        setLocalLogs(logs.data);
    }, [logs.data]);

    const generateLog = useCallback(async () => {
        setGenerating(true);
        try {
            const res = await fetch('/simulator/generate', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                toast.success('CCTV log generated and committed to blockchain');
                router.reload({ only: ['logs'] });
            }
        } catch (err) {
            toast.error('Failed to generate log');
        }
        setGenerating(false);
    }, []);

    const generateBatch = useCallback(async () => {
        setBatchGenerating(true);
        try {
            const res = await fetch('/simulator/generate-batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ count: 10 }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`${data.logs_count} CCTV logs generated`);
                router.reload({ only: ['logs'] });
            }
        } catch (err) {
            toast.error('Failed to generate batch');
        }
        setBatchGenerating(false);
    }, []);

    useEffect(() => {
        if (!autoSimulate) return;
        const interval = setInterval(() => {
            fetch('/simulator/generate', { method: 'POST' })
                .then(res => res.json())
                .then(data => {
                    if (data.success) router.reload({ only: ['logs'] });
                })
                .catch(() => {});
        }, 5000);
        return () => clearInterval(interval);
    }, [autoSimulate]);

    const formatBytes = (bytes: number | null) => {
        if (!bytes) return '-';
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
    };

    return (
        <>
            <Head title="CCTV Log Simulator" />
            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">CCTV Log Simulator</h1>
                        <p className="text-sm text-gray-400">Generate realistic CCTV events with SHA-256 hashing and blockchain commit</p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={generateLog}
                            disabled={generating}
                            className="bg-gradient-to-r from-[#AD9334] to-[#C2A74A] text-white hover:from-[#C2A74A] hover:to-[#AD9334]"
                        >
                            {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                            Generate Log
                        </Button>
                        <Button
                            onClick={generateBatch}
                            disabled={batchGenerating}
                            variant="outline"
                            className="border-white/10 text-gray-300"
                        >
                            {batchGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Layers className="mr-2 h-4 w-4" />}
                            Generate 10
                        </Button>
                        <Button
                            onClick={() => setAutoSimulate(!autoSimulate)}
                            variant={autoSimulate ? 'default' : 'outline'}
                            className={autoSimulate ? 'bg-green-600 text-white' : 'border-white/10 text-gray-300'}
                        >
                            <RefreshCw className={`mr-2 h-4 w-4 ${autoSimulate ? 'animate-spin' : ''}`} />
                            {autoSimulate ? 'Auto-Running' : 'Auto'}
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-4">
                    <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm text-gray-400">
                                <Cctv className="h-4 w-4 text-[#AD9334]" /> Total Events
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-white">{logs.data.length}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm text-gray-400">
                                <Hash className="h-4 w-4 text-purple-400" /> Hash Algorithm
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-white">SHA-256</p>
                        </CardContent>
                    </Card>
                    <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm text-gray-400">
                                <Blocks className="h-4 w-4 text-cyan-400" /> Blockchain
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-white">Hyperledger</p>
                        </CardContent>
                    </Card>
                    <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm text-gray-400">
                                <RefreshCw className="h-4 w-4 text-green-400" /> Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="flex items-center gap-2 text-lg font-bold text-white">
                                <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500 shadow-lg shadow-green-500/50 animate-pulse" />
                                {autoSimulate ? 'Auto-Simulating' : 'Ready'}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="text-white">Generated CCTV Logs</CardTitle>
                        <CardDescription>Real-time log generation with hash commitment</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10 text-left text-sm text-gray-400">
                                        <th className="pb-3 font-medium">Log ID</th>
                                        <th className="pb-3 font-medium">Camera</th>
                                        <th className="pb-3 font-medium">Timestamp</th>
                                        <th className="pb-3 font-medium">Event Type</th>
                                        <th className="pb-3 font-medium">Duration</th>
                                        <th className="pb-3 font-medium">Resolution</th>
                                        <th className="pb-3 font-medium">File Size</th>
                                        <th className="pb-3 font-medium">Operator</th>
                                        <th className="pb-3 font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {localLogs.map((log) => (
                                        <motion.tr
                                            key={log.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="border-b border-white/5 text-sm transition-colors hover:bg-white/5"
                                        >
                                            <td className="py-3 font-mono text-xs text-[#AD9334]">{log.log_id}</td>
                                            <td className="py-3 text-gray-300">{log.camera?.camera_id || '-'}</td>
                                            <td className="py-3 text-gray-400">{new Date(log.recorded_at).toLocaleString()}</td>
                                            <td className="py-3">
                                                <Badge variant="outline" className={`${eventTypeStyles[log.event_type] || 'border-gray-500 text-gray-400'}`}>
                                                    {log.event_type.replace(/_/g, ' ')}
                                                </Badge>
                                            </td>
                                            <td className="py-3 text-gray-400">{log.duration_seconds ? `${Math.round(log.duration_seconds / 60)}m` : '-'}</td>
                                            <td className="py-3 font-mono text-xs text-gray-400">{log.resolution || '-'}</td>
                                            <td className="py-3 text-gray-400">{formatBytes(log.file_size_bytes)}</td>
                                            <td className="py-3 text-gray-400">{log.operator || '-'}</td>
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
                                        </motion.tr>
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

SimulatorIndex.layout = (props: any) => ({
    breadcrumbs: [
        { title: 'Log Simulator', href: '/simulator' },
    ],
});
