import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Toaster } from 'react-hot-toast';
import { useCreditBalance } from '../hooks/useCreditBalance';

export const DashboardLayout = () => {
    const { user, signOut } = useAuth();
    const credits = useCreditBalance();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navLinks = [
        { name: 'Available Leads', path: '/dashboard/leads' },
        { name: 'My Leads', path: '/dashboard/my-leads' },
        { name: 'Credits', path: '/dashboard/credits' },
        { name: 'Profile', path: '/dashboard/profile' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Top Navigation Bar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1A3C6E] text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Left side: Logo */}
                        <div className="flex-shrink-0 flex items-center">
                            <span className="font-bold text-[20px]">
                                HomeConnect
                            </span>
                        </div>

                        {/* Center: Desktop Navigation */}
                        <div className="hidden md:flex space-x-8">
                            {navLinks.map((link) => (
                                <NavLink
                                    key={link.name}
                                    to={link.path}
                                    className={({ isActive }) =>
                                        `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                                            isActive
                                                ? 'border-[#E67E22] text-white'
                                                : 'border-transparent text-gray-300 hover:text-white hover:border-gray-300'
                                        }`
                                    }
                                >
                                    {link.name}
                                </NavLink>
                            ))}
                        </div>

                        {/* Right side: User Info & Actions */}
                        <div className="hidden md:flex items-center space-x-4">
                            {/* Credit Badge */}
                            <div className={`text-white text-xs font-bold px-3 py-1 rounded-full flex items-center shadow-sm transition-colors ${credits > 0 ? 'bg-[#E67E22]' : 'bg-red-600'}`}>
                                ⚡ {credits} credit{credits !== 1 ? 's' : ''}
                            </div>
                            
                            {/* User Email */}
                            <span className="text-sm text-gray-200">
                                {user?.email}
                            </span>
                            
                            {/* Logout Button */}
                            <button
                                onClick={signOut}
                                className="inline-flex items-center px-3 py-1.5 border border-white rounded-md text-sm font-medium text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1A3C6E] focus:ring-white"
                            >
                                Log Out
                            </button>
                        </div>

                        {/* Mobile menu button */}
                        <div className="flex items-center md:hidden">
                            {/* Mobile Credit Badge */}
                            <div className={`text-white text-xs font-bold px-2 py-1 rounded-full flex items-center mr-4 transition-colors ${credits > 0 ? 'bg-[#E67E22]' : 'bg-red-600'}`}>
                                ⚡ {credits}
                            </div>
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="inline-flex items-center justify-center p-2 rounded-md text-gray-300 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                            >
                                <span className="sr-only">Open main menu</span>
                                {/* Hamburger icon */}
                                {!isMobileMenuOpen ? (
                                    <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                ) : (
                                    <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Slide-down */}
                {isMobileMenuOpen && (
                    <div className="md:hidden animate-fade-in-up bg-[#15305c] border-t border-white/10">
                        <div className="pt-2 pb-3 space-y-1">
                            {navLinks.map((link) => (
                                <NavLink
                                    key={link.name}
                                    to={link.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={({ isActive }) =>
                                        `block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors ${
                                            isActive
                                                ? 'border-[#E67E22] text-white bg-white/5'
                                                : 'border-transparent text-gray-300 hover:text-white hover:bg-white/5 hover:border-gray-300'
                                        }`
                                    }
                                >
                                    {link.name}
                                </NavLink>
                            ))}
                        </div>
                        <div className="pt-4 pb-3 border-t border-white/10">
                            <div className="flex items-center px-4">
                                <div className="text-sm font-medium text-gray-300">
                                    {user?.email}
                                </div>
                            </div>
                            <div className="mt-3 space-y-1">
                                <button
                                    onClick={() => {
                                        setIsMobileMenuOpen(false);
                                        signOut();
                                    }}
                                    className="block w-full text-left pl-3 pr-4 py-2 text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                                >
                                    Log Out
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* Main Content Area */}
            <main className="flex-1 w-full pt-16">
                <div className="max-w-[1200px] mx-auto w-full bg-white min-h-[calc(100vh-4rem)] p-4 md:p-6 shadow-sm">
                    <Outlet />
                </div>
            </main>
            <Toaster position="top-right" />
        </div>
    );
};
