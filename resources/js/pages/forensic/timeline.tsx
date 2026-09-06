import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Activity, FileText, ShieldCheck, Download, Printer,
    SearchCheck, Archive, RotateCcw, Filter, Clock, User,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const actionIcons: Record<string, any> = {
    evidence_created: FileText,
    evidence_verified: ShieldCheck,
    evidence_viewed: Activity,
    evidence_exported: Download,
    evidence_printed: Printer,
    evidence_investigated: SearchCheck,
    evidence_archived: Archive,
    evidence_reopened: RotateCcw,
};

const actionColors: Record<string, string> = {
    evidence_created: 'border-[#AD9334] text-[#AD9334] bg-[#AD9334]/10',
    evidence_verified: 'border-green-500 text-green-400 bg-green-500/10',
    evidence_viewed: 'border-blue-500 text-blue-400 bg-blue-500/10',
    evidence_exported: 'border-purple-500 text-purple-400 bg-purple-500/10',
    evidence_printed: 'border-gray-500 text-gray-300 bg-gray-500/10',
    evidence_investigated: 'border-orange-500 text-orange-400 bg-orange-500/10',
    evidence_archived: 'border-yellow-500 text-yellow-400 bg-yellow-500/10',
    evidence_reopened: 'border-cyan-500 text-cyan-400 bg-cyan-500/10',
};

export default function EvidenceTimeline({ records, stats, actions }: any) {
    const [action, setAction] = useState('');
    const [dateFrom, setDateFrom] = useState('');

    const applyFilters = () => {
        router.get('/forensic/timeline', { action, date_from: dateFrom }, { preserveState: true });
    };

    const timeAgo = (date: string) => {
        const diff = Date.now() - new Date(date).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    return (
        <>
            <Head title="Evidence Timeline" />
            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Chain of Custody Timeline</h1>
                        <p className="text-sm text-gray-400">Forensic evidence custody tracking and audit trail</p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-gray-400">Total Records</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-white">{stats?.total_records || 0}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-gray-400">Evidence Events</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-white">{stats?.unique_events || 0}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-gray-400">Officers</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-white">{stats?.unique_users || 0}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-gray-400">Actions Available</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-white">{actions?.length || 0}</p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Filter className="h-5 w-5 text-[#AD9334]" /> Filter Timeline
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-3">
                            <div className="space-y-2">
                                <Label className="text-gray-400">Action</Label>
                                <Select value={action} onValueChange={setAction}>
                                    <SelectTrigger className="w-48 border-white/10 bg-white/5 text-white">
                                        <SelectValue placeholder="All actions" />
                                    </SelectTrigger>
                                    <SelectContent className="border-white/10 bg-gray-900 text-white">
                                        <SelectItem value="">All Actions</SelectItem>
                                        {actions.map((a: string) => (
                                            <SelectItem key={a} value={a}>{a.replace(/_/g, ' ')}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-400">From</Label>
                                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border-white/10 bg-white/5 text-white" />
                            </div>
                            <div className="flex items-end">
                                <Button onClick={applyFilters} className="bg-[#AD9334] text-white hover:bg-[#C2A74A]">
                                    <Filter className="mr-2 h-4 w-4" /> Apply
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="text-white">Custody Records</CardTitle>
                        <CardDescription>Forensic chain of custody entries</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {records?.data?.map((record: any, i: number) => {
                                const Icon = actionIcons[record.action] || Activity;
                                const colorClass = actionColors[record.action] || 'border-gray-500 text-gray-400';
                                return (
                                    <motion.div key={record.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                        className="flex gap-4"
                                    >
                                        <div className="flex flex-col items-center">
                                            <div className={`rounded-full p-2 ${colorClass}`}>
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            {i < records.data.length - 1 && <div className="h-8 w-px bg-white/10" />}
                                        </div>
                                        <div className="flex-1 pb-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-white capitalize">
                                                        {record.action.replace(/_/g, ' ')}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        {record.event?.camera?.name} - {record.event?.event_id?.slice(0, 12)}...
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <Clock className="h-3 w-3" />
                                                    {timeAgo(record.created_at)}
                                                </div>
                                            </div>
                                            {record.remarks && (
                                                <p className="mt-1 text-xs text-gray-500 italic">{record.remarks}</p>
                                            )}
                                            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                                                {record.user && (
                                                    <><User className="h-3 w-3" /> {record.user.name}</>
                                                )}
                                                {record.role && (
                                                    <Badge variant="outline" className="border-[#AD9334]/50 text-[#AD9334] text-[10px]">
                                                        {record.role}
                                                    </Badge>
                                                )}
                                                <span>{new Date(record.created_at).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                            {(!records?.data || records.data.length === 0) && (
                                <div className="py-8 text-center text-sm text-gray-500">
                                    No custody records found. Events are tracked here when viewed, verified, exported, or investigated.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

EvidenceTimeline.layout = (props: any) => ({
    breadcrumbs: [
        { title: 'Forensic Audit', href: '/forensic' },
        { title: 'Evidence Timeline', href: '/forensic/timeline' },
    ],
});
