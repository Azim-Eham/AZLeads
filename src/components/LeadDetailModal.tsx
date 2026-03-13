import { useState } from 'react';

// Copying interface locally for now to avoid circular dependencies before generic refactor
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

interface LeadDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: Lead | null;
    credits: number;
    onClaim: (leadId: string) => void;
    isClaiming?: boolean;
}

export const LeadDetailModal = ({ isOpen, onClose, lead, credits, onClaim, isClaiming }: LeadDetailModalProps) => {
    const [isMessageExpanded, setIsMessageExpanded] = useState(false);

    if (!isOpen || !lead) return null;

    // Helpers
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

    const getScoreColorClass = (score: number) => {
        if (score >= 80) return "text-green-600 border-green-500 bg-green-50";
        if (score >= 60) return "text-blue-600 border-blue-500 bg-blue-50";
        if (score >= 40) return "text-orange-600 border-orange-500 bg-orange-50";
        return "text-gray-600 border-gray-500 bg-gray-50";
    };

    const getUrgencyBadge = (urgency: string) => {
        const u = urgency?.toLowerCase() || '';
        if (u.includes('24hr') || u.includes('24 hours')) return <span className="inline-flex items-center px-2.5 py-1 rounded text-sm font-medium bg-red-100 text-red-800">🔥 Urgent</span>;
        if (u.includes('7 days') || u.includes('week')) return <span className="inline-flex items-center px-2.5 py-1 rounded text-sm font-medium bg-orange-100 text-orange-800">⚡ This Week</span>;
        if (u.includes('30 days') || u.includes('month')) return <span className="inline-flex items-center px-2.5 py-1 rounded text-sm font-medium bg-blue-100 text-blue-800">📅 This Month</span>;
        return <span className="inline-flex items-center px-2.5 py-1 rounded text-sm font-medium bg-gray-100 text-gray-800">📅 Flexible</span>;
    };

    const getIntentBadge = (intent: string) => {
        const i = intent?.toLowerCase() || '';
        if (i === 'high') return <span className="inline-flex items-center px-2.5 py-1 rounded text-sm font-medium bg-green-100 text-green-800">▲ High Intent</span>;
        if (i === 'medium') return <span className="inline-flex items-center px-2.5 py-1 rounded text-sm font-medium bg-orange-100 text-orange-800">→ Medium Intent</span>;
        return <span className="inline-flex items-center px-2.5 py-1 rounded text-sm font-medium bg-gray-100 text-gray-800">▽ Low Intent</span>;
    };
    
    const getProgressBarColor = (score: number) => {
        if (score >= 80) return 'bg-green-500';
        if (score >= 60) return 'bg-blue-500';
        if (score >= 40) return 'bg-orange-500';
        return 'bg-gray-500';
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={onClose}></div>

            <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
                {/* Modal Panel */}
                <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 w-full max-w-4xl animate-fade-in-up flex flex-col max-h-[90vh]">
                    
                    {/* Header */}
                    <div className="bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-orange-100 text-orange-800 border border-orange-200 shadow-sm">
                                {lead.service_requested?.toLowerCase().includes('clean') ? '🧹 ' : ''}
                                {lead.service_requested?.toLowerCase().includes('plumb') ? '🪠 ' : ''}
                                {lead.service_requested?.toLowerCase().includes('electric') ? '⚡ ' : ''}
                                {lead.service_requested}
                            </span>
                            
                            <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center font-bold text-xl shadow-sm ${getScoreColorClass(lead.lead_score)}`}>
                                {lead.lead_score}
                            </div>
                        </div>

                        <button 
                            onClick={onClose}
                            className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1A3C6E] p-2 hover:bg-gray-50 transition-colors"
                        >
                            <span className="sr-only">Close</span>
                            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Scrollable Body Container */}
                    <div className="px-6 py-6 overflow-y-auto grow">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
                            
                            {/* Left Column: Core Info */}
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900 mb-2">{formatName(lead.name)}</h2>
                                    <div className="flex items-center text-sm text-gray-500 mb-4 font-medium">
                                        ⏱ {getRelativeTime(lead.created_at)}
                                    </div>
                                    <div className="space-y-4 text-base">
                                        <div className="flex items-start gap-3">
                                            <span className="text-xl">📍</span>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Location</p>
                                                <p className="font-semibold text-gray-900">{lead.location}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <span className="text-xl">💰</span>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Budget Range</p>
                                                <p className="font-semibold text-gray-900">{lead.budget}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100 flex flex-wrap gap-3">
                                    {getUrgencyBadge(lead.urgency)}
                                    {getIntentBadge(lead.intent)}
                                </div>
                            </div>

                            {/* Right Column: AI Analysis */}
                            <div className="bg-blue-50/80 rounded-xl p-6 border border-blue-100 h-full flex flex-col">
                                <div className="flex items-center gap-2 mb-6">
                                    <span className="text-xl">✨</span>
                                    <h3 className="text-lg font-bold text-[#1A3C6E]">AI Assessment</h3>
                                </div>

                                <div className="space-y-5 flex-grow">
                                    {/* Lead Score Indicator */}
                                    <div>
                                        <div className="flex justify-between text-sm font-medium mb-1">
                                            <span className="text-gray-700">Lead Quality Score</span>
                                            <span className="text-[#1A3C6E]">{lead.lead_score}/100</span>
                                        </div>
                                        <div className="w-full bg-blue-200/50 rounded-full h-2.5">
                                            <div 
                                                className={`${getProgressBarColor(lead.lead_score)} h-2.5 rounded-full transition-all duration-1000 ease-out`} 
                                                style={{ width: `${lead.lead_score}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {/* AI Metrics Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white rounded-lg p-3 border border-blue-50 shadow-sm">
                                            <p className="text-xs text-gray-500 font-medium mb-1">Intent Level</p>
                                            <p className="text-sm font-semibold text-gray-900 capitalize">{lead.intent}</p>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 border border-blue-50 shadow-sm">
                                            <p className="text-xs text-gray-500 font-medium mb-1">Timeline</p>
                                            <p className="text-sm font-semibold text-gray-900 capitalize">{lead.urgency}</p>
                                        </div>
                                    </div>

                                    {/* Full Insights */}
                                    {lead.insights && (
                                        <div className="bg-white rounded-lg p-4 border border-blue-100 shadow-sm flex-grow">
                                            <p className="text-xs text-blue-800 font-semibold mb-2 uppercase tracking-wider">Key Insights</p>
                                            <p className="text-sm text-gray-700 leading-relaxed italic">
                                                "{lead.insights}"
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Full Message Section */}
                        {lead.message && (
                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    💬 Their Request
                                </h3>
                                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 transition-all duration-300">
                                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                                        {isMessageExpanded 
                                            ? lead.message 
                                            : (lead.message.length > 200 ? `${lead.message.substring(0, 200)}...` : lead.message)}
                                    </p>
                                    
                                    {lead.message.length > 200 && (
                                        <button 
                                            onClick={() => setIsMessageExpanded(!isMessageExpanded)}
                                            className="mt-3 text-sm font-semibold text-[#1A3C6E] hover:text-[#2a5a9c] flex items-center gap-1 transition-colors focus:outline-none"
                                        >
                                            {isMessageExpanded ? 'Show less ▴' : 'Read more ▾'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between shrink-0 rounded-b-2xl">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="inline-flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1A3C6E] focus:ring-offset-2 transition-colors"
                        >
                            ← Back to leads
                        </button>
                        
                        {credits > 0 ? (
                            <button 
                                type="button" 
                                disabled={isClaiming}
                                onClick={() => {
                                    onClaim(lead.id);
                                }}
                                className="inline-flex justify-center rounded-lg border border-transparent bg-[#E67E22] px-6 py-2.5 text-base font-bold text-white shadow-sm hover:bg-[#d67119] focus:outline-none focus:ring-2 focus:ring-[#E67E22] focus:ring-offset-2 transition-colors duration-200 transform hover:-translate-y-0.5 disabled:opacity-50"
                            >
                                {isClaiming ? 'Processing...' : 'Claim This Lead — 1 Credit'}
                            </button>
                        ) : (
                            <button 
                                type="button" 
                                disabled
                                className="inline-flex justify-center rounded-lg border border-gray-200 bg-gray-100 px-6 py-2.5 text-base font-bold text-gray-500 shadow-sm cursor-not-allowed"
                            >
                                Buy Credits First
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
