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
    Siren,
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
    const teamSlug = (page.props as any).currentTeam?.slug;

    const mainNavItems: NavItem[] = [
        { title: 'Dashboard', href: `/dashboard`, icon: LayoutGrid },
        { title: 'Cameras', href: `/cameras`, icon: Camera },
        { title: 'CCTV Events', href: `/events`, icon: Cctv },
        { title: 'Verification', href: `/verification`, icon: ShieldCheck },
        { title: 'Blockchain', href: `/blockchain`, icon: Blocks },
        { title: 'Forensic Audit', href: `/forensic`, icon: SearchCheck },
        { title: 'Alert Center', href: `/alerts`, icon: Bell },
        { title: 'Activity Logs', href: `/activity-logs`, icon: Activity },
        { title: 'Audit Reports', href: `/audit`, icon: FileText },
        { title: 'Settings', href: `/settings/chain-of-custody`, icon: Settings },
    ];

    const forensicNavItems: NavItem[] = [
        { title: 'Forensic Dashboard', href: `/forensic/dashboard`, icon: SearchCheck },
        { title: 'Evidence Timeline', href: `/forensic/timeline`, icon: Activity },
        { title: 'Executive Overview', href: `/forensic/defense`, icon: ShieldCheck },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader className="p-3">
                <Link href="/dashboard" prefetch className="block">
                    <AppLogo />
                </Link>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
