import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Patient } from '@/types/radiology';

export function usePatients() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setPatients([]); setLoading(false); return; }
    fetchPatients();
  }, [user]);

  const fetchPatients = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('patients')
      .select('*')
      .eq('user_id', user.id)
      .order('last_name', { ascending: true });
    setPatients((data || []) as Patient[]);
    setLoading(false);
  };

  const createPatient = async (patient: Omit<Patient, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return { patient: null, error: new Error('Not authenticated') };
    const { data, error } = await supabase
      .from('patients')
      .insert({ ...patient, user_id: user.id })
      .select()
      .single();
    if (!error && data) {
      setPatients(prev => [...prev, data as Patient].sort((a, b) => a.last_name.localeCompare(b.last_name)));
    }
    return { patient: data as Patient | null, error };
  };

  const updatePatient = async (id: string, updates: Partial<Patient>) => {
    const { data, error } = await supabase
      .from('patients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (!error && data) {
      setPatients(prev => prev.map(p => p.id === id ? data as Patient : p));
    }
    return { patient: data as Patient | null, error };
  };

  const deletePatient = async (id: string) => {
    const { error } = await supabase.from('patients').delete().eq('id', id);
    if (!error) {
      setPatients(prev => prev.filter(p => p.id !== id));
    }
    return { error };
  };

  const getPatient = async (id: string) => {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    return { patient: data as Patient | null, error };
  };

  return { patients, loading, createPatient, updatePatient, deletePatient, getPatient, refetch: fetchPatients };
}
