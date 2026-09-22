import { apiFetch } from '@/lib/api-fetch';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Search, Loader2, CheckCircle2, XCircle, Clock, AlertTriangle, FileSearch } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import type { GeneratedLog } from '@/types';

export default function VerificationIndex({ logs }: { logs: { data: GeneratedLog[] } }) {
    const [verifying, setVerifying] = useState<number | null>(null);
    const [comparing, setComparing] = useState<number | null>(null);
    const [comparisonFiles, setComparisonFiles] = useState<Record<number, File | null>>({});
    const [results, setResults] = useState<Record<number, any>>({});
    const [search, setSearch] = useState('');

    const filtered = logs.data.filter(l =>
        (l.event_id || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.camera?.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.label || l.event_type || '').toLowerCase().includes(search.toLowerCase())
    );

    const handleVerify = async (log: GeneratedLog) => {
        setVerifying(log.id);
        try {
            const res = await apiFetch(`/verification/${log.id}/check`, { method: 'POST' });
            const data = await res.json();
            setResults(prev => ({ ...prev, [log.id]: data }));
            toast(data.status === 'verified' ? 'Log verified successfully' : 'Tampering detected!', {
                style: data.status === 'verified'
                    ? { background: '#065f46', color: '#d1fae5' }
                    : { background: '#7f1d1d', color: '#fecaca' },
            });
            router.reload({ only: ['logs'] });
        } catch {
            toast.error('Verification failed');
        }
        setVerifying(null);
    };

    const handleCompareUpload = async (log: GeneratedLog) => {
        const file = comparisonFiles[log.id];

        if (!file) {
            toast.error('Choose the edited or questioned video first.');
            return;
        }

        setComparing(log.id);
        try {
            const body = new FormData();
            body.append('footage', file);

            const res = await apiFetch(`/verification/${log.id}/check-upload`, {
                method: 'POST',
                body,
            });
            const data = await res.json();
            setResults(prev => ({ ...prev, [log.id]: data }));
            toast(data.status === 'verified' ? 'Uploaded file matches the original evidence' : 'Uploaded file does not match the original evidence', {
                style: data.status === 'verified'
                    ? { background: '#065f46', color: '#d1fae5' }
                    : { background: '#7f1d1d', color: '#fecaca' },
            });
            router.reload({ only: ['logs'] });
        } catch {
            toast.error('Uploaded comparison failed');
        }
        setComparing(null);
    };

    const formatDuration = (sec: number | null) => {
        if (!sec) return '-';
        if (sec < 60) return `${sec}s`;
        return `${Math.floor(sec / 60)}m ${sec % 60}s`;
    };

    return (
        <>
            <Head title="Log Verification" />
            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Log Verification</h1>
                        <p className="text-sm text-gray-400">Verify CCTV log integrity against blockchain records</p>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                        <Input
                            placeholder="Search logs..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-gray-500"
                        />
                    </div>
                </div>

                <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <ShieldCheck className="h-5 w-5 text-[#AD9334]" />
                            Verification Queue
                        </CardTitle>
                    <CardDescription>Verify the stored original, or compare an edited/questioned copy against it.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10 text-left text-sm text-gray-400">
                                        <th className="pb-3 font-medium">Event ID</th>
                                        <th className="pb-3 font-medium">Camera</th>
                                        <th className="pb-3 font-medium">Timestamp</th>
                                        <th className="pb-3 font-medium">Label</th>
                                        <th className="pb-3 font-medium">Duration</th>
                                        <th className="pb-3 font-medium">Status</th>
                                        <th className="pb-3 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((log) => (
                                        <motion.tr
                                            key={log.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="border-b border-white/5 text-sm transition-colors hover:bg-white/5"
                                        >
                                            <td className="py-3 font-mono text-xs text-[#AD9334]">{log.event_id?.slice(0, 12)}...</td>
                                            <td className="py-3 text-gray-300">{log.camera?.name || '-'}</td>
                                            <td className="py-3 text-gray-400">{log.started_at ? new Date(log.started_at).toLocaleString() : '-'}</td>
                                            <td className="py-3">
                                                <Badge variant="outline" className="border-gray-500 text-gray-300">
                                                    {log.label || log.event_type || '-'}
                                                </Badge>
                                            </td>
                                            <td className="py-3 text-gray-400">{formatDuration(log.duration)}</td>
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
                                            <td className="py-3">
                                                <div className="flex min-w-[340px] flex-col gap-2">
                                                    <Button
                                                        onClick={() => handleVerify(log)}
                                                        disabled={verifying === log.id}
                                                        size="sm"
                                                        className="bg-[#AD9334] text-white hover:bg-[#C2A74A]"
                                                    >
                                                        {verifying === log.id ? (
                                                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                                        ) : (
                                                            <ShieldCheck className="mr-1 h-3 w-3" />
                                                        )}
                                                        Verify Stored Original
                                                    </Button>
                                                    <div className="grid grid-cols-[1fr_auto] gap-2">
                                                        <Input
                                                            type="file"
                                                            accept="video/*"
                                                            onChange={(event) => setComparisonFiles(prev => ({
                                                                ...prev,
                                                                [log.id]: event.target.files?.[0] ?? null,
                                                            }))}
                                                            className="h-9 border-white/10 bg-white/5 text-xs text-white file:mr-3 file:rounded file:border-0 file:bg-[#AD9334] file:px-2 file:py-1 file:text-xs file:font-medium file:text-white"
                                                        />
                                                        <Button
                                                            onClick={() => handleCompareUpload(log)}
                                                            disabled={comparing === log.id || !comparisonFiles[log.id]}
                                                            size="sm"
                                                            variant="outline"
                                                            className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                                                        >
                                                            {comparing === log.id ? (
                                                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                                            ) : (
                                                                <FileSearch className="mr-1 h-3 w-3" />
                                                            )}
                                                            Compare
                                                        </Button>
                                                    </div>
                                                    <p className="text-xs text-gray-500">
                                                        For tamper testing, choose the cut or edited copy here instead of registering it as new evidence.
                                                    </p>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {Object.keys(results).length > 0 && (
                            <div className="mt-6 space-y-4">
                                <h3 className="text-lg font-semibold text-white">Verification Results</h3>
                                {Object.entries(results).map(([logId, result]: [string, any]) => (
                                    <Card key={logId} className={`border ${
                                        result.status === 'verified' ? 'border-green-500/50' : 'border-red-500/50'
                                    } bg-white/5`}>
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-3">
                                                    {result.status === 'verified' ? (
                                                        <CheckCircle2 className="mt-1 h-6 w-6 text-green-400" />
                                                    ) : (
                                                        <AlertTriangle className="mt-1 h-6 w-6 text-red-400" />
                                                    )}
                                                    <div>
                                                        <p className="font-medium text-white">
                                                            Status: <span className={result.status === 'verified' ? 'text-green-400' : 'text-red-400'}>
                                                                {result.status.toUpperCase()}
                                                            </span>
                                                        </p>
                                                        <p className="mt-1 text-sm text-gray-400">
                                                            Local: {result.local_verification?.status} |
                                                            Blockchain: {!result.blockchain_verification || result.blockchain_verification.available === false ? 'Unavailable' : result.blockchain_verification.verified ? 'Verified' : 'Mismatch'}
                                                        </p>
                                                        {result.message && (
                                                            <p className="mt-1 text-sm text-gray-300">{result.message}</p>
                                                        )}
                                                        {result.status === 'tampered' && result.tamper_details?.differences && Object.keys(result.tamper_details.differences).length > 0 && (
                                                            <div className="mt-2">
                                                                <p className="text-sm font-medium text-red-400">Tampered Fields:</p>
                                                                {Object.entries(result.tamper_details.differences).map(([field, vals]: [string, any]) => (
                                                                    <p key={field} className="text-xs text-gray-400">
                                                                        {field}: <span className="text-red-400 line-through">{String(vals.original)}</span> → <span className="text-yellow-400">{String(vals.current)}</span>
                                                                    </p>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {result.status === 'verified' && result.local_verification?.original_footage_sha256 && (
                                                            <div className="mt-2">
                                                                <p className="text-sm font-medium text-green-400">Matching Evidence Hash:</p>
                                                                <p className="break-all text-xs text-gray-400">
                                                                    footage_sha256: <span className="text-green-300">{result.local_verification.original_footage_sha256}</span>
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-xs text-gray-500">{new Date(result.verified_at).toLocaleString()}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

VerificationIndex.layout = (props: any) => ({
    breadcrumbs: [
        { title: 'Verification', href: '/verification' },
    ],
});
