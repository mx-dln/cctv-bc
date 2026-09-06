import { Head, useForm } from '@inertiajs/react';
import { Settings, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SettingsNav from '@/components/settings-nav';
import { toast } from 'sonner';

export default function SettingsIndex({ settings }: { settings: Record<string, any[]> }) {
    const formData: Record<string, string> = {};
    Object.entries(settings).forEach(([group, items]) => {
        items.forEach((item: any) => {
            formData[item.key] = item.value || '';
        });
    });

    const { data, setData, post, processing } = useForm({ settings: formData });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/settings/chain-of-custody', {
            onSuccess: () => toast.success('Settings updated successfully'),
        });
    };

    const settingGroups: Record<string, { label: string; description: string }> = {
        hashing: { label: 'Hash Algorithm', description: 'Configure hashing parameters for log integrity' },
        blockchain: { label: 'Blockchain Network', description: 'Hyperledger Fabric network configuration' },
        simulation: { label: 'Log Simulation', description: 'CCTV log simulator configuration' },
        retention: { label: 'Data Retention', description: 'Data retention period configuration' },
    };

    return (
        <>
            <Head title="Settings" />
            <div className="space-y-6 p-6">
                <SettingsNav />
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Chain of Custody Settings</h1>
                        <p className="text-sm text-gray-400">System configuration for integrity verification</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {Object.entries(settingGroups).map(([groupKey, group]) => (
                        <Card key={groupKey} className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-white">
                                    <Settings className="h-5 w-5 text-[#AD9334]" /> {group.label}
                                </CardTitle>
                                <CardDescription>{group.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-2">
                                    {settings[groupKey]?.map((setting: any) => (
                                        <div key={setting.key} className="space-y-2">
                                            <Label htmlFor={setting.key} className="text-gray-300">
                                                {setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </Label>
                                            <Input
                                                id={setting.key}
                                                type={setting.type === 'integer' || setting.type === 'number' ? 'number' : setting.type === 'boolean' ? 'checkbox' : 'text'}
                                                value={data.settings[setting.key] || ''}
                                                onChange={(e) => setData('settings', { ...data.settings, [setting.key]: e.target.value })}
                                                className="border-white/10 bg-white/5 text-white"
                                            />
                                            {setting.description && (
                                                <p className="text-xs text-gray-500">{setting.description}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            disabled={processing}
                            className="bg-gradient-to-r from-[#AD9334] to-[#C2A74A] text-white hover:from-[#C2A74A] hover:to-[#AD9334]"
                        >
                            {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Settings
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

SettingsIndex.layout = (props: any) => ({
    breadcrumbs: [
        { title: 'Settings', href: '/settings/chain-of-custody' },
    ],
});
