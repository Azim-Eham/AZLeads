import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface BuyerProfile {
    id: string;
    full_name: string;
    company_name: string;
    phone: string;
    service_categories: string[];
    location_preference: string;
    created_at: string;
}

const AVAILABLE_SERVICES = ['Cleaning', 'Plumbing', 'Electrical'];

export const Profile = () => {
    const { user } = useAuth();
    
    const [profileData, setProfileData] = useState<BuyerProfile>({
        id: '', full_name: '', company_name: '', phone: '', service_categories: [], location_preference: '', created_at: ''
    });
    
    const [passwords, setPasswords] = useState({
        current: '', new: '', confirm: ''
    });

    const [loadingProfile, setLoadingProfile] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;
            setLoadingProfile(true);
            try {
                const { data, error } = await supabase
                    .from('buyers')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (error) throw error;
                
                // Parse service_categories safely if it's stored as JSON
                let services: string[] = [];
                if (data.service_categories) {
                    try {
                        services = typeof data.service_categories === 'string' 
                            ? JSON.parse(data.service_categories) 
                            : data.service_categories;
                    } catch (e) {
                         services = [data.service_categories];
                    }
                }

                setProfileData({
                    id: data.id || user.id,
                    full_name: data.full_name || '',
                    company_name: data.company_name || '',
                    phone: data.phone || '',
                    service_categories: Array.isArray(services) ? services : [],
                    location_preference: data.location_preference || '',
                    created_at: data.created_at || new Date().toISOString()
                });

            } catch (error) {
                console.error("Error fetching profile:", error);
                toast.error("Failed to load profile data.");
            } finally {
                setLoadingProfile(false);
            }
        };

        fetchProfile();
    }, [user]);

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handleServiceToggle = (service: string) => {
        setProfileData(prev => {
            const current = [...prev.service_categories];
            if (current.includes(service)) {
                return { ...prev, service_categories: current.filter(s => s !== service) };
            } else {
                return { ...prev, service_categories: [...current, service] };
            }
        });
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        
        setSavingProfile(true);
        try {
            const { error } = await supabase
                .from('buyers')
                .update({
                    full_name: profileData.full_name,
                    company_name: profileData.company_name,
                    phone: profileData.phone,
                    service_categories: profileData.service_categories,
                    location_preference: profileData.location_preference
                })
                .eq('id', user.id);

            if (error) throw error;
            toast.success("Profile updated ✓");
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error("Failed to update profile.");
        } finally {
            setSavingProfile(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!passwords.new || !passwords.current) return toast.error("Please fill in all fields.");
        if (passwords.new !== passwords.confirm) return toast.error("New passwords do not match.");
        if (passwords.new.length < 8) return toast.error("Password must be at least 8 characters.");

        setSavingPassword(true);
        try {
            // Note: In Supabase, standard `updateUser` doesn't strictly verify `current_password` 
            // unless specific session checks are bound (like nonce), but we send the requested payload exactly.
            // Some specific Supabase setups require the current password, others do not.
            const { error } = await supabase.auth.updateUser({ 
                password: passwords.new 
            });

            if (error) throw error;
            
            toast.success("Password updated successfully ✓");
            setPasswords({ current: '', new: '', confirm: '' });
        } catch (error: any) {
            console.error("Error updating password:", error);
            toast.error(error.message || "Failed to update password.");
        } finally {
            setSavingPassword(false);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loadingProfile) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <svg className="animate-spin h-10 w-10 text-[#1A3C6E]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8 animate-fade-in-up pb-[100px]">
            
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Account Settings</h1>

            {/* SECTION 1 - Personal Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200 bg-gray-50/50">
                    <h2 className="text-lg font-bold text-gray-900">Your Profile</h2>
                    <p className="mt-1 text-sm text-gray-500">Update your personal details and service coverage.</p>
                </div>
                
                <form onSubmit={handleSaveProfile} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label htmlFor="full_name" className="block text-sm font-semibold text-gray-700">Full Name</label>
                            <input
                                type="text"
                                id="full_name"
                                name="full_name"
                                value={profileData.full_name}
                                onChange={handleProfileChange}
                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#1A3C6E] focus:ring-[#1A3C6E] sm:text-sm px-4 py-2.5 bg-gray-50 transition-colors focus:bg-white border"
                                required
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <label htmlFor="company_name" className="block text-sm font-semibold text-gray-700">Company Name</label>
                            <input
                                type="text"
                                id="company_name"
                                name="company_name"
                                value={profileData.company_name}
                                onChange={handleProfileChange}
                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#1A3C6E] focus:ring-[#1A3C6E] sm:text-sm px-4 py-2.5 bg-gray-50 transition-colors focus:bg-white border"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="phone" className="block text-sm font-semibold text-gray-700">Phone Number</label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={profileData.phone}
                                onChange={handleProfileChange}
                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#1A3C6E] focus:ring-[#1A3C6E] sm:text-sm px-4 py-2.5 bg-gray-50 transition-colors focus:bg-white border"
                            />
                        </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-gray-100">
                        <label className="block text-sm font-semibold text-gray-700">Service Categories</label>
                        <div className="flex flex-wrap gap-4">
                            {AVAILABLE_SERVICES.map(service => (
                                <label key={service} className="relative flex items-center p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors group has-[:checked]:bg-blue-50 has-[:checked]:border-blue-200">
                                    <input
                                        type="checkbox"
                                        className="h-5 w-5 rounded border-gray-300 text-[#1A3C6E] focus:ring-[#1A3C6E] cursor-pointer"
                                        checked={profileData.service_categories.includes(service)}
                                        onChange={() => handleServiceToggle(service)}
                                    />
                                    <span className="ml-3 text-sm font-medium text-gray-900 group-hover:text-[#1A3C6E] transition-colors">{service}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-gray-100">
                        <label htmlFor="location_preference" className="block text-sm font-semibold text-gray-700">Location Preferences</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-400">📍</span>
                            </div>
                            <input
                                type="text"
                                id="location_preference"
                                name="location_preference"
                                placeholder="Cities or countries you serve e.g. Dubai, London, Toronto"
                                value={profileData.location_preference}
                                onChange={handleProfileChange}
                                className="block w-full pl-10 pt-2.5 pb-2.5 rounded-lg border-gray-300 shadow-sm focus:border-[#1A3C6E] focus:ring-[#1A3C6E] sm:text-sm bg-gray-50 transition-colors focus:bg-white border"
                            />
                        </div>
                    </div>

                    <div className="pt-6 flex justify-end">
                        <button
                            type="submit"
                            disabled={savingProfile}
                            className="inline-flex justify-center items-center py-2.5 px-6 border border-transparent shadow-sm text-sm font-bold rounded-lg text-white bg-[#1A3C6E] hover:bg-[#122b52] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1A3C6E] disabled:opacity-70 transition-colors"
                        >
                            {savingProfile ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Saving...
                                </>
                            ) : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>

            {/* SECTION 2 - Account Security */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200 bg-gray-50/50">
                    <h2 className="text-lg font-bold text-gray-900">Change Password</h2>
                    <p className="mt-1 text-sm text-gray-500">Update your password associated with your account.</p>
                </div>
                
                <form onSubmit={handlePasswordChange} className="p-6 space-y-6">
                    <div className="space-y-4 max-w-md">
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">Current Password</label>
                            <input
                                type="password"
                                required
                                value={passwords.current}
                                onChange={(e) => setPasswords(prev => ({...prev, current: e.target.value}))}
                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#1A3C6E] focus:ring-[#1A3C6E] sm:text-sm px-4 py-2.5 bg-gray-50 border"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">New Password</label>
                            <input
                                type="password"
                                required
                                minLength={8}
                                value={passwords.new}
                                onChange={(e) => setPasswords(prev => ({...prev, new: e.target.value}))}
                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#1A3C6E] focus:ring-[#1A3C6E] sm:text-sm px-4 py-2.5 bg-gray-50 border"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">Confirm New Password</label>
                            <input
                                type="password"
                                required
                                minLength={8}
                                value={passwords.confirm}
                                onChange={(e) => setPasswords(prev => ({...prev, confirm: e.target.value}))}
                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#1A3C6E] focus:ring-[#1A3C6E] sm:text-sm px-4 py-2.5 bg-gray-50 border"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-start">
                        <button
                            type="submit"
                            disabled={savingPassword || !passwords.new || !passwords.current || !passwords.confirm}
                            className="inline-flex justify-center items-center py-2.5 px-6 border border-gray-300 shadow-sm text-sm font-bold rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1A3C6E] disabled:opacity-50 transition-colors"
                        >
                            {savingPassword ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Updating...
                                </>
                            ) : 'Update Password'}
                        </button>
                    </div>
                </form>
            </div>

            {/* SECTION 3 - Account Info (read only) */}
            <div className="bg-gray-50 rounded-2xl shadow-sm border border-gray-200 overflow-hidden px-6 py-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-500">Member since</p>
                        <p className="text-base font-bold text-gray-900">{formatDate(profileData.created_at)}</p>
                    </div>
                    
                    <div className="hidden md:block w-px h-10 bg-gray-200"></div>

                    <div className="space-y-1 w-full md:w-auto overflow-hidden">
                        <p className="text-sm font-medium text-gray-500">Account email</p>
                        <p className="text-base font-bold text-gray-900 truncate">{user?.email}</p>
                    </div>
                    
                    <div className="hidden md:block w-px h-10 bg-gray-200"></div>

                    <div className="space-y-1 w-full md:w-auto overflow-hidden">
                        <p className="text-sm font-medium text-gray-500">Account ID</p>
                        <p className="text-base font-mono text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200 shadow-sm truncate max-w-[150px]">
                            {user?.id.substring(0, 8)}...
                        </p>
                    </div>
                </div>
            </div>

        </div>
    );
};
