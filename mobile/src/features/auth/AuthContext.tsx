import type { Session } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import i18n from 'i18next';
import { Alert, AppState, Platform } from 'react-native';

import { backend } from '@/features/backend';
import { creditStore } from '@/features/store/creditStore';
import { supabase } from '@/lib/supabase';

type AuthApi = {
  /** False in local mode (no Supabase configured): no accounts, no credits. */
  enabled: boolean;
  ready: boolean;
  session: Session | null;
  credits: number | null;
  /** Short code of this account (e.g. PB-7K3Q9X): the owner gives credits with it. */
  accountCode: string | null;
  appleAvailable: boolean;
  signInWithApple(): Promise<'signed_in' | 'cancelled'>;
  signOut(): Promise<void>;
  deleteAccount(): Promise<void>;
  refreshCredits(): Promise<void>;
};

const AuthContext = createContext<AuthApi | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!supabase);
  const [credits, setCredits] = useState<number | null>(null);
  const [accountCode, setAccountCode] = useState<string | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'ios') AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  const refreshCredits = useCallback(async () => {
    if (!supabase || !session) return;
    const { data } = await supabase
      .from('profiles')
      .select('credits, account_code')
      .eq('id', session.user.id)
      .maybeSingle();
    setCredits(data?.credits ?? 0);
    setAccountCode(data?.account_code ?? null);
  }, [session]);

  // Purchases left unfinished (app closed mid-purchase, Ask to Buy approved later) and vouchers
  // redeemed in Apple's sheet or in the App Store: hand them to the server whenever the app opens
  // or comes back to the front. Each transaction adds credits only once.
  const userId = session?.user.id;
  useEffect(() => {
    if (!userId || !creditStore.available) return;
    const collect = () =>
      creditStore
        .restore((signed) => backend.verifyPurchase(signed))
        .then((added) => {
          if (added <= 0) return;
          refreshCredits();
          Alert.alert(i18n.t('settings.codeRedeemed', { count: added }));
        })
        .catch(() => {});
    collect();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') collect();
    });
    return () => sub.remove();
    // Once per signed-in user, not on every credits refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function signInWithApple() {
    if (!supabase) throw new Error('auth_disabled');
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL],
      });
      if (!credential.identityToken) throw new Error('no_identity_token');
      const { error } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: credential.identityToken });
      if (error) throw error;
      return 'signed_in';
    } catch (e) {
      if ((e as { code?: string }).code === 'ERR_REQUEST_CANCELED') return 'cancelled';
      throw e;
    }
  }

  async function signOut() {
    await supabase?.auth.signOut();
    setCredits(null);
  }

  async function deleteAccount() {
    if (!supabase) return;
    const { error } = await supabase.functions.invoke('delete-account', { body: {} });
    if (error) throw error;
    // The server already removed the user; clear the local session too.
    await supabase.auth.signOut({ scope: 'local' });
    setCredits(null);
  }

  return (
    <AuthContext.Provider
      value={{
        enabled: !!supabase,
        ready,
        session,
        credits: session ? credits : null,
        accountCode: session ? accountCode : null,
        appleAvailable,
        signInWithApple,
        signOut,
        deleteAccount,
        refreshCredits,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
