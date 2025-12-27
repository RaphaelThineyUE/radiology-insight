import { Link } from 'react-router-dom';
import { useDocuments } from '@/hooks/useDocuments';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FileText, Trash2, ExternalLink, Search } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { useState } from 'react';

export default function Library() {
  const { documents, loading, deleteDocument } = useDocuments();
  const [search, setSearch] = useState('');

  const filtered = documents.filter(d => d.filename.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div><h1 className="text-3xl font-bold">Document Library</h1><p className="text-muted-foreground mt-1">{documents.length} documents</p></div>
          <Button asChild><Link to="/upload">Upload New</Link></Button>
        </div>

        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search documents..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" /></div>

        {loading ? (
          <p className="text-muted-foreground text-center py-8">Loading...</p>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="text-center py-12"><FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No documents found</p><Button asChild className="mt-4"><Link to="/upload">Upload your first document</Link></Button></CardContent></Card>
        ) : (
          <div className="grid gap-4">
            {filtered.map(doc => (
              <Card key={doc.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium">{doc.filename}</p>
                      <p className="text-sm text-muted-foreground">{new Date(doc.created_at).toLocaleDateString()} · {(doc.file_size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${doc.status === 'completed' ? 'bg-success/10 text-success' : doc.status === 'failed' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>{doc.status}</span>
                    {doc.status === 'completed' && <Button variant="ghost" size="sm" asChild><Link to={`/results/${doc.id}`}><ExternalLink className="h-4 w-4" /></Link></Button>}
                    <Button variant="ghost" size="sm" onClick={() => deleteDocument(doc.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
