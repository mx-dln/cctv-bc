import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Camera } from '@/types';

export default function EditCamera({ camera }: { camera: Camera }) {
    const { data, setData, put, processing, errors } = useForm({
        provider_camera_id: camera.provider_camera_id || '',
        name: camera.name,
        location: camera.location || '',
        resolution: camera.resolution || '',
        fps: camera.fps?.toString() || '',
        status: camera.status,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/cameras/${camera.id}`);
    };

    return (
        <>
            <Head title="Edit Camera" />
            <div className="space-y-6 p-6">
                <div className="flex items-center gap-4">
                    <Link href="/cameras">
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Edit Camera</h1>
                        <p className="text-sm text-gray-400">{camera.provider_camera_id} - {camera.name}</p>
                    </div>
                </div>

                <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="text-white">Camera Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="provider_camera_id" className="text-gray-300">Channel ID</Label>
                                    <Input id="provider_camera_id" value={data.provider_camera_id} onChange={(e) => setData('provider_camera_id', e.target.value)} className="border-white/10 bg-white/5 text-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="status" className="text-gray-300">Status</Label>
                                    <Select value={data.status} onValueChange={(v) => setData('status', v)}>
                                        <SelectTrigger className="w-full border-white/10 bg-white/5 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent position="popper" className="w-[--radix-select-trigger-width] border-white/10 bg-gray-900 text-white">
                                            <SelectItem value="online">Online</SelectItem>
                                            <SelectItem value="offline">Offline</SelectItem>
                                            <SelectItem value="disconnected">Disconnected</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-gray-300">Camera Name</Label>
                                    <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} className="border-white/10 bg-white/5 text-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="location" className="text-gray-300">Location</Label>
                                    <Input id="location" value={data.location} onChange={(e) => setData('location', e.target.value)} className="border-white/10 bg-white/5 text-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="resolution" className="text-gray-300">Resolution</Label>
                                    <Input id="resolution" value={data.resolution} onChange={(e) => setData('resolution', e.target.value)} className="border-white/10 bg-white/5 text-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="fps" className="text-gray-300">Frame Rate (FPS)</Label>
                                    <Input id="fps" type="number" value={data.fps} onChange={(e) => setData('fps', e.target.value)} className="border-white/10 bg-white/5 text-white" />
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button type="submit" disabled={processing} className="bg-gradient-to-r from-[#AD9334] to-[#C2A74A] text-white hover:from-[#C2A74A] hover:to-[#AD9334]">
                                    Update Camera
                                </Button>
                                <Link href="/cameras">
                                    <Button type="button" variant="outline" className="border-white/10 text-gray-300">Cancel</Button>
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

EditCamera.layout = (props: any) => ({
    breadcrumbs: [
        { title: 'Cameras', href: '/cameras' },
        { title: 'Edit Camera', href: '#' },
    ],
});
