import { apiFetch } from '@/lib/api-fetch';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Download, FileDown, FileSpreadsheet, FileText, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { AuditReport, GeneratedLog } from '@/types';

export default function AuditIndex({ reports, recentLogs, stats }: {
    reports: { data: AuditReport[] };
    recentLogs: GeneratedLog[];
    stats: { total: number; verified: number; tampered: number; pending: number };
}) {
    const [generating, setGenerating] = useState(false);

    const handleGenerate = async (format: string) => {
        setGenerating(true);
        try {
            const res = await apiFetch('/audit/generate-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: `Audit Report - ${new Date().toLocaleDateString()}`,
                    format,
                    type: 'verification',
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Report generated as ${format.toUpperCase()}`);
                router.reload({ only: ['reports'] });
            }
        } catch (error) {
            toast.error('Failed to generate report. Check that at least one evidence record exists and try again.');
        }
        setGenerating(false);
    };

    const statusClass = (status: string) => {
        if (status === 'verified') return 'border-green-500 text-green-400';
        if (status === 'tampered') return 'border-red-500 text-red-400';
        if (status === 'missing') return 'border-orange-500 text-orange-400';
        return 'border-yellow-500 text-yellow-400';
    };

    return (
        <>
            <Head title="Audit Reports" />
            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Audit Reports</h1>
                        <p className="text-sm text-gray-400">Generate and download chain-of-custody audit reports</p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => handleGenerate('pdf')} disabled={generating} className="bg-gradient-to-r from-[#AD9334] to-[#C2A74A] text-white hover:from-[#C2A74A] hover:to-[#AD9334]">
                            <FileDown className="mr-2 h-4 w-4" /> Export PDF
                        </Button>
                        <Button onClick={() => handleGenerate('excel')} disabled={generating} variant="outline" className="border-white/10 text-gray-300">
                            <FileSpreadsheet className="mr-2 h-4 w-4" /> Export Excel
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <Card className="border-white/10 bg-gray-900/80">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm text-gray-400"><FileText className="h-4 w-4 text-[#AD9334]" /> Total Evidence</CardTitle>
                        </CardHeader>
                        <CardContent><p className="text-3xl font-bold text-white">{stats.total}</p></CardContent>
                    </Card>
                    <Card className="border-white/10 bg-gray-900/80">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm text-gray-400"><CheckCircle2 className="h-4 w-4 text-green-400" /> Verified</CardTitle>
                        </CardHeader>
                        <CardContent><p className="text-3xl font-bold text-green-400">{stats.verified}</p></CardContent>
                    </Card>
                    <Card className="border-white/10 bg-gray-900/80">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm text-gray-400"><AlertTriangle className="h-4 w-4 text-red-400" /> Tampered</CardTitle>
                        </CardHeader>
                        <CardContent><p className="text-3xl font-bold text-red-400">{stats.tampered}</p></CardContent>
                    </Card>
                    <Card className="border-white/10 bg-gray-900/80">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm text-gray-400"><Clock className="h-4 w-4 text-yellow-400" /> Pending</CardTitle>
                        </CardHeader>
                        <CardContent><p className="text-3xl font-bold text-yellow-400">{stats.pending}</p></CardContent>
                    </Card>
                </div>

                <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-white">Recent Chain-of-Custody Activity</CardTitle>
                            <CardDescription>Latest evidence records and verification outcomes</CardDescription>
                        </div>
                        <Link href="/audit/logs">
                            <Button variant="outline" className="border-white/10 text-gray-300">View All Logs</Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10 text-left text-sm text-gray-400">
                                        <th className="pb-3 font-medium">Record ID</th>
                                        <th className="pb-3 font-medium">Filename</th>
                                        <th className="pb-3 font-medium">Camera</th>
                                        <th className="pb-3 font-medium">Status</th>
                                        <th className="pb-3 font-medium">Fabric</th>
                                        <th className="pb-3 font-medium">Updated</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentLogs.map((log) => (
                                        <tr key={log.id} className="border-b border-white/5 text-sm transition-colors hover:bg-white/5">
                                            <td className="py-3 font-mono text-xs text-[#AD9334]">{log.record_id ?? log.event_id}</td>
                                            <td className="py-3 text-gray-300">{log.filename ?? '-'}</td>
                                            <td className="py-3 text-gray-400">{log.camera?.name ?? '-'}</td>
                                            <td className="py-3">
                                                <Badge variant="outline" className={statusClass(log.status)}>{log.status}</Badge>
                                            </td>
                                            <td className="py-3 text-gray-400">{log.hash_record?.blockchain_transaction?.status ?? 'No transaction'}</td>
                                            <td className="py-3 text-gray-400">{new Date(log.updated_at).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {recentLogs.length === 0 && (
                            <div className="py-10 text-center">
                                <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-gray-600" />
                                <p className="text-sm text-gray-500">No evidence activity yet. Register evidence first, then verify or compare it.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="text-white">Generated Reports</CardTitle>
                        <CardDescription>Previously generated audit reports</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10 text-left text-sm text-gray-400">
                                        <th className="pb-3 font-medium">Report ID</th>
                                        <th className="pb-3 font-medium">Title</th>
                                        <th className="pb-3 font-medium">Type</th>
                                        <th className="pb-3 font-medium">Format</th>
                                        <th className="pb-3 font-medium">Total Logs</th>
                                        <th className="pb-3 font-medium">Verified</th>
                                        <th className="pb-3 font-medium">Tampered</th>
                                        <th className="pb-3 font-medium">Generated</th>
                                        <th className="pb-3 font-medium">Download</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.data.map((report) => (
                                        <tr key={report.id} className="border-b border-white/5 text-sm transition-colors hover:bg-white/5">
                                            <td className="py-3 font-mono text-xs text-[#AD9334]">{report.report_id}</td>
                                            <td className="py-3 text-white">{report.title}</td>
                                            <td className="py-3">
                                                <Badge variant="outline" className="border-gray-500 text-gray-300">{report.type}</Badge>
                                            </td>
                                            <td className="py-3">
                                                <Badge variant="outline" className={`${report.format === 'pdf' ? 'border-red-500 text-red-400' : 'border-green-500 text-green-400'}`}>
                                                    {report.format?.toUpperCase()}
                                                </Badge>
                                            </td>
                                            <td className="py-3 text-gray-400">{report.total_logs}</td>
                                            <td className="py-3 text-green-400">{report.verified_count}</td>
                                            <td className="py-3 text-red-400">{report.tampered_count}</td>
                                            <td className="py-3 text-gray-400">{new Date(report.generated_at).toLocaleString()}</td>
                                            <td className="py-3">
                                                {report.file_path ? (
                                                    <Link href={`/audit/reports/${report.id}/download`}>
                                                        <Button variant="ghost" size="icon" className="text-[#AD9334] hover:text-indigo-300">
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                ) : <span className="text-gray-600">-</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {reports.data.length === 0 && <p className="py-8 text-center text-sm text-gray-500">No reports generated yet.</p>}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

AuditIndex.layout = (props: any) => ({
    breadcrumbs: [
        { title: 'Audit Reports', href: '/audit' },
    ],
});
