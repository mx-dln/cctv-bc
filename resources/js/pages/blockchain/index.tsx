import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Blocks, CheckCircle2, XCircle, Clock, ExternalLink, Wifi, WifiOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { BlockchainTransaction } from '@/types';

const statusStyles: Record<string, string> = {
    committed: 'border-green-500 text-green-400 bg-green-500/10',
    pending: 'border-yellow-500 text-yellow-400 bg-yellow-500/10',
    failed: 'border-red-500 text-red-400 bg-red-500/10',
};

export default function BlockchainIndex({ transactions, isAvailable, isSimulated }: {
    transactions: { data: BlockchainTransaction[] };
    isAvailable: boolean;
    isSimulated: boolean;
}) {
    return (
        <>
            <Head title="Blockchain" />
            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Blockchain Network</h1>
                        <p className="text-sm text-gray-400">Hyperledger Fabric transaction ledger</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`flex items-center gap-2 ${
                            isAvailable ? 'border-green-500 text-green-400' : 'border-red-500 text-red-400'
                        }`}>
                            {isAvailable ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                            {isAvailable || isSimulated ? 'Connected' : 'Disconnected'}
                        </Badge>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm text-gray-400">
                                <Blocks className="h-4 w-4 text-[#AD9334]" /> Total TX
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-white">{transactions.data.length}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm text-gray-400">
                                <CheckCircle2 className="h-4 w-4 text-green-400" /> Committed
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-green-400">
                                {transactions.data.filter(t => t.status === 'committed').length}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm text-gray-400">
                                <XCircle className="h-4 w-4 text-red-400" /> Failed
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-red-400">
                                {transactions.data.filter(t => t.status === 'failed').length}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm text-gray-400">
                                <Blocks className="h-4 w-4 text-cyan-400" /> Channel
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-lg font-bold text-white">cctv-channel</p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="text-white">Transaction History</CardTitle>
                        <CardDescription>Blockchain commit and verify transactions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10 text-left text-sm text-gray-400">
                                        <th className="pb-3 font-medium">TX ID</th>
                                        <th className="pb-3 font-medium">Chaincode</th>
                                        <th className="pb-3 font-medium">Block Number</th>
                                        <th className="pb-3 font-medium">Channel</th>
                                        <th className="pb-3 font-medium">Status</th>
                                        <th className="pb-3 font-medium">Timestamp</th>
                                        <th className="pb-3 font-medium">Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.data.map((tx) => (
                                        <motion.tr
                                            key={tx.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="border-b border-white/5 text-sm transition-colors hover:bg-white/5"
                                        >
                                            <td className="py-3 font-mono text-xs text-[#AD9334]">{tx.transaction_id}</td>
                                            <td className="py-3 text-gray-300">{tx.chaincode}</td>
                                            <td className="py-3 font-mono text-xs text-gray-400">{tx.block_number || '-'}</td>
                                            <td className="py-3 text-xs text-gray-400">{tx.channel}</td>
                                            <td className="py-3">
                                                <Badge variant="outline" className={`flex w-fit items-center gap-1 ${statusStyles[tx.status] || ''}`}>
                                                    {tx.status === 'committed' ? <CheckCircle2 className="h-3 w-3" /> :
                                                     tx.status === 'failed' ? <XCircle className="h-3 w-3" /> :
                                                     <Clock className="h-3 w-3" />}
                                                    {tx.status}
                                                </Badge>
                                            </td>
                                            <td className="py-3 text-gray-400">
                                                {tx.committed_at ? new Date(tx.committed_at).toLocaleString() : new Date(tx.created_at).toLocaleString()}
                                            </td>
                                            <td className="py-3">
                                                <Link href={`/blockchain/${tx.id}`}>
                                                    <Badge variant="outline" className="cursor-pointer border-[#AD9334] text-[#AD9334] transition-colors hover:bg-[#AD9334]/20">
                                                        <ExternalLink className="mr-1 h-3 w-3" /> View
                                                    </Badge>
                                                </Link>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

BlockchainIndex.layout = (props: any) => ({
    breadcrumbs: [
        { title: 'Blockchain', href: '/blockchain' },
    ],
});
