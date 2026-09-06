import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Cctv, CheckCircle2, XCircle, Clock, Wifi, WifiOff, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { GeneratedLog } from '@/types';

const labelColors: Record<string, string> = {
    person: 'border-sky-500 text-sky-400 bg-sky-500/10',
    car: 'border-blue-500 text-blue-400 bg-blue-500/10',
    dog: 'border-orange-500 text-orange-400 bg-orange-500/10',
    cat: 'border-yellow-500 text-yellow-400 bg-yellow-500/10',
    package: 'border-purple-500 text-purple-400 bg-purple-500/10',
    unknown: 'border-gray-500 text-gray-400 bg-gray-500/10',
};

export default function EventIndex({ logs, providerConnected, providerName }: { logs: { data: GeneratedLog[] }; providerConnected: boolean; providerName: string }) {
    return (
        <>
            <Head title="CCTV Events" />
            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">CCTV Events</h1>
                        <p className="text-sm text-gray-400">Real events from {providerName} NVR</p>
                    </div>
                    <Badge variant="outline" className={`flex items-center gap-2 ${providerConnected ? 'border-green-500 text-green-400' : 'border-red-500 text-red-400'}`}>
                        {providerConnected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                        {providerConnected ? 'Connected' : 'Disconnected'}
                    </Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
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
                                <CheckCircle2 className="h-4 w-4 text-green-400" /> Verified
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-green-400">{logs.data.filter(l => l.status === 'verified').length}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm text-gray-400">
                                <XCircle className="h-4 w-4 text-red-400" /> Tampered
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-red-400">{logs.data.filter(l => l.status === 'tampered').length}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-gray-400">Provider</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-white capitalize">{providerName}</p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="text-white">Event Feed</CardTitle>
                        <CardDescription>Real-time CCTV detection events</CardDescription>
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
                                        <th className="pb-3 font-medium">Score</th>
                                        <th className="pb-3 font-medium">Status</th>
                                        <th className="pb-3 font-medium">Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.data.map((log) => (
                                        <motion.tr key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                            className="border-b border-white/5 text-sm transition-colors hover:bg-white/5"
                                        >
                                            <td className="py-3 font-mono text-xs text-[#AD9334]">{log.event_id?.slice(0, 12)}...</td>
                                            <td className="py-3 text-gray-300">{log.camera?.name || '-'}</td>
                                            <td className="py-3 text-gray-400">{log.started_at ? new Date(log.started_at).toLocaleString() : '-'}</td>
                                            <td className="py-3">
                                                <Badge variant="outline" className={`${labelColors[log.label?.toLowerCase()] || 'border-gray-500 text-gray-300'}`}>
                                                    {log.label || log.event_type}
                                                </Badge>
                                            </td>
                                            <td className="py-3 text-gray-400">{log.duration ? `${log.duration}s` : '-'}</td>
                                            <td className="py-3 text-gray-400">{log.score ? `${(log.score * 100).toFixed(0)}%` : '-'}</td>
                                            <td className="py-3">
                                                <Badge variant="outline" className={`flex w-fit items-center gap-1 ${
                                                    log.status === 'verified' ? 'border-green-500 text-green-400' :
                                                    log.status === 'tampered' ? 'border-red-500 text-red-400' : 'border-yellow-500 text-yellow-400'
                                                }`}>
                                                    {log.status === 'verified' ? <CheckCircle2 className="h-3 w-3" /> :
                                                     log.status === 'tampered' ? <XCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                                                    {log.status}
                                                </Badge>
                                            </td>
                                            <td className="py-3">
                                                <Link href={`/events/${log.id}`}>
                                                    <Badge variant="outline" className="cursor-pointer border-[#AD9334] text-[#AD9334] hover:bg-[#AD9334]/20">
                                                        <ExternalLink className="mr-1 h-3 w-3" /> View
                                                    </Badge>
                                                </Link>
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

EventIndex.layout = (props: any) => ({ breadcrumbs: [{ title: 'CCTV Events', href: '/events' }] });
