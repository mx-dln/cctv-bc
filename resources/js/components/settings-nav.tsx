import { Link, usePage } from '@inertiajs/react';
import { User, Settings, Cctv } from 'lucide-react';

const links = [
    { href: '/settings/profile', label: 'Profile', icon: User },
    { href: '/settings/chain-of-custody', label: 'Chain of Custody', icon: Settings },
    { href: '/settings/provider', label: 'CCTV Provider', icon: Cctv },
];

export default function SettingsNav() {
    const url = usePage().url;

    return (
        <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
            {links.map((link) => (
                <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                        url.startsWith(link.href)
                            ? 'bg-[#AD9334]/20 text-[#AD9334]'
                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                </Link>
            ))}
        </div>
    );
}
