
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { getSiteUrl } from '@/utils/getSiteUrl';
import { useQueryClient } from '@tanstack/react-query';


interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  syncSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  // Funzione per sincronizzare l'abbonamento
  const syncSubscription = async () => {
    try {
      // Verifica e rinnova la sessione se necessario
      const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
      let session = initialSession;
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        return;
      }
      
      if (!session?.access_token) {
        console.log('No active session for sync');
        return;
      }
      
      // Verifica se il token è scaduto e prova a rinnovarlo
      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at <= now) {
        console.log('Token expired, refreshing session...');
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshedSession?.access_token) {
          console.error('Failed to refresh session:', refreshError);
          return;
        }
        
        // Usa la sessione rinnovata
        session = refreshedSession;
      }
      
      console.log('Syncing subscription...');
      
      // Aggiungi timeout per evitare blocchi
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sync timeout')), 10000)
      );
      
      const syncPromise = supabase.functions.invoke('sync-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      const response = await Promise.race([syncPromise, timeoutPromise]);
      
      if (response.error) {
        console.error('Sync subscription error:', response.error);
      } else {
        console.log('Subscription synced successfully:', response.data);
        // Invalida le query per aggiornare i dati
        queryClient.invalidateQueries({ queryKey: ['subscription'] });
      }
    } catch (error) {
      console.error('Error syncing subscription:', error);
      // Non bloccare l'app se la sincronizzazione fallisce
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Sincronizza l'abbonamento quando l'utente si autentica (non bloccante)
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('User signed in, syncing subscription...');
          syncSubscription().catch(error => {
            console.error('Background sync failed:', error);
          });
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Sincronizza l'abbonamento all'avvio dell'app se l'utente è già autenticato (non bloccante)
      if (session?.user) {
        console.log('User already authenticated, syncing subscription...');
        syncSubscription().catch(error => {
          console.error('Background sync failed:', error);
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);


  const signInWithGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getSiteUrl(),
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
          scope: 'openid email profile'
        }
      }
    });

    if (error) {
      console.error('Error signing in with Google:', error);
      setLoading(false);
      throw error;
    }
  }; // ✅ chiusura corretta

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value = {
    user,
    session,
    loading,
    signInWithGoogle,
    signOut,
    syncSubscription
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
