import { apiFetch } from '@/lib/api-fetch';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Cctv, Plus, Settings, Trash2, CheckCircle2, XCircle, Loader2, Wifi, WifiOff, Play, HardDrive, Monitor, Cpu, Server } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import SettingsNav from '@/components/settings-nav';
import { toast } from 'sonner';

export default function ProviderSettings({ connections, availableProviders }: { connections: any[]; availableProviders: Record<string, string> }) {
    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [testing, setTesting] = useState<number | null>(null);
    const [testResult, setTestResult] = useState<Record<number, any>>({});

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        provider_type: 'mock',
        host: '',
        port: '80',
        username: 'admin',
        password: '',
        https_enabled: false,
        polling_interval: '60',
        connection_timeout: '15',
        auto_sync: true,
        is_active: false,
    });

    const openCreate = () => { reset(); setEditId(null); setOpen(true); };

    const openEdit = (conn: any) => {
        setData({
            name: conn.name || '',
            provider_type: conn.provider_type || 'mock',
            host: conn.host || '',
            port: conn.port?.toString() || '80',
            username: conn.username || 'admin',
            password: '',
            https_enabled: conn.https_enabled || false,
            polling_interval: conn.polling_interval?.toString() || '60',
            connection_timeout: conn.connection_timeout?.toString() || '15',
            auto_sync: conn.auto_sync ?? true,
            is_active: conn.is_active || false,
        });
        setEditId(conn.id);
        setOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const options = { onSuccess: () => {
            setOpen(false);
            toast.success(editId ? 'Connection updated' : 'Connection created');
            router.reload();
        } };
        if (editId) put(`/settings/provider/${editId}`, options);
        else post('/settings/provider', options);
    };

    const handleTest = async (conn: any) => {
        setTesting(conn.id);
        try {
            const res = await apiFetch(`/settings/provider/${conn.id}/test`, { method: 'POST' });
            const data = await res.json();
            setTestResult(prev => ({ ...prev, [conn.id]: data }));
            toast(data.success ? 'Connection successful' : 'Connection failed', {
                style: data.success ? { background: '#065f46', color: '#d1fae5' } : { background: '#7f1d1d', color: '#fecaca' },
            });
        } catch { toast.error('Test failed'); }
        setTesting(null);
    };

    const handleDelete = (id: number) => {
        router.delete(`/settings/provider/${id}`, {
            onSuccess: () => { toast.success('Connection deleted'); router.reload(); },
        });
    };

    const handleActivate = (conn: any) => {
        router.post(`/settings/provider/${conn.id}/activate`, {}, {
            onSuccess: () => { toast.success('Provider activated'); router.reload(); },
        });
    };

    const handleDeactivate = (conn: any) => {
        router.post(`/settings/provider/${conn.id}/deactivate`, {}, {
            onSuccess: () => { toast.success('Provider deactivated'); router.reload(); },
        });
    };

    const isDahua = data.provider_type === 'dahua';

    return (
        <>
            <Head title="CCTV Provider" />
            <div className="space-y-6 p-6">
                <SettingsNav />
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">CCTV Provider Configuration</h1>
                        <p className="text-sm text-gray-400">Configure your Dahua DVR/NVR or use Mock Provider for development</p>
                    </div>
                    <Button onClick={openCreate} className="bg-gradient-to-r from-[#AD9334] to-[#C2A74A] text-white hover:from-[#C2A74A] hover:to-[#AD9334]">
                        <Plus className="mr-2 h-4 w-4" /> Add Connection
                    </Button>
                </div>

                <div className="space-y-4">
                    {connections.map((conn) => {
                        const tr = testResult[conn.id];
                        return (
                            <motion.div key={conn.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                className={`rounded-xl border p-5 transition-all ${conn.is_active ? 'border-[#AD9334]/50 bg-gradient-to-r from-[#AD9334]/10 to-[#352A6F]/10' : 'border-white/10 bg-white/5'}`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className={`rounded-lg p-3 ${conn.is_active ? 'bg-[#AD9334]/20' : 'bg-white/10'}`}>
                                            <Cctv className={`h-6 w-6 ${conn.is_active ? 'text-[#AD9334]' : 'text-gray-400'}`} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg font-semibold text-white">{conn.name}</h3>
                                                {conn.is_active && <Badge className="bg-[#AD9334] text-white">Active</Badge>}
                                                <Badge variant="outline" className="border-gray-500 text-gray-300">{availableProviders[conn.provider_type] || conn.provider_type}</Badge>
                                            </div>
                                            <div className="mt-1 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-400">
                                                {conn.host && <span>Host: {conn.host}:{conn.port}</span>}
                                                {conn.auto_sync && <span>Auto-sync: every {conn.polling_interval}s</span>}
                                                <span>Timeout: {conn.connection_timeout}s</span>
                                                <span>User: {conn.username || 'admin'}</span>
                                            </div>
                                            {conn.last_connection_status && (
                                                <div className="mt-2 flex items-center gap-2 text-sm">
                                                    {conn.last_connection_status === 'connected' ? (
                                                        <><Wifi className="h-4 w-4 text-[#AD9334]" /><span className="text-[#AD9334]">Connected</span></>
                                                    ) : (
                                                        <><WifiOff className="h-4 w-4 text-red-400" /><span className="text-red-400">Failed</span></>
                                                    )}
                                                    {conn.last_connected_at && <span className="text-gray-500">at {new Date(conn.last_connected_at).toLocaleString()}</span>}
                                                </div>
                                            )}
                                            {tr && (
                                                <div className="mt-2 text-sm">
                                                    {tr.success ? (
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2 text-[#AD9334]">
                                                                <CheckCircle2 className="h-4 w-4" />
                                                                Connected - {tr.result?.response_time_ms}ms
                                                                {tr.result?.version && <span className="text-gray-400">v{tr.result.version}</span>}
                                                            </div>
                                                            {tr.provider_info && (
                                                                <div className="grid grid-cols-2 gap-x-6 gap-y-1 rounded-lg bg-white/5 p-3">
                                                                    <span className="text-gray-500">Device</span>
                                                                    <span className="text-white">{tr.provider_info.model || tr.provider_info.name}</span>
                                                                    <span className="text-gray-500">Serial</span>
                                                                    <span className="text-white font-mono text-xs">{tr.provider_info.serial || '-'}</span>
                                                                    <span className="text-gray-500">Channels</span>
                                                                    <span className="text-white">{tr.result?.channels || '-'}</span>
                                                                </div>
                                                            )}
                                                            <div className="flex flex-wrap gap-1">
                                                                {(tr.result?.features || tr.provider_info?.features || []).map((f: string) => (
                                                                    <Badge key={f} variant="outline" className="border-[#AD9334]/50 text-xs text-[#C2A74A]">{f}</Badge>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-red-400">
                                                            <XCircle className="h-4 w-4" />
                                                            {tr.result?.error || tr.error || 'Connection failed'}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button onClick={() => handleTest(conn)} disabled={testing === conn.id} variant="outline" size="sm" className="border-white/10 text-gray-300">
                                            {testing === conn.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Play className="mr-1 h-3 w-3" />}
                                            Test
                                        </Button>
                                        {conn.is_active ? (
                                            <Button onClick={() => handleDeactivate(conn)} variant="outline" size="sm" className="border-red-500 text-red-400 hover:bg-red-500/10">Disconnect</Button>
                                        ) : (
                                            <Button onClick={() => handleActivate(conn)} variant="outline" size="sm" className="border-[#AD9334] text-[#AD9334]">Activate</Button>
                                        )}
                                        <Button onClick={() => openEdit(conn)} variant="ghost" size="icon" className="text-gray-400 hover:text-white"><Settings className="h-4 w-4" /></Button>
                                        <Button onClick={() => handleDelete(conn.id)} variant="ghost" size="icon" className="text-red-400 hover:text-red-300"><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                    {connections.length === 0 && (
                        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-12 text-gray-500">
                            <Cctv className="mb-3 h-12 w-12 text-gray-600" />
                            <p className="text-lg font-medium">No provider connections</p>
                            <p className="text-sm">Add a Mock or Dahua provider to start monitoring</p>
                            <Button onClick={openCreate} className="mt-4 bg-[#AD9334] text-white hover:bg-[#C2A74A]">
                                <Plus className="mr-2 h-4 w-4" /> Add Connection
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-lg border-white/10 bg-gray-900 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-white">{editId ? 'Edit Connection' : 'New Connection'}</DialogTitle>
                        <DialogDescription className="text-gray-400">Configure your Dahua DVR/NVR or Mock Provider</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label className="text-gray-300">Connection Name</Label>
                                <Input value={data.name} onChange={(e) => setData('name', e.target.value)} className="border-white/10 bg-white/5 text-white" placeholder="FICOBank DVR-01" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-300">Provider Type</Label>
                                <Select value={data.provider_type} onValueChange={(v) => setData('provider_type', v)}>
                                    <SelectTrigger className="w-full border-white/10 bg-white/5 text-white">
                                        <SelectValue placeholder="Select provider" />
                                    </SelectTrigger>
                                    <SelectContent position="popper" className="w-[--radix-select-trigger-width] border-white/10 bg-gray-900 text-white">
                                        {Object.entries(availableProviders).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {isDahua && (
                                <>
                                    <div className="space-y-2">
                                        <Label className="text-gray-300">Host / IP Address</Label>
                                        <Input value={data.host} onChange={(e) => setData('host', e.target.value)} className="border-white/10 bg-white/5 text-white" placeholder="192.168.1.100" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-300">Port</Label>
                                        <Input type="number" value={data.port} onChange={(e) => setData('port', e.target.value)} className="border-white/10 bg-white/5 text-white" placeholder="80" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-300">Username</Label>
                                        <Input value={data.username} onChange={(e) => setData('username', e.target.value)} className="border-white/10 bg-white/5 text-white" placeholder="admin" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-300">Password</Label>
                                        <Input type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} className="border-white/10 bg-white/5 text-white" placeholder="••••••••" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-300">Polling Interval (s)</Label>
                                        <Input type="number" value={data.polling_interval} onChange={(e) => setData('polling_interval', e.target.value)} className="border-white/10 bg-white/5 text-white" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-300">Connection Timeout (s)</Label>
                                        <Input type="number" value={data.connection_timeout} onChange={(e) => setData('connection_timeout', e.target.value)} className="border-white/10 bg-white/5 text-white" />
                                    </div>
                                    <div className="flex items-center gap-4 pt-2 md:col-span-2">
                                        <label className="flex items-center gap-2">
                                            <input type="checkbox" checked={data.https_enabled} onChange={(e) => setData('https_enabled', e.target.checked)} className="h-4 w-4 rounded border-white/10 bg-white/5 text-[#AD9334]" />
                                            <span className="text-gray-300">HTTPS</span>
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input type="checkbox" checked={data.auto_sync} onChange={(e) => setData('auto_sync', e.target.checked)} className="h-4 w-4 rounded border-white/10 bg-white/5 text-[#AD9334]" />
                                            <span className="text-gray-300">Auto Sync</span>
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input type="checkbox" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} className="h-4 w-4 rounded border-white/10 bg-white/5 text-[#AD9334]" />
                                            <span className="text-gray-300">Active</span>
                                        </label>
                                    </div>
                                </>
                            )}
                        </div>

                        {!isDahua && (
                            <div className="rounded-lg bg-white/5 p-4 text-sm text-gray-400">
                                Mock Provider runs locally without connecting to a real DVR.
                                All data is simulated with realistic Dahua-format events for development and testing.
                            </div>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-white/10 text-gray-300">Cancel</Button>
                            <Button type="submit" disabled={processing} className="bg-gradient-to-r from-[#AD9334] to-[#C2A74A] text-white hover:from-[#C2A74A] hover:to-[#AD9334]">
                                {editId ? 'Update' : 'Save'} Connection
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

ProviderSettings.layout = (props: any) => ({
    breadcrumbs: [
        { title: 'Settings', href: '/settings/chain-of-custody' },
        { title: 'CCTV Provider', href: '/settings/provider' },
    ],
});
