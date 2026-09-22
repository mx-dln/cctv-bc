import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { Camera, Cctv, Search, Wifi, WifiOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const statusStyles: Record<string, string> = {
    online: 'border-[#AD9334] text-[#AD9334] bg-[#AD9334]/10',
    offline: 'border-red-500 text-red-400 bg-red-500/10',
    disconnected: 'border-[#C2A74A] text-[#C2A74A] bg-[#C2A74A]/10',
};

const statusDot: Record<string, string> = {
    online: 'bg-[#AD9334]',
    offline: 'bg-red-500',
    disconnected: 'bg-[#C2A74A]',
};

export default function CameraIndex({ cameras, connected, providerName }: { cameras: any[]; connected: boolean; providerName: string }) {
    const [search, setSearch] = useState('');

    const filtered = cameras.filter((c: any) =>
        (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.provider_camera_id || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.location || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <Head title="Camera Management" />
            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Camera Management</h1>
                        <p className="text-sm text-gray-400">Evidence sources from the active provider</p>
                    </div>
                    <Badge variant="outline" className={`flex items-center gap-2 ${connected ? 'border-[#AD9334] text-[#AD9334]' : 'border-red-500 text-red-400'}`}>
                        {connected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                        {connected ? `${providerName} Connected` : 'Disconnected'}
                    </Badge>
                </div>

                <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-white">
                                <Camera className="h-5 w-5 text-[#AD9334]" />
                                Evidence Sources ({filtered.length})
                            </CardTitle>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                                <Input
                                    placeholder="Search cameras..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-gray-500"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {!connected ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                <Cctv className="mb-3 h-12 w-12 text-gray-600" />
                                <p className="text-lg font-medium">No Active Evidence Source</p>
                                <p className="text-sm">Activate Baseus Wi-Fi Camera, Mock Provider, or connect a DVR/NVR in Settings.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/10 text-left text-sm text-gray-400">
                                            <th className="pb-3 font-medium">Channel</th>
                                            <th className="pb-3 font-medium">Name</th>
                                            <th className="pb-3 font-medium">Location</th>
                                            <th className="pb-3 font-medium">Resolution</th>
                                            <th className="pb-3 font-medium">FPS</th>
                                            <th className="pb-3 font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map((camera: any, i: number) => (
                                            <tr key={camera.provider_camera_id || i} className="border-b border-white/5 text-sm transition-colors hover:bg-white/5">
                                                <td className="py-3 font-mono text-xs text-[#AD9334]">{camera.provider_camera_id || camera.channel || i}</td>
                                                <td className="py-3 font-medium text-white">{camera.name || 'Unknown'}</td>
                                                <td className="py-3 text-gray-400">{camera.location || '-'}</td>
                                                <td className="py-3 text-gray-400">{camera.resolution || '-'}</td>
                                                <td className="py-3 text-gray-400">{camera.fps ?? '-'}</td>
                                                <td className="py-3">
                                                    <Badge variant="outline" className={`flex w-fit items-center gap-1.5 ${statusStyles[camera.status] || ''}`}>
                                                        <span className={`inline-block h-2 w-2 rounded-full ${statusDot[camera.status] || 'bg-gray-500'}`} />
                                                        {camera.status}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                        {filtered.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="py-8 text-center text-sm text-gray-500">
                                                    No evidence sources found on the active provider.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

CameraIndex.layout = (props: any) => ({
    breadcrumbs: [{ title: 'Cameras', href: '/cameras' }],
});
