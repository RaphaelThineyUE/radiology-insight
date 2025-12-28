import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from './useAuth';
import type { Profile } from '@/types/radiology';
import { createLogger } from '@/lib/logger';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const db = createClient(supabaseUrl, supabaseKey);
const log = createLogger('useProfile');

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setProfile(null); setLoading(false); return; }
    log.info('User changed, fetching profile', { userId: user.id });
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    setLoading(true);
    log.debug('Fetching profile');
    const { data, error } = await db.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (error) log.error('Fetch profile failed', error);
    setProfile(data as Profile | null);
    setLoading(false);
    log.info('Profile fetched', { hasProfile: !!data });
  };

  const updateApiKey = async (apiKey: string) => {
    if (!user) return { error: new Error('Not authenticated') };
    const encoded = btoa(apiKey);
    const { error } = await db.from('profiles').update({ openai_api_key_encrypted: encoded }).eq('id', user.id);
    if (!error) setProfile(prev => prev ? { ...prev, openai_api_key_encrypted: encoded } : null);
    if (error) log.error('Update API key failed', error); else log.info('API key updated');
    return { error };
  };

  const getApiKey = (): string | null => {
    if (!profile?.openai_api_key_encrypted) return null;
    try { const key = atob(profile.openai_api_key_encrypted); log.debug('Decoded API key'); return key; } catch (e) { log.warn('Failed to decode API key', e); return null; }
  };

  const clearApiKey = async () => {
    if (!user) return { error: new Error('Not authenticated') };
    const { error } = await db.from('profiles').update({ openai_api_key_encrypted: null }).eq('id', user.id);
    if (!error) setProfile(prev => prev ? { ...prev, openai_api_key_encrypted: null } : null);
    if (error) log.error('Clear API key failed', error); else log.info('API key cleared');
    return { error };
  };

  return { profile, loading, updateApiKey, getApiKey, clearApiKey, hasApiKey: !!profile?.openai_api_key_encrypted, refetch: fetchProfile };
}
