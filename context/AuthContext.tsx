import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../config/supabase';
import { User, Session } from '@supabase/supabase-js';
import { UserProfile } from '../types';

// DB SIMULATO UTENTI (Hardcoded per la demo)
// DB SIMULATO UTENTI RIMOSSO - Usare Supabase Auth

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    session: Session | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: any }>;
    signOut: (beforeLogout?: () => Promise<void>) => Promise<void>;
    // getMockUsers: () => typeof MOCK_USERS_DB; // RIMOSSO
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Fix: Explicitly type AuthProvider as React.FC to resolve children prop typing issue in App.tsx
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    // Fix: use a ref to track loading state inside setTimeout callbacks,
    // since reading the React state variable inside a closure always gives a stale value.
    const loadingRef = useRef(true);

    // Helper per ottenere il profilo dal DB
    const fetchProfile = async (userId: string, email: string) => {
        if (!supabase) return null;
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Profile fetch error:', error.message);
                console.error('User must have a profile in the profiles table. ID:', userId);
                return null;
            }

            console.log('✅ Profile loaded:', data.email, '| Role:', data.role, '| UUID:', userId);

            // Cache del profilo per avvio rapido
            localStorage.setItem('user_profile', JSON.stringify(data));
            return data as UserProfile;
        } catch (err) {
            console.error(err);
            return null;
        }
    };

    useEffect(() => {
        // Verifica sessione esistente
        if (supabase?.auth) {
            // Helper to set loading and keep ref in sync — defined first to avoid hoisting issues
            const stopLoading = () => {
                loadingRef.current = false;
                setLoading(false);
            };

            supabase.auth.getSession().then(async ({ data: { session } }) => {
                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    // TENTATIVO CARICAMENTO CACHE (Optimistic UI)
                    const cached = localStorage.getItem('user_profile');
                    if (cached) {
                        try {
                            const p = JSON.parse(cached);
                            if (p.id === session.user.id) {
                                setProfile(p);
                                stopLoading(); // Sblocca l'app subito!
                            }
                        } catch (e) {
                            console.error("Cache error", e);
                        }
                    }

                    // Fetch aggiornato in background
                    fetchProfile(session.user.id, session.user.email || '').then(p => {
                        setProfile(p);
                        stopLoading(); // Se non avevamo cache, sblocca ora
                    }).catch(() => stopLoading());
                } else {
                    stopLoading();
                }
            }).catch(() => stopLoading());

            // Safety Timeout: Force stop loading after 2 seconds if something hangs
            const safetyTimeout = setTimeout(() => {
                // Fix: use ref instead of state variable to avoid stale closure
                if (loadingRef.current) {
                    console.warn("AuthContext: Loading timed out after 2s, forcing completion.");
                    loadingRef.current = false;
                    setLoading(false);
                }
            }, 2000);

            // Listener per cambiamenti auth
            const { data: { subscription } } = supabase.auth.onAuthStateChange(
                async (_event, session) => {
                    setSession(session);
                    setUser(session?.user ?? null);
                    if (session?.user) {
                        const p = await fetchProfile(session.user.id, session.user.email || '');
                        setProfile(p);
                    } else {
                        setProfile(null);
                        localStorage.removeItem('user_profile');
                    }
                    stopLoading();
                    clearTimeout(safetyTimeout);
                }
            );

            return () => {
                subscription.unsubscribe();
                clearTimeout(safetyTimeout);
            };
        } else {
            setLoading(false);
            return () => { };
        }
    }, []);

    const signIn = async (email: string, password: string) => {
        if (!supabase) {
            return { error: { message: "Supabase client not initialized" } };
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        return { error };
    };

    const signOut = async (beforeLogout?: () => Promise<void>) => {
        if (beforeLogout) {
            try {
                await beforeLogout();
            } catch (e) {
                console.error("Error during beforeLogout sync", e);
            }
        }
        if (supabase) await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setProfile(null);
        localStorage.removeItem('user_profile');
    };



    return (
        <AuthContext.Provider value={{ user, profile, session, loading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth deve essere usato dentro AuthProvider');
    }
    return context;
};
