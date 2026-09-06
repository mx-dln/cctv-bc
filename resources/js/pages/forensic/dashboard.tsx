import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    ShieldCheck, Activity, FileText, Blocks, AlertTriangle,
    CheckCircle2, XCircle, TrendingUp, Scale, Server, Cpu,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ForensicDashboard({ integrityScore, healthScore, blockchainMode, custodyStats }: any) {
    const gaugeColor = (score: number) => {
        if (score >= 95) return 'text-green-400';
        if (score >= 85) return 'text-[#AD9334]';
        if (score >= 70) return 'text-yellow-400';
        return 'text-red-400';
    };

    const gaugeBar = (score: number) => {
        const color = score >= 95 ? 'bg-green-400' : score >= 85 ? 'bg-[#AD9334]' : score >= 70 ? 'bg-yellow-400' : 'bg-red-400';
        return (
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div className={`h-full rounded-full transition-all duration-1000 ${color}`} style={{ width: `${score}%` }} />
            </div>
        );
    };

    return (
        <>
            <Head title="Forensic Dashboard" />
            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Forensic Dashboard</h1>
                        <p className="text-sm text-gray-400">Evidence integrity, health, and blockchain status</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`flex items-center gap-2 ${
                            blockchainMode.mode === 'fabric_connected' ? 'border-green-500 text-green-400' :
                            blockchainMode.mode === 'fabric_ready' ? 'border-yellow-500 text-yellow-400' :
                            'border-[#AD9334] text-[#AD9334]'
                        }`}>
                            <Server className="h-4 w-4" />
                            {blockchainMode.label}
                        </Badge>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <ShieldCheck className="h-5 w-5 text-[#AD9334]" /> Forensic Integrity Score
                            </CardTitle>
                            <CardDescription>Overall evidence integrity rating</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-center py-4">
                                <div className="relative flex h-36 w-36 items-center justify-center">
                                    <svg className="absolute inset-0 h-36 w-36 -rotate-90" viewBox="0 0 120 120">
                                        <circle cx="60" cy="60" r="54" fill="none" stroke="#2A2D4A" strokeWidth="8" />
                                        <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="8"
                                            strokeDasharray={`${(integrityScore.score / 100) * 339.292} 339.292`}
                                            strokeLinecap="round" className={gaugeColor(integrityScore.score)} />
                                    </svg>
                                    <div className="text-center">
                                        <p className={`text-4xl font-bold ${gaugeColor(integrityScore.score)}`}>
                                            {integrityScore.score}%
                                        </p>
                                        <p className="text-xs text-gray-500">{integrityScore.label}</p>
                                    </div>
                                </div>
                            </div>
                            {gaugeBar(integrityScore.score)}
                            <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
                                <div><p className="text-xl font-bold text-white">{integrityScore.verified}</p><p className="text-xs text-gray-500">Verified</p></div>
                                <div><p className="text-xl font-bold text-red-400">{integrityScore.tampered}</p><p className="text-xs text-gray-500">Tampered</p></div>
                                <div><p className="text-xl font-bold text-white">{integrityScore.total}</p><p className="text-xs text-gray-500">Total</p></div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <Activity className="h-5 w-5 text-[#AD9334]" /> Forensic Health Score
                            </CardTitle>
                            <CardDescription>Multi-factor system health assessment</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-center py-4">
                                <div className="relative flex h-36 w-36 items-center justify-center">
                                    <svg className="absolute inset-0 h-36 w-36 -rotate-90" viewBox="0 0 120 120">
                                        <circle cx="60" cy="60" r="54" fill="none" stroke="#2A2D4A" strokeWidth="8" />
                                        <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="8"
                                            strokeDasharray={`${(healthScore.score / 100) * 339.292} 339.292`}
                                            strokeLinecap="round" className={gaugeColor(healthScore.score)} />
                                    </svg>
                                    <div className="text-center">
                                        <p className={`text-4xl font-bold ${gaugeColor(healthScore.score)}`}>
                                            {healthScore.score}%
                                        </p>
                                        <p className="text-xs text-gray-500">{healthScore.label}</p>
                                    </div>
                                </div>
                            </div>
                            {gaugeBar(healthScore.score)}
                            <div className="mt-4 space-y-2">
                                {Object.entries(healthScore.factors || {}).map(([key, val]: any) => (
                                    <div key={key} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                                        <span className="text-xs text-gray-400 capitalize">{key.replace(/_/g, ' ')}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10">
                                                <div className={`h-full rounded-full ${val.score >= 85 ? 'bg-[#AD9334]' : val.score >= 70 ? 'bg-yellow-400' : 'bg-red-400'}`}
                                                    style={{ width: `${val.score}%` }} />
                                            </div>
                                            <span className="text-xs text-white font-medium">{val.score.toFixed(0)}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-xs text-gray-400">
                                <FileText className="h-3.5 w-3.5 text-[#AD9334]" /> Custody Records
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-white">{custodyStats?.total_records || 0}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-xs text-gray-400">
                                <TrendingUp className="h-3.5 w-3.5 text-[#AD9334]" /> Verification Rate
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-white">{integrityScore.score}%</p>
                        </CardContent>
                    </Card>
                    <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-xs text-gray-400">
                                <Blocks className="h-3.5 w-3.5 text-[#AD9334]" /> Blockchain Mode
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Badge variant="outline" className={`${
                                blockchainMode.mode === 'fabric_connected' ? 'border-green-500 text-green-400' :
                                blockchainMode.mode === 'fabric_ready' ? 'border-yellow-500 text-yellow-400' :
                                'border-[#AD9334] text-[#AD9334]'
                            }`}>{blockchainMode.label}</Badge>
                        </CardContent>
                    </Card>
                    <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-xs text-gray-400">
                                <Scale className="h-3.5 w-3.5 text-[#AD9334]" /> Evidence Actions
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-white">
                                {Object.keys(custodyStats?.action_counts || {}).length}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

ForensicDashboard.layout = (props: any) => ({
    breadcrumbs: [
        { title: 'Forensic Audit', href: '/forensic' },
        { title: 'Forensic Dashboard', href: '/forensic/dashboard' },
    ],
});
