import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUsageStats } from '@/hooks/useUsageStats';
import { useDocuments } from '@/hooks/useDocuments';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, Settings, LogOut, AlertTriangle, CheckCircle, Clock, BarChart3 } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';

export default function Dashboard() {
  const { stats, loading: statsLoading } = useUsageStats();
  const { documents, loading: docsLoading } = useDocuments();
  const { hasApiKey } = useProfile();

  const recentDocs = documents.slice(0, 5);

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome to RadiologyExtract Pro</p>
        </div>

        {!hasApiKey && (
          <Card className="border-warning bg-warning/5">
            <CardContent className="flex items-center gap-4 py-4">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <div className="flex-1">
                <p className="font-medium">OpenAI API Key Required</p>
                <p className="text-sm text-muted-foreground">Add your API key in settings to start extracting documents.</p>
              </div>
              <Button asChild variant="outline" size="sm"><Link to="/settings">Configure</Link></Button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Documents</CardTitle><FileText className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats?.totalDocuments || 0}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Completed</CardTitle><CheckCircle className="h-4 w-4 text-success" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats?.completedExtractions || 0}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Failed</CardTitle><AlertTriangle className="h-4 w-4 text-destructive" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats?.failedExtractions || 0}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Avg. Time</CardTitle><Clock className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats?.avgProcessingTime ? `${(stats.avgProcessingTime / 1000).toFixed(1)}s` : '-'}</div></CardContent></Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Quick Actions</CardTitle><CardDescription>Get started with document extraction</CardDescription></CardHeader>
            <CardContent className="grid gap-3">
              <Button asChild className="justify-start" size="lg"><Link to="/upload"><Upload className="mr-2 h-5 w-5" />Upload New Document</Link></Button>
              <Button asChild variant="outline" className="justify-start" size="lg"><Link to="/library"><FileText className="mr-2 h-5 w-5" />View Document Library</Link></Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Recent Documents</CardTitle><CardDescription>Your latest uploads</CardDescription></CardHeader>
            <CardContent>
              {recentDocs.length === 0 ? (
                <p className="text-muted-foreground text-sm">No documents yet. Upload your first one!</p>
              ) : (
                <div className="space-y-3">
                  {recentDocs.map(doc => (
                    <Link key={doc.id} to={doc.status === 'completed' ? `/results/${doc.id}` : '#'} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm truncate max-w-[200px]">{doc.filename}</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${doc.status === 'completed' ? 'bg-success/10 text-success' : doc.status === 'failed' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>{doc.status}</span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
