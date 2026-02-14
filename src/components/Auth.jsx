import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { LogIn, UserPlus, Github } from 'lucide-react';

const Auth = ({ onSession }) => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                alert('Check your email for the confirmation link!');
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            }
        } catch (error) {
            alert(error.error_description || error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container glass-morphism p-8 max-w-md w-full mx-auto mt-20">
            <h2 className="text-2xl font-bold mb-6 text-center">
                {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <form onSubmit={handleAuth} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-text-muted mb-1">Email</label>
                    <input
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 bg-bg-card border border-glass-border rounded-lg focus:outline-none focus:border-primary text-text-main"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-muted mb-1">Password</label>
                    <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 bg-bg-card border border-glass-border rounded-lg focus:outline-none focus:border-primary text-text-main"
                        required
                    />
                </div>
                <button
                    disabled={loading}
                    className="w-full py-3 bg-primary hover:bg-primary-hover rounded-lg font-semibold flex items-center justify-center gap-2"
                >
                    {isSignUp ? <UserPlus size={18} /> : <LogIn size={18} />}
                    {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                </button>
            </form>

            <div className="mt-6 text-center">
                <button
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-primary text-sm hover:underline"
                >
                    {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                </button>
            </div>
        </div>
    );
};

export default Auth;
