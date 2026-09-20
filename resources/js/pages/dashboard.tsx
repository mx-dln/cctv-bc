import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    Blocks,
    Camera,
    CheckCircle2,
    Clock,
    Database,
    FileCheck2,
    FileClock,
    HardDrive,
    ShieldCheck,
    Upload,
    UserRound,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const statusBadge: Record<string, string> = {
    committed: 'border-[#AD9334]/50 bg-[#AD9334]/10 text-[#E8D787]',
    pending: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-200',
    failed: 'border-red-500/50 bg-red-500/10 text-red-200',
};

const evidenceBadge: Record<string, string> = {
    verified: 'border-[#AD9334]/50 bg-[#AD9334]/10 text-[#E8D787]',
    pending: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-200',
    tampered: 'border-red-500/50 bg-red-500/10 text-red-200',
    missing: 'border-orange-500/50 bg-orange-500/10 text-orange-200',
};

function shortTxId(transactionId?: string | null) {
    if (!transactionId) {
        return 'No transaction ID';
    }

    return transactionId.length > 18 ? `${transactionId.slice(0, 10)}...${transactionId.slice(-6)}` : transactionId;
}

function formatDateTime(value?: string | null) {
    if (!value) {
        return '-';
    }

    return new Date(value).toLocaleString();
}

function SummaryCard({ title, value, subtitle, icon: Icon }: { title: string; value: string | number; subtitle: string; icon: any }) {
    return (
        <Card className="border-white/10 bg-[#131827]">
            <CardContent className="flex items-start justify-between gap-4 p-5">
                <div>
                    <p className="text-sm text-gray-400">{title}</p>
                    <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
                    <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
                </div>
                <div className="rounded-lg bg-[#AD9334]/15 p-3 text-[#E8D787]">
                    <Icon className="h-5 w-5" />
                </div>
            </CardContent>
        </Card>
    );
}

function WorkflowStep({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
    return (
        <div className="flex min-w-0 items-start gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="rounded-md bg-[#352A6F]/70 p-2 text-[#E8D787]">
                <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="mt-1 text-xs leading-5 text-gray-400">{description}</p>
            </div>
        </div>
    );
}

export default function Dashboard({
    stats,
    recentEvents,
    recentAlerts,
    providerConnected,
    providerName,
    recentTransactions,
    recentActivity,
    blockchainMode,
}: any) {
    return (
        <>
            <Head title="Dashboard" />
            <div className="space-y-6 p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Chain-of-Custody Control Panel</h1>
                        <p className="text-sm text-gray-400">Register CCTV footage from private storage, hash it, commit the proof, then verify integrity.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button asChild className="bg-[#AD9334] text-white hover:bg-[#C2A74A]">
                            <Link href="/custody-records">
                                <Upload className="mr-2 h-4 w-4" />
                                Register Evidence
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="border-white/10 text-gray-200">
                            <Link href="/verification">
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                Verify Evidence
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard title="Evidence Records" value={stats.total_events} icon={FileCheck2} subtitle={`${stats.events_today} registered today`} />
                    <SummaryCard title="Fabric Commits" value={stats.successful_transactions} icon={Blocks} subtitle={`${stats.blockchain_transactions} blockchain transactions`} />
                    <SummaryCard title="Pending Verification" value={stats.pending_events + (stats.registered_events ?? 0)} icon={Clock} subtitle="Needs integrity check" />
                    <SummaryCard title="Unresolved Alerts" value={stats.active_alerts} icon={AlertTriangle} subtitle={`${stats.critical_alerts} critical`} />
                </div>

                <Card className="border-white/10 bg-[#131827]">
                    <CardHeader>
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <CardTitle className="text-white">Evidence Flow</CardTitle>
                                <CardDescription>The system stores footage privately and writes only the proof hash and custody metadata to Hyperledger Fabric.</CardDescription>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="outline" className={providerConnected ? 'border-[#AD9334]/50 text-[#E8D787]' : 'border-red-500/50 text-red-200'}>
                                    {providerConnected ? `${providerName} connected` : 'DVR/NVR not connected'}
                                </Badge>
                                <Badge variant="outline" className="border-[#AD9334]/50 text-[#E8D787]">
                                    {blockchainMode?.label ?? 'Hyperledger Fabric'}
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                            <WorkflowStep icon={Camera} title="Camera" description="CCTV source captures the original video." />
                            <WorkflowStep icon={HardDrive} title="DVR/NVR Storage" description="Footage remains in local or private storage." />
                            <WorkflowStep icon={ShieldCheck} title="SHA-256 Hash" description="The system generates a digital fingerprint." />
                            <WorkflowStep icon={Blocks} title="Fabric Ledger" description="Hash and metadata are committed to Hyperledger." />
                            <WorkflowStep icon={CheckCircle2} title="Verification" description="Footage is checked against the ledger proof." />
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <Card className="border-white/10 bg-[#131827]">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <FileCheck2 className="h-4 w-4 text-[#AD9334]" />
                                Recent Evidence
                            </CardTitle>
                            <CardDescription>Latest registered CCTV custody records</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {recentEvents.map((event: any) => (
                                <div key={event.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-semibold text-white">{event.label || event.event_id}</p>
                                                <Badge variant="outline" className={evidenceBadge[event.status] ?? 'border-gray-500/50 text-gray-300'}>
                                                    {event.status}
                                                </Badge>
                                            </div>
                                            <p className="mt-1 text-sm text-gray-400">{event.camera?.name ?? 'No camera'} - {formatDateTime(event.started_at)}</p>
                                        </div>
                                        <Button asChild size="sm" variant="outline" className="border-white/10 text-gray-200">
                                            <Link href="/verification">Verify</Link>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {recentEvents.length === 0 && (
                                <div className="rounded-lg border border-dashed border-white/10 p-8 text-center">
                                    <p className="text-sm font-medium text-gray-300">No evidence records yet</p>
                                    <p className="mt-1 text-xs text-gray-500">Register CCTV footage to create the first custody record.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-[#131827]">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <AlertTriangle className="h-4 w-4 text-[#AD9334]" />
                                Latest Alerts
                            </CardTitle>
                            <CardDescription>Recent alert history and unresolved items</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {recentAlerts.map((alert: any) => (
                                <div key={alert.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                                    <p className="text-sm font-medium text-gray-100">{alert.message}</p>
                                    <div className="mt-2 flex items-center justify-between gap-3 text-xs text-gray-500">
                                        <span>{formatDateTime(alert.created_at)}</span>
                                        <div className="flex gap-2">
                                            <Badge variant="outline" className="capitalize text-gray-300">{alert.severity}</Badge>
                                            <Badge variant="outline" className={alert.resolved_at ? 'border-[#AD9334]/50 text-[#E8D787]' : 'border-red-500/50 text-red-200'}>
                                                {alert.resolved_at ? 'Resolved' : 'Unresolved'}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {recentAlerts.length === 0 && (
                                <div className="rounded-lg border border-dashed border-white/10 p-8 text-center">
                                    <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-[#AD9334]" />
                                    <p className="text-sm font-medium text-gray-300">No alerts recorded</p>
                                    <p className="mt-1 text-xs text-gray-500">Verification and custody alert history is empty.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                    <Card className="border-white/10 bg-[#131827]">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <Database className="h-4 w-4 text-[#AD9334]" />
                                Latest Fabric Proofs
                            </CardTitle>
                            <CardDescription>Recent Hyperledger commit records</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {recentTransactions.map((tx: any) => (
                                <div key={tx.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4">
                                    <div className="min-w-0">
                                        <p className="break-all text-sm font-medium text-gray-100">{shortTxId(tx.transaction_id)}</p>
                                        <p className="mt-1 text-xs text-gray-500">{formatDateTime(tx.created_at)}</p>
                                    </div>
                                    <Badge variant="outline" className={`shrink-0 capitalize ${statusBadge[tx.status] ?? 'border-gray-500/50 text-gray-300'}`}>
                                        {tx.status}
                                    </Badge>
                                </div>
                            ))}
                            {recentTransactions.length === 0 && (
                                <div className="rounded-lg border border-dashed border-white/10 p-8 text-center text-sm text-gray-500">
                                    No Fabric commits yet
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-[#131827]">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <FileClock className="h-4 w-4 text-[#AD9334]" />
                                Recent Audit Trail
                            </CardTitle>
                            <CardDescription>Recent accountable custody actions</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {recentActivity.slice(0, 6).map((entry: any) => (
                                <div key={entry.id} className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4">
                                    <div className="mt-0.5 rounded-md bg-[#352A6F]/60 p-2 text-[#E8D787]">
                                        <UserRound className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                            <p className="text-sm font-medium text-gray-100">{entry.user?.name ?? 'System'}</p>
                                            <span className="text-xs text-gray-600">/</span>
                                            <p className="text-sm text-gray-300">{String(entry.action).replaceAll('_', ' ')}</p>
                                        </div>
                                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                            <span>{formatDateTime(entry.created_at)}</span>
                                            {entry.properties?.record_id && <span className="rounded bg-white/5 px-1.5 py-0.5 text-gray-300">{entry.properties.record_id}</span>}
                                            {entry.properties?.result && <span className="capitalize text-[#E8D787]">{entry.properties.result}</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {recentActivity.length === 0 && (
                                <div className="rounded-lg border border-dashed border-white/10 p-8 text-center text-sm text-gray-500">
                                    No audit entries yet
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = (props: any) => ({ breadcrumbs: [{ title: 'Dashboard', href: '/dashboard' }] });
