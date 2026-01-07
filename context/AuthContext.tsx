import React, { createContext, useContext, useEffect, useState } from 'react';
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
    signOut: () => Promise<void>;
    // getMockUsers: () => typeof MOCK_USERS_DB; // RIMOSSO
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Fix: Explicitly type AuthProvider as React.FC to resolve children prop typing issue in App.tsx
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

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
                console.warn('Profile fetch error:', error.message);
                // Fallback se il profilo non esiste ancora
                return {
                    id: userId,
                    email: email,
                    full_name: email.split('@')[0],
                    role: 'technician' as const
                };
            }
            return data as UserProfile;
        } catch (err) {
            console.error(err);
            return null;
        }
    };

    useEffect(() => {
        // Verifica sessione esistente
        if (supabase?.auth) {
            supabase.auth.getSession().then(async ({ data: { session } }) => {
                setSession(session);
                setUser(session?.user ?? null);
                if (session?.user) {
                    const p = await fetchProfile(session.user.id, session.user.email || '');
                    setProfile(p);
                }
                setLoading(false);
            }).catch(() => setLoading(false));

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
                    }
                    setLoading(false);
                }
            );

            return () => subscription.unsubscribe();
        } else {
            // Modalità Offline / Senza Supabase (Disabilitata per produzione)
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

    const signOut = async () => {
        if (supabase) await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setProfile(null);
        localStorage.removeItem('mock_user_session');
    };

    const getMockUsers = () => []; // Ritorna vuoto o rimuovere definitivamente se refactorizzato ovunque

    return (
        <AuthContext.Provider value={{ user, profile, session, loading, signIn, signOut, getMockUsers }}>
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
