import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { LeadDetailModal } from '../components/LeadDetailModal';
import { useClaimLead } from '../hooks/useClaimLead';

interface Lead {
    id: string;
    name: string;
    email: string;
    service_requested: string;
    location: string;
    budget: string;
    lead_score: number;
    intent: string;
    urgency: string;
    insights: string;
    message?: string;
    created_at: string;
    status: string;
}

export const AvailableLeads = () => {
    const { user } = useAuth();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [credits, setCredits] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedService, setSelectedService] = useState('All Services');
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

    const handleClaimSuccess = (claimedLeadId: string) => {
        setCredits(prev => prev - 1);
        setLeads(prev => prev.filter(l => l.id !== claimedLeadId));
    };

    const { claimLead, isLoading: isClaiming, ConfirmationDialog } = useClaimLead({
        credits,
        onSuccess: handleClaimSuccess,
        onRemoveLead: (claimedLeadId: string) => setLeads(prev => prev.filter(l => l.id !== claimedLeadId)),
    });

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            setLoading(true);

            try {
                // Fetch leads
                const { data: leadsData, error: leadsError } = await supabase
                    .from('leads')
                    .select('id, name, email, service_requested, location, budget, lead_score, intent, urgency, insights, message, created_at, status')
                    .eq('status', 'available')
                    .order('lead_score', { ascending: false });

                if (leadsError) {
                    // Suppressing throw to handle gracefully if table restricts message or missing
                    console.error("Error fetching leads:", leadsError);
                } else if (leadsData) {
                    setLeads(leadsData as Lead[]);
                }

                // Fetch buyer credit balance
                const { data: buyerData, error: buyerError } = await supabase
                    .from('buyers')
                    .select('credit_balance, full_name, service_categories')
                    .eq('id', user.id)
                    .single();

                if (buyerError) {
                    console.error("Error fetching buyer:", buyerError);
                } else if (buyerData) {
                    setCredits(buyerData.credit_balance || 0);
                }
            } catch (err) {
                 console.error("Unexpected error fetching data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    // Derived derivations
    const filteredLeads = leads.filter(lead => {
        const matchesSearch = 
            lead.location?.toLowerCase().includes(searchTerm.toLowerCase()) || 
            lead.service_requested?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesService = selectedService === 'All Services' || lead.service_requested === selectedService;

        return matchesSearch && matchesService;
    });

    // Sub-components & Helpers
    const formatName = (fullName: string) => {
        if (!fullName) return 'Unknown';
        const parts = fullName.split(' ');
        if (parts.length === 1) return parts[0];
        return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
    };

    const getRelativeTime = (timestamp: string) => {
        if (!timestamp) return '';
        const diffInMs = new Date().getTime() - new Date(timestamp).getTime();
        const diffInHours = Math.round(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));
        
        if (diffInHours < 24) {
            if (diffInHours === 0) return 'Just now';
            return `Posted ${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
        } else {
            return `Posted ${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
        }
    };

    const getScoreBadge = (score: number) => {
        if (score >= 80) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">⭐ {score}</span>;
        if (score >= 60) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">👍 {score}</span>;
        if (score >= 40) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">📋 {score}</span>;
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">📋 {score || 0}</span>;
    };

    const getUrgencyBadge = (urgency: string) => {
        const u = urgency?.toLowerCase() || '';
        if (u.includes('24hr') || u.includes('24 hours')) return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">🔥 Urgent</span>;
        if (u.includes('7 days') || u.includes('week')) return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">⚡ This Week</span>;
        if (u.includes('30 days') || u.includes('month')) return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">📅 This Month</span>;
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">📅 Flexible</span>;
    };

    const getIntentDisplay = (intent: string) => {
        const i = intent?.toLowerCase() || '';
        if (i === 'high') return <span className="text-xs font-semibold text-green-600">Intent: High ▲</span>;
        if (i === 'medium') return <span className="text-xs font-semibold text-orange-600">Intent: Medium →</span>;
        return <span className="text-xs font-semibold text-gray-500">Intent: Low ▽</span>;
    };

    const truncate = (str: string, max: number) => {
        if (!str) return '';
        return str.length > max ? str.substring(0, max) + '...' : str;
    };

    return (
        <div className="space-y-6">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        Available Leads 
                        {!loading && <span className="text-sm font-medium bg-gray-100 text-gray-600 py-1 px-3 rounded-full">({filteredLeads.length})</span>}
                    </h1>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search by location or service..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-[#1A3C6E] focus:border-[#1A3C6E] sm:text-sm"
                        />
                    </div>
                    
                    <select
                        value={selectedService}
                        onChange={(e) => setSelectedService(e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-[#1A3C6E] focus:border-[#1A3C6E] sm:text-sm rounded-md"
                    >
                        <option value="All Services">All Services ▾</option>
                        <option value="Cleaning">Cleaning</option>
                        <option value="Plumbing">Plumbing</option>
                        <option value="Electrical">Electrical</option>
                    </select>
                </div>
            </div>

            {/* Main Content Area */}
            {loading ? (
                // Skeleton Grid
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
                            <div className="flex justify-between items-start mb-4">
                                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                                <div className="h-6 bg-gray-200 rounded w-1/6"></div>
                            </div>
                            <div className="space-y-3">
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                <div className="h-16 bg-blue-50/50 rounded w-full mt-4"></div>
                                <div className="h-4 bg-gray-200 rounded w-full mt-4"></div>
                            </div>
                            <div className="flex justify-between mt-6">
                                <div className="h-10 bg-gray-200 rounded w-1/3"></div>
                                <div className="h-10 bg-gray-200 rounded w-1/3"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredLeads.length === 0 ? (
                // Empty State
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center animate-fade-in-up">
                    <div className="mx-auto h-12 w-12 text-gray-400 flex items-center justify-center text-4xl mb-4">
                        🔍
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No leads available right now</h3>
                    <p className="text-gray-500">Check back soon — new leads come in daily.</p>
                </div>
            ) : (
                // Data Grid
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredLeads.map((lead) => (
                        <div key={lead.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 p-5 flex flex-col h-full animate-fade-in-up">
                            
                            {/* Card Header */}
                            <div className="flex justify-between items-start mb-3">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                    {/* Simplistic emoji mapping based on service */}
                                    {lead.service_requested?.toLowerCase().includes('clean') ? '🧹 ' : ''}
                                    {lead.service_requested?.toLowerCase().includes('plumb') ? '🪠 ' : ''}
                                    {lead.service_requested?.toLowerCase().includes('electric') ? '⚡ ' : ''}
                                    {lead.service_requested}
                                </span>
                                {getScoreBadge(lead.lead_score)}
                            </div>

                            {/* Core Info */}
                            <div className="mb-4">
                                <h3 className="text-lg font-bold text-gray-900">{formatName(lead.name)}</h3>
                                <div className="flex flex-col gap-1 mt-1 text-sm text-gray-600">
                                    <div className="flex items-center gap-1">
                                        <span className="text-gray-400">📍</span> {lead.location}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-gray-400">💰</span> {lead.budget}
                                    </div>
                                </div>
                            </div>

                            {/* Tags */}
                            <div className="flex items-center justify-between mb-4">
                                {getUrgencyBadge(lead.urgency)}
                                {getIntentDisplay(lead.intent)}
                            </div>

                            {/* Insights Box */}
                            {lead.insights && (
                                <div className="bg-blue-50/50 rounded-lg p-3 mb-4 flex-grow border border-blue-100/50">
                                    <p className="text-xs text-blue-900 italic leading-relaxed">
                                        "{truncate(lead.insights, 120)}"
                                    </p>
                                </div>
                            )}

                            {/* Message Preview (if requested explicitly, overriding if missing via fallback) */}
                            {lead.message && (
                                <div className="mb-4">
                                    <p className="text-sm text-gray-600 line-clamp-2">
                                        {truncate(lead.message, 80)}
                                    </p>
                                </div>
                            )}

                            {/* Metadata */}
                            <div className="text-xs text-gray-400 mb-4 font-medium">
                                {getRelativeTime(lead.created_at)}
                            </div>

                            <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                                <button 
                                    onClick={() => setSelectedLead(lead)}
                                    className="flex-1 py-2 px-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1A3C6E]"
                                >
                                    👁 View Details
                                </button>
                                
                                {credits > 0 ? (
                                    <button 
                                        onClick={() => claimLead(lead.id)}
                                        disabled={isClaiming}
                                        className="flex-1 py-2 px-3 rounded-lg text-sm font-bold text-white bg-[#E67E22] hover:bg-[#d67119] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E67E22] disabled:opacity-50"
                                    >
                                        Claim Lead — 1 credit
                                    </button>
                                ) : (
                                    <button 
                                        disabled
                                        className="flex-1 py-2 px-3 rounded-lg text-sm font-bold text-gray-500 bg-gray-100 cursor-not-allowed border border-gray-200"
                                    >
                                        Buy Credits First
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            <LeadDetailModal 
                isOpen={selectedLead !== null}
                onClose={() => setSelectedLead(null)}
                lead={selectedLead}
                credits={credits}
                onClaim={claimLead}
                isClaiming={isClaiming}
            />
            
            <ConfirmationDialog />
        </div>
    );
};
