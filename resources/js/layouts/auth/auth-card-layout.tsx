import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { home } from '@/routes';

export default function AuthCardLayout({
    children,
    title,
    description,
}: PropsWithChildren<{
    name?: string;
    title?: string;
    description?: string;
}>) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-[#0F1020] p-6 md:p-10">
            <div className="flex w-full max-w-md flex-col gap-6">
                <Link href={home()} className="flex items-center justify-center self-center font-medium">
                    <img src="/assets/logo/ficobank.png" alt="FICOBank" className="h-8 w-auto" />
                </Link>
                <div className="flex flex-col gap-6">
                    <Card className="rounded-xl border-[#2A2D4A] bg-[#17182B]">
                        <CardHeader className="px-10 pt-8 pb-0 text-center">
                            <CardTitle className="text-xl text-white">{title}</CardTitle>
                            <CardDescription className="text-gray-500">{description}</CardDescription>
                        </CardHeader>
                        <CardContent className="px-10 py-8">
                            {children}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
