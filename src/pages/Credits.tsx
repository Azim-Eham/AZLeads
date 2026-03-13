import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface Transaction {
    id: string;
    created_at: string;
    type: string;
    description: string;
    amount: number;
}

interface PackageView {
    id: string;
    name: string;
    credits: number;
    price: number;
    perLead: string;
    popular?: boolean;
}

const PACKAGES: PackageView[] = [
    { id: 'starter', name: 'Starter', credits: 5, price: 25, perLead: '$5 per lead' },
    { id: 'standard', name: 'Standard', credits: 15, price: 60, perLead: '$4 per lead', popular: true },
    { id: 'professional', name: 'Professional', credits: 40, price: 120, perLead: '$3 per lead' },
    { id: 'enterprise', name: 'Enterprise', credits: 100, price: 250, perLead: '$2.50 per lead' },
];

export const Credits = () => {
    const { user } = useAuth();
    const [balance, setBalance] = useState<number | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPackage, setSelectedPackage] = useState<PackageView | null>(null);

    useEffect(() => {
        const fetchCreditsData = async () => {
            if (!user) return;
            
            setLoading(true);
            try {
                // Fetch balance
                const { data: buyer, error: buyerError } = await supabase
                    .from('buyers')
                    .select('credit_balance')
                    .eq('id', user.id)
                    .single();

                if (buyerError) throw buyerError;
                setBalance(buyer?.credit_balance || 0);

                // Fetch transactions
                const { data: txData, error: txError } = await supabase
                    .from('transactions')
                    .select('*')
                    .eq('buyer_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (txError) throw txError;
                setTransactions(txData || []);

            } catch (error) {
                console.error("Error fetching credits data:", error);
                toast.error("Failed to load your credits data.");
            } finally {
                setLoading(false);
            }
        };

        fetchCreditsData();
    }, [user]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    const getTransactionAmountStyle = (type: string) => {
        if (type === 'credit_purchase' || type === 'refund') {
            return 'text-green-600 font-bold';
        }
        if (type === 'lead_claim') {
            return 'text-red-600 font-bold';
        }
        return 'text-gray-900 font-semibold';
    };

    const formatTransactionAmount = (type: string, amount: number) => {
        if (type === 'credit_purchase' || type === 'refund') {
            return `+${amount} credit${amount !== 1 ? 's' : ''}`;
        }
        if (type === 'lead_claim') {
            return `-${amount} credit${amount !== 1 ? 's' : ''}`;
        }
        return `${amount} credit${amount !== 1 ? 's' : ''}`;
    };

    const getTransactionTypeLabel = (type: string) => {
        switch(type) {
            case 'credit_purchase': return 'Purchase';
            case 'lead_claim': return 'Claimed Lead';
            case 'refund': return 'Refund';
            default: return type.replace('_', ' ');
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto space-y-10 animate-fade-in-up pb-[100px]">
            
            {/* Header / Current Balance Card */}
            <div>
                <div className="bg-[#1A3C6E] rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden shadow-xl border border-[#2a5a9c]">
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-5 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-white opacity-5 rounded-full blur-2xl"></div>
                    
                    <div className="relative z-10 flex flex-col items-center justify-center">
                        <div className="text-sm font-semibold text-blue-200 tracking-wider uppercase mb-2">Available Balance</div>
                        {loading ? (
                            <div className="h-20 w-32 bg-white/20 animate-pulse rounded-2xl mb-2"></div>
                        ) : (
                            <div className="text-6xl md:text-8xl font-black mb-2 tabular-nums tracking-tighter drop-shadow-md">
                                {balance ?? 0}
                            </div>
                        )}
                        <div className="text-xl md:text-2xl font-light text-blue-100 mb-6 font-serif italic">credits available</div>
                        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-medium backdrop-blur-md">
                            ⚡ 1 credit = 1 lead claim
                        </div>
                    </div>
                </div>
            </div>

            {/* Credit Packages Section */}
            <div>
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Purchase Credits</h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {PACKAGES.map((pkg) => (
                        <div 
                            key={pkg.id} 
                            className={`relative flex flex-col bg-white rounded-2xl p-6 border transition-all duration-300 hover:shadow-xl ${
                                pkg.popular 
                                    ? 'border-[#E67E22] shadow-md ring-1 ring-[#E67E22]' 
                                    : 'border-gray-200 shadow-sm hover:border-gray-300'
                            }`}
                        >
                            {pkg.popular && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                    <span className="bg-[#E67E22] text-white text-xs font-black uppercase tracking-wider py-1 px-3 rounded-full shadow-sm whitespace-nowrap">
                                        Most Popular
                                    </span>
                                </div>
                            )}

                            <div className="text-center mb-6 pt-2">
                                <h3 className="text-lg font-bold text-gray-500 mb-2">{pkg.name}</h3>
                                <div className="flex items-center justify-center gap-1 mb-1">
                                    <span className="text-4xl font-black text-[#1A3C6E]">{pkg.credits}</span>
                                    <span className="text-lg font-bold text-gray-400 mt-2"> cr</span>
                                </div>
                            </div>

                            <div className="flex flex-col items-center justify-center bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
                                <span className="text-3xl font-bold text-gray-900">${pkg.price}</span>
                                <span className="text-xs font-medium text-gray-500 mt-1">{pkg.perLead}</span>
                            </div>

                            <div className="mt-auto">
                                <button
                                    onClick={() => setSelectedPackage(pkg)}
                                    className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                        pkg.popular
                                            ? 'bg-[#E67E22] text-white hover:bg-[#d67119] focus:ring-[#E67E22] shadow-md hover:-translate-y-0.5'
                                            : 'bg-white border-2 border-[#1A3C6E] text-[#1A3C6E] hover:bg-gray-50 focus:ring-[#1A3C6E]'
                                    }`}
                                >
                                    Purchase Package
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Transaction History Section */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-6">Transaction History</h2>
                
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500 animate-pulse">Loading transactions...</div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-16 px-6">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 mb-4">
                                <span className="text-xl">🧾</span>
                            </div>
                            <h3 className="text-sm font-semibold text-gray-900">No transactions yet</h3>
                            <p className="mt-1 text-sm text-gray-500">Your history of purchases and lead claims will appear here.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        <th className="px-6 py-4 whitespace-nowrap">Date</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Type</th>
                                        <th className="px-6 py-4">Description</th>
                                        <th className="px-6 py-4 text-right whitespace-nowrap">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {transactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(tx.created_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 capitalize">
                                                    {getTransactionTypeLabel(tx.type)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {tx.description}
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-mono ${getTransactionAmountStyle(tx.type)}`}>
                                                {formatTransactionAmount(tx.type, tx.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Purchase Modal Overlay */}
            {selectedPackage && (
                <div className="fixed inset-0 z-[60] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={() => setSelectedPackage(null)}></div>

                    <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 w-full max-w-lg animate-fade-in-up border border-gray-100">
                            
                            <div className="bg-[#1A3C6E] px-6 py-5 text-center relative overflow-hidden">
                                <h3 className="text-xl font-bold text-white relative z-10">How to Purchase Credits</h3>
                                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-white opacity-5 rounded-full"></div>
                            </div>
                            
                            <div className="px-8 py-8">
                                <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
                                    <p className="font-medium text-base text-gray-900">
                                        You are purchasing the <span className="font-bold text-[#E67E22]">{selectedPackage.name} Package</span>.
                                    </p>

                                    <div className="bg-blue-50/60 rounded-xl p-5 border border-blue-100 space-y-4">
                                        <div>
                                            <span className="block text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">Step 1 — Send Payment</span>
                                            <p>Send payment via Payoneer to: <span className="font-semibold text-gray-900">payments@example.com</span></p>
                                        </div>

                                        <div className="pt-2 border-t border-blue-100">
                                            <span className="block text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">Amount</span>
                                            <p className="text-2xl font-black text-[#1A3C6E]">${selectedPackage.price}</p>
                                        </div>
                                    </div>

                                    <div className="bg-orange-50/50 rounded-xl p-5 border border-orange-100">
                                        <span className="block text-xs font-bold text-orange-800 uppercase tracking-wider mb-2">⚠️ Important</span>
                                        <p>You MUST include your account email in the payment note so we can credit your account:</p>
                                        <div className="mt-2 text-center p-3 bg-white border border-orange-200 rounded-lg shadow-sm font-mono text-gray-900 font-bold break-all">
                                            {user?.email}
                                        </div>
                                    </div>

                                    <p className="text-gray-500 italic text-center pt-2">
                                        Once your payment is confirmed (usually within 2 hours), your {selectedPackage.credits} credits will be added automatically and you'll receive a confirmation email.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setSelectedPackage(null)}
                                    className="w-full sm:w-auto inline-flex justify-center rounded-lg bg-[#1A3C6E] px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#122b52] focus:outline-none focus:ring-2 focus:ring-[#1A3C6E] focus:ring-offset-2 transition-colors"
                                >
                                    Got it, I'll send payment now
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
