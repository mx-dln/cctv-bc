import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Camera, Cctv, ShieldCheck, Siren, Blocks, Activity, Bell, Clock,
    CheckCircle2, XCircle, AlertTriangle, TrendingUp, TrendingDown,
    Server, Cpu, HardDrive, Monitor, Database, FileClock, UserRound,
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const COLORS = { verified: '#AD9334', tampered: '#ef4444', pending: '#C2A74A', primary: '#AD9334' };

const severityBadge: Record<string, string> = {
    low: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
};

const statusBadge: Record<string, string> = {
    committed: 'border-[#AD9334]/50 bg-[#AD9334]/10 text-[#E8D787]',
    pending: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-200',
    failed: 'border-red-500/50 bg-red-500/10 text-red-200',
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

function StatCard({ title, value, icon: Icon, color, subtitle }: { title: string; value: string | number; icon: any; color: string; subtitle?: string }) {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-6 backdrop-blur-xl transition-all hover:shadow-2xl hover:shadow-indigo-500/10 dark:from-gray-900/50 dark:to-gray-800/50"
        >
            <div className={`absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full opacity-10 blur-3xl ${color}`} />
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-400">{title}</p>
                    <p className="text-3xl font-bold tracking-tight text-white">{value}</p>
                    {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
                </div>
                <div className={`rounded-lg p-3 bg-opacity-20 ${color.replace('bg-', 'bg-').replace('text-', 'text-')}`}>
                    <Icon className="h-6 w-6 text-white" />
                </div>
            </div>
        </motion.div>
    );
}

export default function Dashboard({ stats, dailyEvents, verificationTrend, tamperTrend, blockchainCommitTrend, recentEvents, recentAlerts, cameraStatuses, providerConnected, providerName, providerStats, recentTransactions, recentActivity, blockchainMode }: any) {
    const isDahua = providerName?.toLowerCase().includes('dahua');
    const storageUsage = providerStats?.storage_usage || '0%';
    const cpuUsage = providerStats?.cpu_usage || '0%';
    const memUsage = providerStats?.memory_usage || '0%';
    const deviceModel = providerStats?.model || providerStats?.device_name || '-';
    const firmwareVer = providerStats?.firmware || '-';
    const diskCount = providerStats?.disk_count ?? '-';
    const channelCount = providerStats?.channels ?? '-';
    const statusData = [
        { name: 'Online', value: stats.online_cameras, color: '#AD9334' },
        { name: 'Offline', value: stats.offline_cameras, color: '#ef4444' },
        { name: 'Disconnected', value: stats.disconnected_cameras, color: '#C2A74A' },
    ];

    const statusDot: Record<string, string> = {
        online: 'bg-[#AD9334] shadow-[#AD9334]/50',
        offline: 'bg-red-500 shadow-red-500/50',
        disconnected: 'bg-[#C2A74A] shadow-[#C2A74A]/50',
    };

    return (
        <>
            <Head title="Dashboard" />
            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Chain of Custody Dashboard</h1>
                        <p className="text-sm text-gray-400">Blockchain-Augmented CCTV Forensic Integrity System</p>
                    </div>
                    <Badge variant="outline" className={`flex items-center gap-2 ${providerConnected ? 'border-[#AD9334] text-[#AD9334]' : 'border-red-500 text-red-400'}`}>
                        <span className={`inline-block h-2 w-2 rounded-full ${providerConnected ? 'bg-[#AD9334]' : 'bg-red-500'} shadow-lg`} />
                        {providerConnected ? `${providerName} Connected` : 'Disconnected'}
                    </Badge>
                </div>

                {isDahua && providerConnected && (
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card className="border-white/10 bg-gradient-to-br from-[#352A6F]/40 to-gray-800/80 backdrop-blur-xl">
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-xs text-gray-400"><Server className="h-3.5 w-3.5 text-[#AD9334]" /> DVR Device</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm font-medium text-white">{deviceModel}</p>
                                <p className="text-xs text-gray-500">{firmwareVer}</p>
                            </CardContent>
                        </Card>
                        <Card className="border-white/10 bg-gradient-to-br from-[#352A6F]/40 to-gray-800/80 backdrop-blur-xl">
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-xs text-gray-400"><Cpu className="h-3.5 w-3.5 text-[#AD9334]" /> CPU / Memory</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm font-medium text-white">{cpuUsage} CPU</p>
                                <p className="text-xs text-gray-500">{memUsage} Memory</p>
                            </CardContent>
                        </Card>
                        <Card className="border-white/10 bg-gradient-to-br from-[#352A6F]/40 to-gray-800/80 backdrop-blur-xl">
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-xs text-gray-400"><HardDrive className="h-3.5 w-3.5 text-[#AD9334]" /> Storage</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm font-medium text-white">{storageUsage}</p>
                                <p className="text-xs text-gray-500">{diskCount} disk(s)</p>
                            </CardContent>
                        </Card>
                        <Card className="border-white/10 bg-gradient-to-br from-[#352A6F]/40 to-gray-800/80 backdrop-blur-xl">
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-xs text-gray-400"><Monitor className="h-3.5 w-3.5 text-[#AD9334]" /> Channels</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm font-medium text-white">{channelCount}</p>
                                <p className="text-xs text-gray-500">{stats.online_cameras} online</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard title="Total CCTV Records" value={stats.total_events} icon={Cctv} color="bg-[#352A6F]" subtitle={`${stats.events_today} registered today`} />
                    <StatCard title="Verified Records" value={stats.verified_events} icon={ShieldCheck} color="bg-[#AD9334]" subtitle={`${stats.total_events > 0 ? ((stats.verified_events / stats.total_events) * 100).toFixed(1) : 0}% integrity rate`} />
                    <StatCard title="Altered Records" value={stats.tampered_events} icon={Siren} color="bg-red-500" subtitle="Hash mismatch detected" />
                    <StatCard title="Missing Records" value={stats.missing_events ?? 0} icon={AlertTriangle} color="bg-orange-500" subtitle="Footage unavailable" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard title="Total Cameras" value={stats.total_cameras} icon={Camera} color="bg-[#352A6F]" subtitle={`${stats.online_cameras} online, ${stats.offline_cameras} offline`} />
                    <StatCard title="Blockchain TX" value={stats.blockchain_transactions} icon={Blocks} color="bg-[#352A6F]" subtitle={`${stats.successful_transactions} successful`} />
                    <StatCard title="Active Alerts" value={stats.active_alerts} icon={Bell} color="bg-[#AD9334]" subtitle={`${stats.critical_alerts} critical`} />
                    <StatCard title="Registered" value={stats.registered_events ?? 0} icon={Activity} color="bg-[#352A6F]" subtitle="Committed, awaiting verification" />
                    <StatCard title="Pending" value={stats.pending_events} icon={Clock} color="bg-[#C2A74A]" subtitle="Awaiting registration" />
                </div>

                <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr_1.4fr]">
                    <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <Database className="h-4 w-4 text-[#AD9334]" />
                                Blockchain
                            </CardTitle>
                            <CardDescription>Ledger connection mode</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Badge variant="outline" className="border-[#AD9334]/50 bg-[#AD9334]/10 text-[#E8D787]">
                                    {blockchainMode?.label ?? 'Unknown'}
                                </Badge>
                            </div>
                            <div className="space-y-2 rounded-lg bg-white/5 p-3">
                                <p className="text-xs uppercase tracking-wide text-gray-500">Confirmed Transactions</p>
                                <p className="text-2xl font-semibold text-white">{stats.successful_transactions}</p>
                                <p className="text-xs text-gray-400">
                                    Permissioned chain-of-custody ledger for CCTV evidence integrity.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <Blocks className="h-4 w-4 text-[#AD9334]" />
                                Recent Transactions
                            </CardTitle>
                            <CardDescription>Latest blockchain commit records</CardDescription>
                        </CardHeader>
                        <CardContent className="max-h-[320px] space-y-3 overflow-y-auto">
                            {recentTransactions.map((tx: any) => (
                                <div key={tx.id} className="rounded-lg bg-white/5 p-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="break-all text-sm font-medium text-gray-100">{shortTxId(tx.transaction_id)}</p>
                                            <p className="mt-1 text-xs text-gray-500">{formatDateTime(tx.created_at)}</p>
                                        </div>
                                        <Badge variant="outline" className={`shrink-0 capitalize ${statusBadge[tx.status] ?? 'border-gray-500/50 text-gray-300'}`}>
                                            {tx.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                            {recentTransactions.length === 0 && (
                                <div className="rounded-lg border border-dashed border-white/10 p-6 text-center text-sm text-gray-500">
                                    No blockchain transactions yet
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <FileClock className="h-4 w-4 text-[#AD9334]" />
                                Audit Trail
                            </CardTitle>
                            <CardDescription>Recent accountable system actions</CardDescription>
                        </CardHeader>
                        <CardContent className="max-h-[320px] space-y-3 overflow-y-auto">
                            {recentActivity.map((entry: any) => (
                                <div key={entry.id} className="flex gap-3 rounded-lg bg-white/5 p-3">
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
                                <div className="rounded-lg border border-dashed border-white/10 p-6 text-center text-sm text-gray-500">
                                    No audit entries yet
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="text-white">Daily Event Trend</CardTitle>
                            <CardDescription>Last 7 days of CCTV events</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={dailyEvents}>
                                    <defs>
                                        <linearGradient id="verifiedGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#AD9334" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#AD9334" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="tamperedGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="date" stroke="#6b7280" tick={{ fill: '#9ca3af' }} />
                                    <YAxis stroke="#6b7280" tick={{ fill: '#9ca3af' }} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#f3f4f6' }} />
                                    <Area type="monotone" dataKey="verified" stroke="#6366f1" fill="url(#verifiedGrad)" strokeWidth={2} />
                                    <Area type="monotone" dataKey="tampered" stroke="#ef4444" fill="url(#tamperedGrad)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="text-white">Tamper Detection Trend</CardTitle>
                            <CardDescription>30-day tamper detection history</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={tamperTrend}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="date" stroke="#6b7280" tick={{ fill: '#9ca3af' }} />
                                    <YAxis stroke="#6b7280" tick={{ fill: '#9ca3af' }} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#f3f4f6' }} />
                                    <Line type="monotone" dataKey="tampered_count" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="text-white">Camera Status</CardTitle>
                            <CardDescription>Live camera status distribution</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="mt-4 space-y-2">
                                {cameraStatuses.slice(0, 6).map((camera: any) => (
                                    <div key={camera.id} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`inline-block h-2.5 w-2.5 rounded-full shadow-lg ${statusDot[camera.status] || 'bg-gray-500'}`} />
                                            <span className="text-sm text-gray-300">{camera.name}</span>
                                        </div>
                                        <Badge variant="outline" className="text-xs capitalize text-gray-400">{camera.status}</Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="text-white">Recent Events</CardTitle>
                            <CardDescription>Latest CCTV events from Dahua DVR</CardDescription>
                        </CardHeader>
                        <CardContent className="max-h-[400px] space-y-3 overflow-y-auto">
                            {recentEvents.map((event: any) => (
                                <div key={event.id} className="flex items-start gap-3 rounded-lg bg-white/5 p-3 transition-colors hover:bg-white/10">
                                    <div className={`mt-1 rounded-full p-1.5 ${
                                        event.status === 'verified' ? 'bg-green-500/20 text-green-400' :
                                        event.status === 'tampered' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                                    }`}>
                                        {event.status === 'verified' ? <CheckCircle2 className="h-3.5 w-3.5" /> :
                                         event.status === 'tampered' ? <XCircle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-200">{event.label || event.event_type} <span className="text-xs text-gray-500">({event.event_id?.slice(0, 8)}...)</span></p>
                                        <p className="text-xs text-gray-500">{event.camera?.name} - {new Date(event.started_at).toLocaleString()}</p>
                                    </div>
                                    <Badge variant="outline" className={`text-xs ${
                                        event.status === 'verified' ? 'border-[#AD9334] text-[#AD9334]' :
                                        event.status === 'tampered' ? 'border-red-500 text-red-400' : 'border-[#C2A74A] text-[#C2A74A]'
                                    }`}>{event.status}</Badge>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="text-white">Active Alerts</CardTitle>
                            <CardDescription>Pending security alerts</CardDescription>
                        </CardHeader>
                        <CardContent className="max-h-[400px] space-y-3 overflow-y-auto">
                            {recentAlerts.map((alert: any) => (
                                <div key={alert.id} className="flex items-start gap-3 rounded-lg bg-white/5 p-3 transition-colors hover:bg-white/10">
                                    <AlertTriangle className={`mt-1 h-4 w-4 ${
                                        alert.severity === 'critical' ? 'text-red-400' :
                                        alert.severity === 'high' ? 'text-orange-400' : 'text-yellow-400'
                                    }`} />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-200">{alert.message}</p>
                                        <p className="text-xs text-gray-500">{new Date(alert.created_at).toLocaleString()}</p>
                                    </div>
                                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${severityBadge[alert.severity] || ''}`}>{alert.severity}</span>
                                </div>
                            ))}
                            {recentAlerts.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                                    <CheckCircle2 className="mb-2 h-8 w-8 text-green-500" />
                                    <p>No active alerts</p>
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
