import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from './useAuth';
import type { Profile } from '@/types/radiology';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const db = createClient(supabaseUrl, supabaseKey);

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setProfile(null); setLoading(false); return; }
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await db.from('profiles').select('*').eq('id', user.id).maybeSingle();
    setProfile(data as Profile | null);
    setLoading(false);
  };

  const updateApiKey = async (apiKey: string) => {
    if (!user) return { error: new Error('Not authenticated') };
    const encoded = btoa(apiKey);
    const { error } = await db.from('profiles').update({ openai_api_key_encrypted: encoded }).eq('id', user.id);
    if (!error) setProfile(prev => prev ? { ...prev, openai_api_key_encrypted: encoded } : null);
    return { error };
  };

  const getApiKey = (): string | null => {
    if (!profile?.openai_api_key_encrypted) return null;
    try { return atob(profile.openai_api_key_encrypted); } catch { return null; }
  };

  const clearApiKey = async () => {
    if (!user) return { error: new Error('Not authenticated') };
    const { error } = await db.from('profiles').update({ openai_api_key_encrypted: null }).eq('id', user.id);
    if (!error) setProfile(prev => prev ? { ...prev, openai_api_key_encrypted: null } : null);
    return { error };
  };

  return { profile, loading, updateApiKey, getApiKey, clearApiKey, hasApiKey: !!profile?.openai_api_key_encrypted, refetch: fetchProfile };
}
