import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Cctv, Hash, Blocks, ShieldCheck, Clock, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { GeneratedLog } from '@/types';

export default function EventShow({ log }: { log: GeneratedLog }) {
    const hash = log.hash_record;
    const tx = hash?.blockchain_transaction;

    return (
        <>
            <Head title="Event Details" />
            <div className="space-y-6 p-6">
                <div className="flex items-center gap-4">
                    <Link href="/events">
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Event Details</h1>
                        <p className="font-mono text-sm text-[#AD9334]">{log.event_id}</p>
                    </div>
                    <Badge variant="outline" className={`ml-auto flex items-center gap-1 ${
                        log.status === 'verified' ? 'border-green-500 text-green-400' :
                        log.status === 'tampered' ? 'border-red-500 text-red-400' : 'border-yellow-500 text-yellow-400'
                    }`}>
                        {log.status === 'verified' ? <CheckCircle2 className="h-4 w-4" /> :
                         log.status === 'tampered' ? <XCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                        {log.status?.toUpperCase()}
                    </Badge>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <Cctv className="h-5 w-5 text-[#AD9334]" /> Event Info
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between border-b border-white/10 pb-2">
                                <span className="text-sm text-gray-400">Camera</span>
                                <span className="text-sm text-white">{log.camera?.name || '-'}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/10 pb-2">
                                <span className="text-sm text-gray-400">Label</span>
                                <Badge variant="outline" className="border-gray-500 text-gray-300">{log.label || '-'}</Badge>
                            </div>
                            <div className="flex justify-between border-b border-white/10 pb-2">
                                <span className="text-sm text-gray-400">Started</span>
                                <span className="text-sm text-white">{log.started_at ? new Date(log.started_at).toLocaleString() : '-'}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/10 pb-2">
                                <span className="text-sm text-gray-400">Ended</span>
                                <span className="text-sm text-white">{log.ended_at ? new Date(log.ended_at).toLocaleString() : '-'}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/10 pb-2">
                                <span className="text-sm text-gray-400">Duration</span>
                                <span className="text-sm text-white">{log.duration ? `${log.duration}s` : '-'}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/10 pb-2">
                                <span className="text-sm text-gray-400">Confidence</span>
                                <span className="text-sm text-white">{log.score ? `${(log.score * 100).toFixed(0)}%` : '-'}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/10 pb-2">
                                <span className="text-sm text-gray-400">False Positive</span>
                                <span className="text-sm text-white">{log.false_positive ? 'Yes' : 'No'}</span>
                            </div>
                            {log.zones && log.zones.length > 0 && (
                                <div className="flex justify-between border-b border-white/10 pb-2">
                                    <span className="text-sm text-gray-400">Zones</span>
                                    <span className="text-sm text-white">{log.zones.join(', ')}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <Hash className="h-5 w-5 text-purple-400" /> Hash Record
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {hash ? (
                                <>
                                    <div className="flex justify-between border-b border-white/10 pb-2">
                                        <span className="text-sm text-gray-400">Algorithm</span>
                                        <span className="text-sm font-mono text-purple-400">{hash.algorithm}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/10 pb-2">
                                        <span className="text-sm text-gray-400">Hash Value</span>
                                        <span className="break-all text-xs font-mono text-purple-400">{hash.hash_value}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/10 pb-2">
                                        <span className="text-sm text-gray-400">Previous Hash</span>
                                        <span className="break-all text-xs font-mono text-gray-400">{hash.previous_hash?.slice(0, 32)}...</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/10 pb-2">
                                        <span className="text-sm text-gray-400">Chain Index</span>
                                        <span className="text-sm text-white">{hash.hash_chain_index}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/10 pb-2">
                                        <span className="text-sm text-gray-400">Generated</span>
                                        <span className="text-sm text-white">{new Date(hash.created_at).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-400">Duration</span>
                                        <span className="text-sm text-white">{hash.hash_duration_ms}ms</span>
                                    </div>
                                </>
                            ) : (
                                <p className="text-sm text-gray-500">No hash record found for this event.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Blocks className="h-5 w-5 text-cyan-400" /> Blockchain Transaction
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {tx ? (
                            <>
                                <div className="flex justify-between border-b border-white/10 pb-2">
                                    <span className="text-sm text-gray-400">TX ID</span>
                                    <span className="text-sm font-mono text-cyan-400">{tx.transaction_id}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/10 pb-2">
                                    <span className="text-sm text-gray-400">Block Number</span>
                                    <span className="text-sm text-white">{tx.block_number || 'Pending'}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/10 pb-2">
                                    <span className="text-sm text-gray-400">Channel</span>
                                    <span className="text-sm text-white">{tx.channel}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/10 pb-2">
                                    <span className="text-sm text-gray-400">Chaincode</span>
                                    <span className="text-sm text-white">{tx.chaincode}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/10 pb-2">
                                    <span className="text-sm text-gray-400">Status</span>
                                    <Badge variant="outline" className={`${
                                        tx.status === 'committed' ? 'border-green-500 text-green-400' :
                                        tx.status === 'failed' ? 'border-red-500 text-red-400' : 'border-yellow-500 text-yellow-400'
                                    }`}>{tx.status}</Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-400">Committed At</span>
                                    <span className="text-sm text-white">{tx.committed_at ? new Date(tx.committed_at).toLocaleString() : '-'}</span>
                                </div>
                            </>
                        ) : (
                            <p className="text-sm text-gray-500">No blockchain transaction found for this event.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

EventShow.layout = (props: any) => ({
    breadcrumbs: [
        { title: 'CCTV Events', href: '/events' },
        { title: 'Event Details', href: '#' },
    ],
});
