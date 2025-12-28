import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from './useAuth';
import type { UsageStats, UsageLog } from '@/types/radiology';
import { createLogger } from '@/lib/logger';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const db = createClient(supabaseUrl, supabaseKey);
const log = createLogger('useUsageStats');

export function useUsageStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setStats(null); setLoading(false); return; }
    log.info('User changed, fetching usage stats', { userId: user.id });
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;
    setLoading(true);
    try {
      log.debug('Fetching usage stats');
      const { count: totalDocuments } = await db.from('documents').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      const { count: completedExtractions } = await db.from('documents').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'completed');
      const { count: failedExtractions } = await db.from('documents').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'failed');
      const { data: extractions } = await db.from('extractions').select('processing_time_ms').eq('user_id', user.id);
      const avgProcessingTime = extractions?.length ? extractions.reduce((acc, e: any) => acc + (e.processing_time_ms || 0), 0) / extractions.length : 0;
      const { data: recentActivity } = await db.from('usage_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10);
      setStats({ totalDocuments: totalDocuments || 0, completedExtractions: completedExtractions || 0, failedExtractions: failedExtractions || 0, avgProcessingTime, recentActivity: (recentActivity || []) as UsageLog[] });
      log.info('Usage stats fetched', { totalDocuments, completedExtractions, failedExtractions, avgProcessingTime });
    } catch (error) { console.error('Error fetching stats:', error); }
    setLoading(false);
  };

  return { stats, loading, refetch: fetchStats };
}
