import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from './useAuth';
import type { Document, Extraction } from '@/types/radiology';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const db = createClient(supabaseUrl, supabaseKey);

export function useDocuments() {
  const { user, session } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setDocuments([]); setLoading(false); return; }
    fetchDocuments();
  }, [user]);

  const fetchDocuments = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await db.from('documents').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setDocuments((data || []) as Document[]);
    setLoading(false);
  };

  const uploadDocument = async (file: File): Promise<{ documentId: string | null; error: Error | null }> => {
    if (!user || !session) return { documentId: null, error: new Error('Not authenticated') };
    try {
      const authClient = createClient(supabaseUrl, supabaseKey, { global: { headers: { Authorization: `Bearer ${session.access_token}` } } });
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await authClient.storage.from('documents').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data, error: insertError } = await db.from('documents').insert({ user_id: user.id, filename: file.name, file_type: file.type, file_size: file.size, storage_path: filePath, status: 'pending' }).select().single();
      if (insertError) throw insertError;
      await fetchDocuments();
      return { documentId: (data as Document).id, error: null };
    } catch (error) { return { documentId: null, error: error as Error }; }
  };

  const deleteDocument = async (documentId: string) => {
    if (!user || !session) return { error: new Error('Not authenticated') };
    const doc = documents.find(d => d.id === documentId);
    if (doc) {
      const authClient = createClient(supabaseUrl, supabaseKey, { global: { headers: { Authorization: `Bearer ${session.access_token}` } } });
      await authClient.storage.from('documents').remove([doc.storage_path]);
    }
    const { error } = await db.from('documents').delete().eq('id', documentId);
    if (!error) setDocuments(prev => prev.filter(d => d.id !== documentId));
    return { error };
  };

  const getDocumentWithExtraction = async (documentId: string) => {
    const { data: doc, error: docError } = await db.from('documents').select('*').eq('id', documentId).single();
    if (docError) return { document: null, extraction: null, documentUrl: null, error: docError };
    const { data: extraction } = await db.from('extractions').select('*').eq('document_id', documentId).maybeSingle();
    
    // Get signed URL for document preview
    let documentUrl = null;
    if (doc && session) {
      const authClient = createClient(supabaseUrl, supabaseKey, { global: { headers: { Authorization: `Bearer ${session.access_token}` } } });
      const { data: urlData } = await authClient.storage.from('documents').createSignedUrl(doc.storage_path, 3600);
      documentUrl = urlData?.signedUrl || null;
    }
    
    return { document: doc as Document, extraction: extraction as Extraction | null, documentUrl, error: null };
  };

  return { documents, loading, uploadDocument, deleteDocument, getDocumentWithExtraction, refetch: fetchDocuments };
}
