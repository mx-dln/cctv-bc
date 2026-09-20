import { Link, usePage } from '@inertiajs/react';
import {
    LayoutGrid,
    Camera,
    Cctv,
    ShieldCheck,
    Blocks,
    Bell,
    FileText,
    Settings,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';

export function AppSidebar() {
    const page = usePage();
    const permissions = (page.props.auth as any).permissions ?? [];

    const mainNavItems: NavItem[] = [
        { title: 'Dashboard', href: `/dashboard`, icon: LayoutGrid },
        { title: 'Cameras', href: `/cameras`, icon: Camera },
        { title: 'Evidence Register', href: `/custody-records`, icon: Cctv },
        { title: 'Evidence Verification', href: `/verification`, icon: ShieldCheck },
        { title: 'Fabric Ledger', href: `/blockchain`, icon: Blocks },
        { title: 'Alerts', href: `/alerts`, icon: Bell },
        { title: 'Audit Reports', href: `/audit`, icon: FileText },
        { title: 'Settings', href: `/settings/chain-of-custody`, icon: Settings },
    ];

    const access: Record<string, string> = {
        '/dashboard': 'view-dashboard', '/cameras': 'view-cameras', '/custody-records': 'view-verification',
        '/verification': 'view-verification', '/blockchain': 'view-blockchain',
        '/alerts': 'view-alerts',
        '/audit': 'view-audit', '/settings/chain-of-custody': 'manage-settings',
    };

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader className="p-3">
                <Link href="/dashboard" prefetch className="block">
                    <AppLogo />
                </Link>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={mainNavItems.filter(item => permissions.includes(access[String(item.href)]))} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
