import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Camera, ShieldCheck, AlertTriangle, Blocks, FileText, Activity,
    CheckCircle2, XCircle, Server, Scale, TrendingUp, Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function DefenseOverview({ integrityScore, healthScore, blockchainMode, recentCustody, custodyStats }: any) {
    const gaugeColor = (score: number) => {
        if (score >= 95) return 'text-green-400';
        if (score >= 85) return 'text-[#AD9334]';
        if (score >= 70) return 'text-yellow-400';
        return 'text-red-400';
    };

    const timeAgo = (date: string) => {
        const diff = Date.now() - new Date(date).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        return `${Math.floor(mins / 60)}h ago`;
    };

    return (
        <>
            <Head title="Executive Overview" />
            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between border-b border-[#AD9334]/30 pb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white">FICOBank Security Operations</h1>
                        <p className="text-[#AD9334] text-sm mt-1">Blockchain-Augmented CCTV Forensic Integrity Platform</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="border-[#AD9334] text-[#AD9334] text-xs px-3 py-1">CAPSTONE 2026</Badge>
                        <Badge variant="outline" className={`${
                            blockchainMode.mode === 'fabric_connected' ? 'border-green-500 text-green-400' :
                            blockchainMode.mode === 'fabric_ready' ? 'border-yellow-500 text-yellow-400' :
                            'border-[#AD9334] text-[#AD9334]'
                        }`}>
                            <Server className="mr-1 h-3 w-3" /> {blockchainMode.label}
                        </Badge>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card className="border-[#AD9334]/20 bg-gradient-to-br from-[#352A6F]/30 to-gray-900/80 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <Scale className="h-5 w-5 text-[#AD9334]" /> Evidence Integrity
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-8">
                                <div className="relative flex h-40 w-40 items-center justify-center">
                                    <svg className="absolute inset-0 h-40 w-40 -rotate-90" viewBox="0 0 120 120">
                                        <circle cx="60" cy="60" r="54" fill="none" stroke="#2A2D4A" strokeWidth="8" />
                                        <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="8"
                                            strokeDasharray={`${(integrityScore.score / 100) * 339.292} 339.292`}
                                            strokeLinecap="round" className={gaugeColor(integrityScore.score)} />
                                    </svg>
                                    <div className="text-center">
                                        <p className={`text-4xl font-bold ${gaugeColor(integrityScore.score)}`}>{integrityScore.score}%</p>
                                        <p className="text-xs text-gray-500">{integrityScore.label}</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#AD9334]" /><span className="text-white text-sm">{integrityScore.verified} Verified</span></div>
                                    <div className="flex items-center gap-2"><XCircle className="h-4 w-4 text-red-400" /><span className="text-white text-sm">{integrityScore.tampered} Tampered</span></div>
                                    <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-blue-400" /><span className="text-white text-sm">{integrityScore.total} Total Events</span></div>
                                    <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-green-400" /><span className="text-white text-sm">{custodyStats?.unique_events || 0} Evidence Records</span></div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-[#AD9334]/20 bg-gradient-to-br from-[#352A6F]/30 to-gray-900/80 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <Activity className="h-5 w-5 text-[#AD9334]" /> System Health
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-8">
                                <div className="relative flex h-40 w-40 items-center justify-center">
                                    <svg className="absolute inset-0 h-40 w-40 -rotate-90" viewBox="0 0 120 120">
                                        <circle cx="60" cy="60" r="54" fill="none" stroke="#2A2D4A" strokeWidth="8" />
                                        <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="8"
                                            strokeDasharray={`${(healthScore.score / 100) * 339.292} 339.292`}
                                            strokeLinecap="round" className={gaugeColor(healthScore.score)} />
                                    </svg>
                                    <div className="text-center">
                                        <p className={`text-4xl font-bold ${gaugeColor(healthScore.score)}`}>{healthScore.score}%</p>
                                        <p className="text-xs text-gray-500">{healthScore.label}</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#AD9334]" /><span className="text-white text-sm">{integrityScore.label} Integrity</span></div>
                                    <div className="flex items-center gap-2"><Blocks className="h-4 w-4 text-[#AD9334]" /><span className="text-white text-sm">{blockchainMode.label} Mode</span></div>
                                    <div className="flex items-center gap-2"><Camera className="h-4 w-4 text-[#AD9334]" /><span className="text-white text-sm">Provider Active</span></div>
                                    <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-[#AD9334]" /><span className="text-white text-sm">Alert System Active</span></div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-[#AD9334]/20 bg-gradient-to-br from-[#352A6F]/20 to-gray-900/80 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Clock className="h-5 w-5 text-[#AD9334]" /> Recent Chain of Custody Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {recentCustody?.slice(0, 10).map((record: any) => (
                                <motion.div key={record.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`rounded-full p-1.5 ${
                                            record.action === 'evidence_verified' ? 'bg-green-500/20 text-green-400' :
                                            record.action === 'evidence_created' ? 'bg-[#AD9334]/20 text-[#AD9334]' :
                                            record.action === 'evidence_investigated' ? 'bg-orange-500/20 text-orange-400' :
                                            'bg-blue-500/20 text-blue-400'
                                        }`}>
                                            {record.action === 'evidence_verified' ? <ShieldCheck className="h-3.5 w-3.5" /> :
                                             record.action === 'evidence_created' ? <FileText className="h-3.5 w-3.5" /> :
                                             record.action === 'evidence_investigated' ? <Activity className="h-3.5 w-3.5" /> :
                                             <Clock className="h-3.5 w-3.5" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white capitalize">{record.action.replace(/_/g, ' ')}</p>
                                            <p className="text-xs text-gray-500">{record.event?.camera?.name} — {record.user?.name || 'System'}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-500">{timeAgo(record.created_at)}</span>
                                </motion.div>
                            ))}
                            {(!recentCustody || recentCustody.length === 0) && (
                                <p className="py-4 text-center text-sm text-gray-500">No chain of custody activity yet. Events will appear here when viewed, verified, or exported.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-8 border-t border-[#AD9334]/20 pt-6 text-center">
                    <p className="text-xs text-gray-600">
                        FICOBank Chain of Custody System v2.0 | Blockchain-Augmented Digital Evidence Platform | Capstone Project 2026
                    </p>
                    <p className="mt-1 text-[10px] text-gray-700">
                        All CCTV metadata is SHA-256 hashed and committed to Hyperledger Fabric. Every event is tracked through a forensic chain of custody.
                    </p>
                </div>
            </div>
        </>
    );
}

DefenseOverview.layout = (props: any) => ({
    breadcrumbs: [
        { title: 'Forensic Audit', href: '/forensic' },
        { title: 'Executive Overview', href: '/forensic/defense' },
    ],
});
