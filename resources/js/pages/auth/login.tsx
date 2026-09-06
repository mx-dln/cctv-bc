import { Head } from '@inertiajs/react';
import { Form } from '@inertiajs/react';
import { useState } from 'react';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/login';

type Props = { status?: string; canResetPassword: boolean };

export default function Login({ status, canResetPassword }: Props) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <>
            <Head title="Log in" />

            <div className="grid min-h-screen lg:grid-cols-2">
                <div className="relative h-screen overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0F1020]/80 via-[#0F1020]/40 to-transparent z-10" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F1020]/60 to-transparent z-10" />
                    <img
                        src="/assets/logo/ficobank-building.jpg"
                        alt="FICOBank Building"
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute top-12 left-12 z-20 max-w-md">
                        <h2 className="text-3xl font-bold text-white leading-tight">
                            Blockchain-Augmented<br />CCTV Forensic Platform
                        </h2>
                        <p className="mt-3 text-sm text-gray-400 leading-relaxed">
                            Enterprise-grade digital evidence integrity system with SHA-256 hashing,
                            Hyperledger Fabric blockchain verification, and chain-of-custody tracking.
                        </p>
                        <div className="mt-6 flex gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-[#AD9334]" /> SHA-256 Secured</span>
                            <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-[#AD9334]" /> Blockchain Verified</span>
                            <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-[#AD9334]" /> Forensic Audit</span>
                        </div>
                    </div>
                </div>

                <div className="flex h-screen items-center justify-center bg-[#0F1020]">
                    <div className="max-w-md w-full px-8">
                        <div className="flex flex-col items-center mb-8">
                            <img src="/assets/logo/ficobank.png" alt="FICOBank" className="h-12 w-auto mb-4" />
                            <h1 className="text-xl font-semibold text-white">Welcome Back</h1>
                            <p className="mt-1 text-sm text-gray-500">Sign in to Chain of Custody</p>
                        </div>

                        <div className="rounded-2xl border border-[#2A2D4A] bg-[#17182B] p-8 shadow-2xl shadow-[#AD9334]/5">
                            <Form
                                {...store.form()}
                                resetOnSuccess={['password']}
                                className="flex flex-col gap-5"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-sm text-gray-300">Email</Label>
                                            <Input
                                                id="email" type="email" name="email" required autoFocus
                                                tabIndex={1} autoComplete="email"
                                                placeholder="admin@ficobank.com"
                                                className="h-11 border-[#2A2D4A] bg-[#0F1020] text-white placeholder:text-gray-600 focus:border-[#AD9334] focus:ring-[#AD9334]"
                                            />
                                            <InputError message={errors.email} />
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="password" className="text-sm text-gray-300">Password</Label>
                                            </div>
                                            <div className="relative">
                                                <Input
                                                    id="password" type={showPassword ? 'text' : 'password'}
                                                    name="password" required tabIndex={2}
                                                    autoComplete="current-password"
                                                    placeholder="Enter your password"
                                                    className="h-11 border-[#2A2D4A] bg-[#0F1020] pr-10 text-white placeholder:text-gray-600 focus:border-[#AD9334] focus:ring-[#AD9334]"
                                                />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                                                >
                                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                            <InputError message={errors.password} />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <label className="flex items-center gap-2">
                                                <input type="checkbox" name="remember" defaultChecked
                                                    className="h-4 w-4 rounded border-[#2A2D4A] bg-[#0F1020] text-[#AD9334] focus:ring-[#AD9334]" />
                                                <span className="text-sm text-gray-400">Remember me</span>
                                            </label>
                                            {canResetPassword && (
                                                <a href="/forgot-password" className="text-sm text-[#AD9334] hover:text-[#C2A74A] transition-colors">
                                                    Forgot password?
                                                </a>
                                            )}
                                        </div>

                                        <Button type="submit" disabled={processing}
                                            className="h-11 w-full bg-gradient-to-r from-[#AD9334] to-[#C2A74A] text-white font-medium hover:from-[#C2A74A] hover:to-[#AD9334] transition-all shadow-lg shadow-[#AD9334]/20"
                                            tabIndex={3}
                                        >
                                            {processing ? <Spinner /> : 'Sign In'}
                                        </Button>
                                    </>
                                )}
                            </Form>
                        </div>

                        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-600">
                            <ShieldCheck className="h-3.5 w-3.5 text-[#AD9334]" />
                            FICOBank Enterprise Security Platform
                        </div>

                        {status && (
                            <div className="mt-4 text-center text-sm font-medium text-green-500">{status}</div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

Login.layout = null;
