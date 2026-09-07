import { Link, usePage } from '@inertiajs/react';
import {
    LayoutGrid,
    Camera,
    Cctv,
    ShieldCheck,
    Blocks,
    SearchCheck,
    Bell,
    FileText,
    Settings,
    Activity,
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
        { title: 'CCTV Register', href: `/custody-records`, icon: Cctv },
        { title: 'CCTV Events', href: `/events`, icon: Cctv },
        { title: 'Verification', href: `/verification`, icon: ShieldCheck },
        { title: 'Blockchain', href: `/blockchain`, icon: Blocks },
        { title: 'Forensic Audit', href: `/forensic`, icon: SearchCheck },
        { title: 'Alert Center', href: `/alerts`, icon: Bell },
        { title: 'Activity Logs', href: `/activity-logs`, icon: Activity },
        { title: 'Audit Reports', href: `/audit`, icon: FileText },
        { title: 'Settings', href: `/settings/chain-of-custody`, icon: Settings },
    ];

    const access: Record<string, string> = {
        '/dashboard': 'view-dashboard', '/cameras': 'view-cameras', '/custody-records': 'view-verification',
        '/events': 'view-verification', '/verification': 'view-verification', '/blockchain': 'view-blockchain',
        '/forensic': 'view-forensic', '/alerts': 'view-alerts', '/activity-logs': 'view-activity-logs',
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
