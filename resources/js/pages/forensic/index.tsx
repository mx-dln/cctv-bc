import { apiFetch } from '@/lib/api-fetch';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    SearchCheck, Search, Loader2, ShieldCheck, AlertTriangle,
    Clock, Hash, Blocks, CheckCircle2, XCircle, FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function ForensicIndex() {
    const [eventId, setEventId] = useState('');
    const [events, setEvents] = useState<any[]>([]);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [loadingEvents, setLoadingEvents] = useState(true);

    useEffect(() => {
        apiFetch('/events?limit=100', { headers: { 'Accept': 'application/json' } })
            .then(r => r.json())
            .then(data => {
                setEvents(data.logs?.data || []);
                setLoadingEvents(false);
            })
            .catch(() => setLoadingEvents(false));
    }, []);

    const handleAnalyze = async () => {
        if (!eventId) return;
        setAnalyzing(true);
        setResult(null);
        try {
            const res = await apiFetch('/forensic/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ log_id: eventId }),
            });
            const data = await res.json();
            if (data.error) {
                toast.error(data.error);
            } else {
                setResult(data);
                toast.success('Forensic analysis complete');
            }
        } catch {
            toast.error('Failed to analyze log');
        }
        setAnalyzing(false);
    };

    return (
        <>
            <Head title="Forensic Audit" />
            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Forensic Audit</h1>
                        <p className="text-sm text-gray-400">Deep forensic analysis of CCTV log integrity</p>
                    </div>
                </div>

                <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <SearchCheck className="h-5 w-5 text-[#AD9334]" /> Analyze Event
                        </CardTitle>
                        <CardDescription>Select a CCTV event to perform forensic analysis</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <Label className="text-gray-400">Select Event</Label>
                                <Select value={eventId} onValueChange={setEventId}>
                                    <SelectTrigger className="w-full border-white/10 bg-white/5 text-white">
                                        <SelectValue placeholder={loadingEvents ? 'Loading events...' : 'Choose an event to analyze'} />
                                    </SelectTrigger>
                                    <SelectContent position="popper" className="w-[--radix-select-trigger-width] border-white/10 bg-gray-900 text-white">
                                        {events.map((ev: any) => (
                                            <SelectItem key={ev.event_id || ev.id} value={ev.event_id || ''}>
                                                {ev.event_id?.slice(0, 12)}... - {ev.camera?.name || '?'} - {ev.label || ev.event_type} ({new Date(ev.started_at).toLocaleDateString()})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end">
                                <Button
                                    onClick={handleAnalyze}
                                    disabled={analyzing || !eventId}
                                    className="bg-gradient-to-r from-[#AD9334] to-[#C2A74A] text-white hover:from-[#C2A74A] hover:to-[#AD9334]"
                                >
                                    {analyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                                    Analyze
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {result && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className={`rounded-xl border p-6 ${result.hash_verification?.status === 'verified' ? 'border-[#AD9334]/50 bg-[#AD9334]/10' : 'border-red-500/50 bg-red-500/10'}`}>
                            <div className="flex items-center gap-3">
                                {result.hash_verification?.status === 'verified' ? (
                                    <ShieldCheck className="h-8 w-8 text-[#AD9334]" />
                                ) : (
                                    <AlertTriangle className="h-8 w-8 text-red-400" />
                                )}
                                <div>
                                    <h2 className="text-xl font-bold text-white">
                                        Status: {result.hash_verification?.status?.toUpperCase()}
                                    </h2>
                                    <p className="text-sm text-gray-400">
                                        Event {result.log?.event_id?.slice(0, 16)}... - {result.log?.camera?.name}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-3">
                            <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center gap-2 text-sm text-gray-400">
                                        <Hash className="h-4 w-4 text-[#AD9334]" /> Original Hash
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="break-all font-mono text-xs text-[#AD9334]">{result.hash_verification?.original_hash}</p>
                                </CardContent>
                            </Card>
                            <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center gap-2 text-sm text-gray-400">
                                        <Hash className="h-4 w-4 text-[#C2A74A]" /> Current Hash
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="break-all font-mono text-xs text-[#C2A74A]">{result.hash_verification?.current_hash}</p>
                                </CardContent>
                            </Card>
                            <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center gap-2 text-sm text-gray-400">
                                        <Blocks className="h-4 w-4 text-[#AD9334]" /> Blockchain Hash
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="break-all font-mono text-xs text-[#AD9334]">{result.blockchain_verification?.blockchain_hash || result.hash_verification?.original_hash || 'N/A'}</p>
                                </CardContent>
                            </Card>
                        </div>

                        {result.tamper_details?.differences && Object.keys(result.tamper_details.differences).length > 0 && (
                            <Card className="border-red-500/50 bg-gradient-to-br from-red-900/30 to-gray-800/80 backdrop-blur-xl">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-red-400">
                                        <AlertTriangle className="h-5 w-5" /> Tampered Fields
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {Object.entries(result.tamper_details.differences).map(([field, vals]: [string, any]) => (
                                            <div key={field} className="rounded-lg bg-white/5 p-3">
                                                <p className="mb-1 text-sm font-medium text-gray-300">{field.replace(/_/g, ' ')}</p>
                                                <div className="flex items-center gap-3 text-xs">
                                                    <span className="text-red-400 line-through">{String(vals.original)}</span>
                                                    <span className="text-gray-500">→</span>
                                                    <span className="text-[#C2A74A]">{String(vals.current)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-white">
                                    <Clock className="h-5 w-5 text-[#AD9334]" /> Verification Timeline
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {result.timeline?.map((event: any, i: number) => (
                                        <div key={i} className="flex gap-3">
                                            <div className="flex flex-col items-center">
                                                <div className={`rounded-full p-1.5 ${
                                                    event.type === 'log_created' ? 'bg-[#AD9334]/20 text-[#AD9334]' :
                                                    event.type === 'hash_generated' ? 'bg-[#C2A74A]/20 text-[#C2A74A]' :
                                                    event.type === 'blockchain_commit' ? 'bg-[#AD9334]/20 text-[#AD9334]' :
                                                    'bg-[#C2A74A]/20 text-[#C2A74A]'
                                                }`}>
                                                    {event.type === 'log_created' ? <FileText className="h-3.5 w-3.5" /> :
                                                     event.type === 'hash_generated' ? <Hash className="h-3.5 w-3.5" /> :
                                                     event.type === 'blockchain_commit' ? <Blocks className="h-3.5 w-3.5" /> :
                                                     <ShieldCheck className="h-3.5 w-3.5" />}
                                                </div>
                                                {i < result.timeline.length - 1 && <div className="h-8 w-px bg-white/10" />}
                                            </div>
                                            <div className="pb-4">
                                                <p className="text-sm font-medium text-white">{event.label}</p>
                                                <p className="text-xs text-gray-400">{event.description}</p>
                                                <p className="text-xs text-gray-500">{new Date(event.timestamp).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </div>
        </>
    );
}

ForensicIndex.layout = (props: any) => ({
    breadcrumbs: [{ title: 'Forensic Audit', href: '/forensic' }],
});
