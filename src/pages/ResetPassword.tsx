import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const ResetPassword = () => {
    const navigate = useNavigate();
    
    // Auth state checking
    const [isValidSession, setIsValidSession] = useState(false);
    const [checking, setChecking] = useState(true);

    // Form state
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        // Supabase puts the recovery token in the URL hash
        // We need to let Supabase process it automatically
        supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                // Valid recovery token found — show the reset form
                setIsValidSession(true);
                setChecking(false);
            } else if (event === 'SIGNED_IN' && session) {
                setIsValidSession(true);
                setChecking(false);
            }
        });

        // Also check if there's already a valid session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setIsValidSession(true);
            }
            setChecking(false);
        });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);

        const { error: updateError } = await supabase.auth.updateUser({
            password: password
        });

        if (updateError) {
            setError(updateError.message);
            setLoading(false);
        } else {
            setSuccess(true);
            setPassword('');
            
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        }
    };

    if (checking) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A3C6E] mb-4"></div>
                <p className="text-gray-600">Verifying your reset link...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <h2 className="mt-6 text-3xl font-extrabold text-gray-900 tracking-tight">
                    Reset your password
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-up">
                <div className="bg-white/80 backdrop-blur-lg shadow-xl ring-1 ring-gray-900/5 sm:rounded-2xl py-8 px-4 sm:px-10">
                    {!isValidSession ? (
                        <div className="text-center space-y-4">
                            <div className="p-4 bg-red-50 rounded-md border border-red-200">
                                <p className="text-sm font-medium text-red-800">
                                    This reset link has expired or is invalid.
                                </p>
                                <p className="mt-1 text-xs text-red-700">
                                    Reset links can only be used once and expire after 1 hour.
                                </p>
                            </div>
                            <div className="mt-4">
                                <Link
                                    to="/forgot"
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#1A3C6E] hover:bg-opacity-90 transition-colors"
                                >
                                    Request a new reset link
                                </Link>
                            </div>
                        </div>
                    ) : success ? (
                        <div className="rounded-md bg-green-50 p-4">
                            <div className="flex">
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-green-800">
                                        Password updated successfully!
                                    </h3>
                                    <p className="mt-2 text-sm text-green-700">
                                        Redirecting to login...
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {error && (
                                <div className="text-red-600 text-sm mt-2 text-center">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    New password
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        minLength={8}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1A3C6E]/20 focus:border-[#1A3C6E] transition-all bg-white/50 focus:bg-white"
                                    />
                                </div>
                                <p className="mt-1 text-xs text-gray-500">Minimum 8 characters</p>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-gradient-to-r from-[#1A3C6E] to-[#2a5a9c] hover:from-[#15305c] hover:to-[#22487c] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1A3C6E] disabled:opacity-50 transform transition-all duration-200 hover:-translate-y-0.5"
                                >
                                    {loading ? 'Updating...' : 'Update Password'}
                                </button>
                            </div>
                        </form>
                    )}

                    {(!isValidSession || (!success && isValidSession)) && (
                        <div className="mt-6 text-center">
                            <Link to="/login" className="font-medium text-[#1A3C6E] hover:text-opacity-80 text-sm">
                                Back to login
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
