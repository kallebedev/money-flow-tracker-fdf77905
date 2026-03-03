import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  updateProfile: (data: { name?: string; avatar_url?: string }) => Promise<{ error: any }>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true); // Renamed from isLoading

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false); // Renamed from setIsLoading
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false); // Renamed from setIsLoading
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  };

  const signUp = async (email: string, password: string, name: string) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: window.location.origin,
      },
    });
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const updateProfile = async (data: { name?: string; avatar_url?: string }) => {
    const { data: updatedData, error } = await supabase.auth.updateUser({
      data: {
        name: data.name,
        avatar_url: data.avatar_url,
      },
    });

    if (!error && updatedData.user) {
      setUser(updatedData.user);
    }

    return { error };
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      // isAuthenticated: !!user, // Removed as per the provider value change
      login,
      signUp,
      logout,
      loading, // Renamed from isLoading
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
