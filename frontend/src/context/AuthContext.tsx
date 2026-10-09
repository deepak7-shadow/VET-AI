import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface FarmerProfile {
  id: string;
  full_name: string;
  email: string;
  farm_name: string;
  phone?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: FarmerProfile | null;
  loading: boolean;
  isDemo: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (data: { email: string; password: string; fullName: string; farmName: string; phone?: string }) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
  updateProfile: (data: Partial<FarmerProfile>) => Promise<{ error: any }>;
  enterDemoMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  // Fetch or create profile from public.profiles table
  const fetchProfile = async (userId: string, userMeta?: any) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        setProfile(data as FarmerProfile);
      } else if (!error) {
        // Fallback default profile if table row pending
        setProfile({
          id: userId,
          full_name: userMeta?.full_name || 'Farmer',
          email: userMeta?.email || '',
          farm_name: userMeta?.farm_name || 'Green Valley Dairy',
          phone: userMeta?.phone || '',
          role: 'farmer'
        });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  };

  useEffect(() => {
    // 1. Check existing Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setIsDemo(false);
        fetchProfile(session.user.id, session.user.user_metadata);
      } else {
        // Start in Demo Mode for immediate evaluation if no session
        setIsDemo(true);
        setProfile({
          id: 'demo-farmer-id',
          full_name: 'John Miller',
          email: 'john.miller@greenvalley.farm',
          farm_name: 'Green Valley Dairy',
          phone: '+1 (555) 234-5678',
          role: 'farmer'
        });
      }
      setLoading(false);
    });

    // 2. Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setIsDemo(false);
        await fetchProfile(session.user.id, session.user.user_metadata);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const res = await supabase.auth.signInWithPassword({ email, password });
    if (!res.error && res.data.user) {
      setIsDemo(false);
      await fetchProfile(res.data.user.id, res.data.user.user_metadata);
    }
    return { error: res.error };
  };

  const signUp = async (params: { email: string; password: string; fullName: string; farmName: string; phone?: string }) => {
    const res = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {
          full_name: params.fullName,
          farm_name: params.farmName,
          phone: params.phone || '',
        }
      }
    });

    if (!res.error && res.data.user) {
      // Upsert profile directly as well
      await supabase.from('profiles').upsert({
        id: res.data.user.id,
        full_name: params.fullName,
        email: params.email,
        farm_name: params.farmName,
        phone: params.phone || '',
        role: 'farmer'
      });
      setIsDemo(false);
      await fetchProfile(res.data.user.id);
    }

    return { error: res.error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsDemo(true);
    setProfile({
      id: 'demo-farmer-id',
      full_name: 'John Miller',
      email: 'john.miller@greenvalley.farm',
      farm_name: 'Green Valley Dairy',
      phone: '+1 (555) 234-5678',
      role: 'farmer'
    });
  };

  const requestPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/#reset-password`,
    });
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error };
  };

  const updateProfile = async (updates: Partial<FarmerProfile>) => {
    if (!user) return { error: new Error('User not authenticated') };
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);
    if (!error) {
      setProfile((prev) => prev ? { ...prev, ...updates } : null);
    }
    return { error };
  };

  const enterDemoMode = () => {
    setIsDemo(true);
    setProfile({
      id: 'demo-farmer-id',
      full_name: 'John Miller',
      email: 'john.miller@greenvalley.farm',
      farm_name: 'Green Valley Dairy',
      phone: '+1 (555) 234-5678',
      role: 'farmer'
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isDemo,
        signIn,
        signUp,
        signOut,
        requestPasswordReset,
        updatePassword,
        updateProfile,
        enterDemoMode
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
