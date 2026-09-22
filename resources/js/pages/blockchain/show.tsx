import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Blocks, CheckCircle2, XCircle, Clock, FileCode } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { BlockchainTransaction } from '@/types';

export default function BlockchainShow({ transaction }: { transaction: BlockchainTransaction }) {
    const operation = transaction.response?.operation === 'verification' ? 'Verification Query' : 'Registration Commit';
    const functionName = transaction.response?.function ?? 'CommitCCTVCustodyLog';

    return (
        <>
            <Head title="Transaction Details" />
            <div className="space-y-6 p-6">
                <div className="flex items-center gap-4">
                    <Link href="/blockchain">
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Transaction Details</h1>
                        <p className="font-mono text-sm text-[#AD9334]">{transaction.transaction_id}</p>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <Blocks className="h-5 w-5 text-[#AD9334]" /> Transaction Info
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between border-b border-white/10 pb-2">
                                <span className="text-sm text-gray-400">Status</span>
                                <Badge variant="outline" className={`${
                                    transaction.status === 'committed' ? 'border-green-500 text-green-400' :
                                    transaction.status === 'failed' ? 'border-red-500 text-red-400' :
                                    'border-yellow-500 text-yellow-400'
                                }`}>{transaction.status}</Badge>
                            </div>
                            <div className="flex justify-between border-b border-white/10 pb-2">
                                <span className="text-sm text-gray-400">Operation</span>
                                <span className="text-sm text-white">{operation}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/10 pb-2">
                                <span className="text-sm text-gray-400">Channel</span>
                                <span className="text-sm text-white">{transaction.channel}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/10 pb-2">
                                <span className="text-sm text-gray-400">Chaincode</span>
                                <span className="text-sm text-white">{transaction.chaincode}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/10 pb-2">
                                <span className="text-sm text-gray-400">Function</span>
                                <span className="text-sm font-mono text-[#AD9334]">{functionName}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/10 pb-2">
                                <span className="text-sm text-gray-400">Block Number</span>
                                <span className="text-sm text-white">{transaction.block_number || 'Pending'}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/10 pb-2">
                                <span className="text-sm text-gray-400">Node</span>
                                <span className="text-sm text-white">Fabric gateway</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-400">Committed At</span>
                                <span className="text-sm text-white">
                                    {transaction.committed_at ? new Date(transaction.committed_at).toLocaleString() : '-'}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <FileCode className="h-5 w-5 text-purple-400" /> Arguments & Response
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="mb-2 text-sm font-medium text-gray-400">Arguments</h4>
                                <pre className="overflow-x-auto rounded-lg bg-black/50 p-3 text-xs text-green-400">
                                    {JSON.stringify({ log_id: transaction.log_id }, null, 2)}
                                </pre>
                            </div>
                            {transaction.response && (
                                <div>
                                    <h4 className="mb-2 text-sm font-medium text-gray-400">Response</h4>
                                    <pre className="overflow-x-auto rounded-lg bg-black/50 p-3 text-xs text-cyan-400">
                                        {JSON.stringify(transaction.response, null, 2)}
                                    </pre>
                                </div>
                            )}
                            {transaction.error_message && (
                                <div>
                                    <h4 className="mb-2 text-sm font-medium text-red-400">Error</h4>
                                    <pre className="overflow-x-auto rounded-lg bg-red-950/50 p-3 text-xs text-red-400">
                                        {transaction.error_message}
                                    </pre>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

BlockchainShow.layout = (props: any) => ({
    breadcrumbs: [
        { title: 'Blockchain', href: '/blockchain' },
        { title: 'Transaction', href: '#' },
    ],
});
