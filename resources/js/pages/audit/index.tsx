import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { FileText, Download, FileDown, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { AuditReport } from '@/types';

export default function AuditIndex({ reports }: { reports: { data: AuditReport[] } }) {
    const [generating, setGenerating] = useState(false);

    const handleGenerate = async (format: string) => {
        setGenerating(true);
        try {
            const res = await fetch('/audit/generate-report', {
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
        } catch {
            toast.error('Failed to generate report');
        }
        setGenerating(false);
    };

    const formatBytes = (bytes: number) => {
        if (!bytes) return '-';
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
    };

    return (
        <>
            <Head title="Audit Reports" />
            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Audit Reports</h1>
                        <p className="text-sm text-gray-400">Generate and download forensic audit reports</p>
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
