import { Head } from '@inertiajs/react';
import SettingsNav from '@/components/settings-nav';

export default function SettingsIndex({ settings }: { settings: Record<string, string> }) {
    return <div className="space-y-6 p-6">
        <Head title="Chain of Custody Settings" />
        <SettingsNav />
        <h1 className="text-2xl font-semibold">Chain of Custody Settings</h1>
        <dl className="max-w-3xl divide-y divide-white/10">
            {Object.entries(settings).map(([name, value]) => <div key={name} className="grid gap-2 py-4 sm:grid-cols-2">
                <dt className="text-gray-400">{name}</dt><dd className="break-all">{value}</dd>
            </div>)}
        </dl>
    </div>;
}
