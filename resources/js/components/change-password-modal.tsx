import { useState } from 'react';
import { Shield, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function ChangePasswordModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [processing, setProcessing] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        if (password !== passwordConfirmation) {
            setErrors({ password_confirmation: 'Passwords do not match.' });
            setProcessing(false);
            return;
        }

        try {
            const res = await fetch('/settings/password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '' },
                body: JSON.stringify({ current_password: currentPassword, password, password_confirmation: passwordConfirmation }),
            });

            if (res.ok) {
                toast.success('Password updated successfully.');
                setCurrentPassword('');
                setPassword('');
                setPasswordConfirmation('');
                onOpenChange(false);
            } else {
                const data = await res.json();
                if (data.errors) setErrors(data.errors);
                else toast.error('Failed to update password.');
            }
        } catch {
            toast.error('An error occurred.');
        }
        setProcessing(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="border-white/10 bg-gray-900 text-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-white">
                        <Shield className="h-5 w-5 text-[#AD9334]" /> Change Password
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Enter your current password and a new password.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="current_password" className="text-gray-300">Current Password</Label>
                        <div className="relative">
                            <Input id="current_password" type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full border-white/10 bg-white/5 pr-10 text-white" required />
                            <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {errors.current_password && <p className="text-sm text-red-400">{errors.current_password}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-gray-300">New Password</Label>
                        <div className="relative">
                            <Input id="password" type={showNew ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border-white/10 bg-white/5 pr-10 text-white" required />
                            <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {errors.password && <p className="text-sm text-red-400">{errors.password}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password_confirmation" className="text-gray-300">Confirm New Password</Label>
                        <div className="relative">
                            <Input id="password_confirmation" type={showConfirm ? 'text' : 'password'} value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} className="w-full border-white/10 bg-white/5 pr-10 text-white" required />
                            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {errors.password_confirmation && <p className="text-sm text-red-400">{errors.password_confirmation}</p>}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-white/10 text-gray-300">Cancel</Button>
                        <Button type="submit" disabled={processing} className="bg-[#AD9334] text-white hover:bg-[#C2A74A]">
                            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Password
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
