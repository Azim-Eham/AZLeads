import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

interface Lead {
    id: string;
    name: string;
    email: string;
    phone?: string;
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
    buyer_id?: string;
    claimed_at?: string;
    closed_at?: string;
}

type FilterTab = 'All' | 'Active' | 'Closed';

export const MyLeads = () => {
    const { user } = useAuth();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterTab>('All');
    const [closingLeadId, setClosingLeadId] = useState<string | null>(null);

    useEffect(() => {
        const fetchMyLeads = async () => {
            if (!user) return;
            
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('leads')
                    .select('*')
                    .eq('buyer_id', user.id)
                    .order('claimed_at', { ascending: false });

                if (error) throw error;
                setLeads(data || []);
            } catch (error) {
                console.error("Error fetching my leads:", error);
                toast.error("Failed to load your leads.");
            } finally {
                setLoading(false);
            }
        };

        fetchMyLeads();
    }, [user]);

    const handleMarkAsClosed = async (leadId: string) => {
        if (!user) return;
        
        try {
            const now = new Date().toISOString();
            const { error } = await supabase
                .from('leads')
                .update({ 
                    status: 'closed', 
                    closed_at: now 
                })
                .eq('id', leadId)
                .eq('buyer_id', user.id);

            if (error) throw error;

            toast.success("Lead marked as closed", {
                style: { background: '#10B981', color: '#fff' }
            });
            
            // Optimistic update locally
            setLeads(prev => prev.map(lead => 
                lead.id === leadId 
                    ? { ...lead, status: 'closed', closed_at: now } 
                    : lead
            ));
            
            setClosingLeadId(null);

        } catch (error) {
            console.error("Error closing lead:", error);
            toast.error("Failed to mark lead as closed. Please try again.");
            setClosingLeadId(null);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Unknown date';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getScoreColorClass = (score: number) => {
        if (score >= 80) return "text-green-600 border-green-500 bg-green-50";
        if (score >= 60) return "text-blue-600 border-blue-500 bg-blue-50";
        if (score >= 40) return "text-orange-600 border-orange-500 bg-orange-50";
        return "text-gray-600 border-gray-500 bg-gray-50";
    };

    const getUrgencyBadge = (urgency: string) => {
        const u = urgency?.toLowerCase() || '';
        if (u.includes('24hr') || u.includes('24 hours')) return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-200">🔥 Urgent</span>;
        if (u.includes('7 days') || u.includes('week')) return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">⚡ This Week</span>;
        if (u.includes('30 days') || u.includes('month')) return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">📅 This Month</span>;
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">📅 Flexible</span>;
    };

    const filteredLeads = leads.filter(lead => {
        if (filter === 'All') return true;
        if (filter === 'Active') return lead.status === 'claimed'; // Assuming 'claimed' means active for buyer
        if (filter === 'Closed') return lead.status === 'closed';
        return true;
    });

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6 md:space-y-8 animate-fade-in-up">
            
            {/* Header section with Tabs */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-[#1A3C6E] tracking-tight flex items-center gap-3">
                        My Leads
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold bg-[#1A3C6E]/10 text-[#1A3C6E]">
                            {leads.length}
                        </span>
                    </h1>
                </div>

                {/* Filter Tabs */}
                <div className="flex space-x-8">
                    {(['All', 'Active', 'Closed'] as FilterTab[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap mb-[-17px] focus:outline-none ${
                                filter === tab
                                    ? 'border-[#E67E22] text-[#E67E22]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Empty States & Loaders */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <svg className="animate-spin h-10 w-10 text-[#E67E22]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            ) : leads.length === 0 ? (
                <div className="text-center py-20 px-6 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm mb-4 border border-gray-100">
                        <span className="text-2xl">📋</span>
                    </div>
                    <h3 className="mt-2 text-lg font-bold text-gray-900">You haven't claimed any leads yet</h3>
                    <p className="mt-2 text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                        Browse available leads in your service area and claim your first one to start growing your business.
                    </p>
                    <Link
                        to="/dashboard/leads"
                        className="inline-flex items-center justify-center rounded-lg bg-[#E67E22] px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-[#d67119] transition-colors focus:ring-2 focus:ring-[#E67E22] focus:ring-offset-2"
                    >
                        Browse Available Leads →
                    </Link>
                </div>
            ) : filteredLeads.length === 0 ? (
                <div className="text-center py-16 text-gray-500 text-sm">
                    No leads found in the '{filter}' category.
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 md:gap-8">
                    {filteredLeads.map((lead) => (
                        <div key={lead.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                            
                            {/* Card Top Strip - Status */}
                            <div className="bg-gray-50 border-b border-gray-100 px-6 py-3 flex items-center justify-between">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white border border-gray-200 shadow-sm text-gray-700">
                                    {lead.service_requested?.toLowerCase().includes('clean') ? '🧹 ' : ''}
                                    {lead.service_requested?.toLowerCase().includes('plumb') ? '🪠 ' : ''}
                                    {lead.service_requested?.toLowerCase().includes('electric') ? '⚡ ' : ''}
                                    {lead.service_requested}
                                </span>

                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs shadow-sm bg-white ${getScoreColorClass(lead.lead_score)}`}>
                                        {lead.lead_score}
                                    </div>
                                    {lead.status === 'closed' ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                                            ✓ Closed
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                            Active
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                    
                                    {/* Left Col: Contact PII */}
                                    <div className="lg:col-span-5 space-y-5">
                                        <div>
                                            <h3 className="text-2xl font-black text-gray-900 mb-4">{lead.name}</h3>
                                            
                                            <div className="space-y-3">
                                                <a 
                                                    href={`mailto:${lead.email}`} 
                                                    className="flex items-center gap-3 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 -ml-2 rounded-lg transition-colors font-medium w-fit"
                                                >
                                                    <span className="text-xl bg-blue-100 w-8 h-8 flex items-center justify-center rounded-md border border-blue-200/50">📧</span>
                                                    {lead.email}
                                                </a>
                                                
                                                {lead.phone && (
                                                    <a 
                                                        href={`tel:${lead.phone}`} 
                                                        className="flex items-center gap-3 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 -ml-2 rounded-lg transition-colors font-medium w-fit"
                                                    >
                                                        <span className="text-xl bg-blue-100 w-8 h-8 flex items-center justify-center rounded-md border border-blue-200/50">📞</span>
                                                        {lead.phone}
                                                    </a>
                                                )}

                                                <div className="flex items-center gap-3 text-sm text-gray-700 p-2 -ml-2 font-medium">
                                                    <span className="text-xl bg-gray-100 w-8 h-8 flex items-center justify-center rounded-md border border-gray-200/50">📍</span>
                                                    {lead.location}
                                                </div>

                                                <div className="flex items-center gap-3 text-sm text-gray-700 p-2 -ml-2 font-medium">
                                                    <span className="text-xl bg-emerald-50 w-8 h-8 flex items-center justify-center rounded-md border border-emerald-100/50">💰</span>
                                                    {lead.budget}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {getUrgencyBadge(lead.urgency)}
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                                                Intent: {lead.intent}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Right Col: Context */}
                                    <div className="lg:col-span-7 space-y-4 flex flex-col">
                                        
                                        {lead.message && (
                                            <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-100">
                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Their Request</span>
                                                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                                                    "{lead.message}"
                                                </p>
                                            </div>
                                        )}

                                        <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100/50 flex-grow">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-sm">✨</span>
                                                <span className="text-xs font-bold text-[#1A3C6E] uppercase tracking-wider">AI Insights</span>
                                            </div>
                                            <p className="text-sm text-gray-700 leading-relaxed italic">
                                                {lead.insights}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card Footer Actions */}
                            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                                <span className="text-xs text-gray-500 font-medium">
                                    Claimed on {formatDate(lead.claimed_at)}
                                </span>

                                {closingLeadId === lead.id ? (
                                    <div className="flex items-center gap-3 animate-fade-in-up">
                                        <span className="text-xs font-medium text-gray-600 hidden sm:inline-block">Mark as closed?</span>
                                        <button
                                            onClick={() => setClosingLeadId(null)}
                                            className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => handleMarkAsClosed(lead.id)}
                                            className="px-3 py-1.5 text-xs font-bold text-white bg-gray-900 border border-transparent rounded hover:bg-gray-800 transition-colors"
                                        >
                                            Yes, Close It
                                        </button>
                                    </div>
                                ) : lead.status === 'closed' ? (
                                    <span className="text-xs text-slate-500 font-semibold bg-white px-3 py-1.5 rounded border border-gray-200 shadow-sm">
                                        Closed {formatDate(lead.closed_at)}
                                    </span>
                                ) : (
                                    <button
                                        onClick={() => setClosingLeadId(lead.id)}
                                        className="inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1A3C6E]"
                                    >
                                        Mark as Closed ✓
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
