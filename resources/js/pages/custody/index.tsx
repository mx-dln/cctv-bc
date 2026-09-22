import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Blocks, CheckCircle2, FileVideo, Hash, Search, ShieldCheck, Upload } from 'lucide-react';
import { FormEvent, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const MAX_FOOTAGE_SIZE_BYTES = 1024 * 1024 * 1024;

function statusClass(status: string) {
    return {
        verified: 'border-green-500 text-green-400',
        registered: 'border-[#AD9334] text-[#AD9334]',
        tampered: 'border-red-500 text-red-400',
        missing: 'border-orange-500 text-orange-400',
        pending: 'border-yellow-500 text-yellow-400',
    }[status] ?? 'border-gray-500 text-gray-400';
}

export default function CustodyRecords({ cameras, records, search = '', providerConnected = false, providerName = 'No active evidence source' }: any) {
    const [query, setQuery] = useState(search);
    const { auth, flash } = usePage<any>().props;
    const canRegister = auth.permissions?.includes('manage-verification');
    const form = useForm({
        camera_id: cameras?.[0]?.id ?? '',
        footage: null as File | null,
        filename: '',
        recording_url: '',
        recorded_at: new Date().toISOString().slice(0, 16),
        ended_at: '',
        duration: '',
        resolution: cameras?.[0]?.resolution ?? '',
        recording_info: '',
        label: '',
    });
    const displayedFilename = form.data.footage?.name ?? form.data.filename;

    function submit(event: FormEvent) {
        event.preventDefault();
        if (form.data.footage && form.data.footage.size > MAX_FOOTAGE_SIZE_BYTES) {
            form.setError('footage', 'The CCTV footage must be 1 GB or smaller.');
            return;
        }

        form.post('/custody-records', { forceFormData: true });
    }

    function selectFootage(file: File | null) {
        form.clearErrors('footage');
        form.setData({
            ...form.data,
            footage: file,
            filename: file?.name ?? '',
            recording_url: file ? '' : form.data.recording_url,
        });

        if (file && file.size > MAX_FOOTAGE_SIZE_BYTES) {
            form.setError('footage', 'The CCTV footage must be 1 GB or smaller.');
        }
    }

    function verify(id: number) {
        router.post(`/verification/${id}/check`, {}, { preserveScroll: true });
    }

    function retryCommit(id: number) {
        router.post(`/custody-records/${id}/retry-commit`, {}, { preserveScroll: true });
    }

    return (
        <>
            <Head title="CCTV Custody Records" />
            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Evidence Registration and Verification</h1>
                    {flash?.success && <p role="status" className="text-sm text-green-400">{flash.success}</p>}
                </div>

                <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
                    {canRegister && <Card className="border-white/10 bg-gray-900/80">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white"><Upload className="h-5 w-5 text-[#AD9334]" /> Register Evidence</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form className="space-y-4" onSubmit={submit}>
                                <div className="space-y-2">
                                    <Label htmlFor="camera_id">Camera</Label>
                                    <select id="camera_id" className="w-full rounded-md border border-white/10 bg-gray-950 px-3 py-2 text-sm text-white" value={form.data.camera_id} onChange={(e) => form.setData('camera_id', e.target.value)} disabled={!providerConnected || cameras.length === 0}>
                                        {cameras.map((camera: any) => <option key={camera.id} value={camera.id}>{camera.provider_camera_id} - {camera.name}</option>)}
                                    </select>
                                    <p className={providerConnected ? 'text-xs text-gray-500' : 'text-xs text-yellow-400'}>
                                        {providerConnected ? `Source list from ${providerName}.` : 'No active footage source. Activate Baseus Wi-Fi Camera, Mock Provider, or connect a DVR/NVR in Settings.'}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="footage">CCTV footage file</Label>
                                    <Input id="footage" type="file" accept="video/*" onChange={(e) => selectFootage(e.target.files?.[0] ?? null)} />
                                    <p className="text-xs text-gray-500">Maximum upload size: 1 GB.</p>
                                </div>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="filename">Filename</Label>
                                        <Input
                                            id="filename"
                                            value={displayedFilename}
                                            onChange={(e) => form.setData('filename', e.target.value)}
                                            placeholder="Automatically uses selected footage name"
                                            readOnly={Boolean(form.data.footage)}
                                        />
                                        {form.data.footage && <p className="text-xs text-gray-500">Filename is locked to the selected CCTV footage file.</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="resolution">Resolution</Label>
                                        <Input id="resolution" value={form.data.resolution} onChange={(e) => form.setData('resolution', e.target.value)} placeholder="1920x1080" />
                                    </div>
                                </div>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="recorded_at">Date and time</Label>
                                        <Input id="recorded_at" type="datetime-local" value={form.data.recorded_at} onChange={(e) => form.setData('recorded_at', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="duration">Duration seconds</Label>
                                        <Input id="duration" type="number" min="0" value={form.data.duration} onChange={(e) => form.setData('duration', e.target.value)} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="recording_url">Already stored footage path</Label>
                                    <Input
                                        id="recording_url"
                                        value={form.data.recording_url}
                                        onChange={(e) => form.setData('recording_url', e.target.value)}
                                        placeholder="Optional, e.g. cctv-footage/recording.mp4"
                                        disabled={Boolean(form.data.footage)}
                                    />
                                    <p className="text-xs text-gray-500">Use only when the footage already exists in private storage.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="recording_info">Recording information</Label>
                                    <Input id="recording_info" value={form.data.recording_info} onChange={(e) => form.setData('recording_info', e.target.value)} placeholder="DVR channel, export operator, case notes" />
                                </div>
                                <Button type="submit" disabled={form.processing || !providerConnected || cameras.length === 0} className="w-full">
                                    <ShieldCheck className="mr-2 h-4 w-4" /> Register, Hash, and Commit
                                </Button>
                                {Object.entries(form.errors).map(([field, error]) => <p key={field} role="alert" className="text-sm text-red-400">{error}</p>)}
                            </form>
                        </CardContent>
                    </Card>}

                    <Card className="border-white/10 bg-gray-900/80">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white"><FileVideo className="h-5 w-5 text-[#AD9334]" /> Chain of Custody Records</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <form onSubmit={event => { event.preventDefault(); router.get('/custody-records', { search: query }); }} className="flex gap-2">
                                <Input aria-label="Search record ID or filename" placeholder="Record ID or filename" value={query} onChange={event => setQuery(event.target.value)} />
                                <Button type="submit" size="icon" aria-label="Search"><Search className="h-4 w-4" /></Button>
                            </form>
                            {records.data.map((record: any) => (
                                <div key={record.id} className="grid gap-3 rounded-lg border border-white/10 bg-white/5 p-4 md:grid-cols-[1fr_auto]">
                                    <div className="space-y-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-semibold text-white">{record.record_id ?? record.event_id}</span>
                                            <Badge variant="outline" className={statusClass(record.status)}>{record.status === 'tampered' ? 'altered' : record.status}</Badge>
                                            <span className="text-xs text-gray-500">{record.camera?.provider_camera_id}</span>
                                        </div>
                                        <p className="text-sm text-gray-300">{record.filename ?? record.recording_url ?? 'No filename supplied'}</p>
                                        <div className="grid gap-2 text-xs text-gray-500 md:grid-cols-3">
                                            <span className="flex items-center gap-1"><Hash className="h-3 w-3" /> {record.hash_record?.hash_value?.slice(0, 18) ?? 'No hash'}...</span>
                                            <span className="flex items-center gap-1"><Blocks className="h-3 w-3" /> {record.hash_record?.blockchain_transaction?.transaction_id ?? 'No transaction'}</span>
                                            <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {record.registered_by?.name ?? 'System'}</span>
                                        </div>
                                    </div>
                                    <a href={`/custody-records/${record.id}/download`} className="text-sm underline">Download footage</a>
                                    {canRegister && <div className="grid gap-2">
                                        {record.hash_record?.blockchain_transaction?.status !== 'committed' && (
                                            <Button variant="outline" onClick={() => retryCommit(record.id)}>
                                                <Blocks className="mr-2 h-4 w-4" /> Commit
                                            </Button>
                                        )}
                                        <Button variant="outline" onClick={() => verify(record.id)}>
                                            <Search className="mr-2 h-4 w-4" /> Verify
                                        </Button>
                                    </div>}
                                    <span className="text-xs text-gray-400">Fabric: {record.hash_record?.blockchain_transaction?.status ?? 'No transaction'}</span>
                                </div>
                            ))}
                            {records.data.length === 0 && <p className="py-10 text-center text-sm text-gray-500">No CCTV records registered yet.</p>}
                            <div className="flex gap-4">
                                {records.prev_page_url && <Link href={records.prev_page_url}>Previous</Link>}
                                {records.next_page_url && <Link href={records.next_page_url}>Next</Link>}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

CustodyRecords.layout = (props: any) => ({ breadcrumbs: [{ title: 'Evidence Register', href: '/custody-records' }] });
