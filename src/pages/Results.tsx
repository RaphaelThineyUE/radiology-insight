import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDocuments } from '@/hooks/useDocuments';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Download, Copy, AlertTriangle, CheckCircle } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import type { Document, Extraction, RadiologyExtraction } from '@/types/radiology';

const biradsColors: Record<number, string> = { 0: 'bg-muted', 1: 'birads-1', 2: 'birads-2', 3: 'birads-3', 4: 'birads-4', 5: 'birads-5', 6: 'birads-6' };
const biradsLabels: Record<number, string> = { 0: 'Incomplete', 1: 'Negative', 2: 'Benign', 3: 'Probably Benign', 4: 'Suspicious', 5: 'Highly Suggestive', 6: 'Known Malignancy' };

export default function Results() {
  const { documentId } = useParams<{ documentId: string }>();
  const { getDocumentWithExtraction } = useDocuments();
  const [doc, setDoc] = useState<Document | null>(null);
  const [extraction, setExtraction] = useState<Extraction | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (documentId) {
      getDocumentWithExtraction(documentId).then(({ document: fetchedDoc, extraction }) => {
        setDoc(fetchedDoc);
        setExtraction(extraction);
        setLoading(false);
      });
    }
  }, [documentId]);

  const data = extraction?.extraction_data as RadiologyExtraction | undefined;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard' });
  };

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc?.filename || 'extraction'}.json`;
    a.click();
  };

  if (loading) return <AppLayout><div className="flex justify-center py-12"><p className="text-muted-foreground">Loading...</p></div></AppLayout>;
  if (!data) return <AppLayout><div className="text-center py-12"><p className="text-muted-foreground">No extraction data found.</p><Button asChild className="mt-4"><Link to="/library">Back to Library</Link></Button></div></AppLayout>;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4"><Button variant="ghost" size="sm" asChild><Link to="/library"><ArrowLeft className="h-4 w-4 mr-2" />Back</Link></Button><h1 className="text-2xl font-bold">{doc?.filename}</h1></div>
          <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => copyToClipboard(JSON.stringify(data, null, 2))}><Copy className="h-4 w-4 mr-2" />Copy JSON</Button><Button variant="outline" size="sm" onClick={downloadJSON}><Download className="h-4 w-4 mr-2" />Download</Button></div>
        </div>

        <Tabs defaultValue="report">
          <TabsList><TabsTrigger value="report">Report Card</TabsTrigger><TabsTrigger value="json">JSON View</TabsTrigger></TabsList>
          
          <TabsContent value="report" className="space-y-6 mt-6">
            {data.red_flags.length > 0 && (
              <Card className="border-destructive bg-destructive/5"><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="h-5 w-5" />Red Flags</CardTitle></CardHeader><CardContent><ul className="list-disc list-inside space-y-1">{data.red_flags.map((flag, i) => <li key={i}>{flag}</li>)}</ul></CardContent></Card>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm">BI-RADS</CardTitle></CardHeader><CardContent><span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${data.birads.value !== null ? biradsColors[data.birads.value] : 'bg-muted'}`}>{data.birads.value !== null ? `${data.birads.value} - ${biradsLabels[data.birads.value]}` : 'Not found'}</span><p className="text-xs text-muted-foreground mt-2">Confidence: {data.birads.confidence}</p></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Breast Density</CardTitle></CardHeader><CardContent><span className="text-2xl font-bold">{data.breast_density.value || '-'}</span></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Exam Type</CardTitle></CardHeader><CardContent><p className="font-medium">{data.exam.type || 'Unknown'}</p><p className="text-sm text-muted-foreground">{data.exam.laterality || 'Not specified'}</p></CardContent></Card>
            </div>

            <Card><CardHeader><CardTitle>Summary</CardTitle></CardHeader><CardContent><p>{data.summary}</p></CardContent></Card>

            <Card><CardHeader><CardTitle>Findings ({data.findings.length})</CardTitle></CardHeader><CardContent><div className="space-y-4">{data.findings.map((finding, i) => (
              <div key={i} className="p-4 rounded-lg bg-muted/50">
                <div className="flex justify-between items-start mb-2"><span className="font-medium">{finding.location || 'Location not specified'}</span><span className={`text-xs px-2 py-1 rounded ${finding.assessment === 'benign' ? 'bg-success/10 text-success' : finding.assessment === 'suspicious' || finding.assessment === 'highly_suggestive_malignancy' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>{finding.assessment.replace(/_/g, ' ')}</span></div>
                <p className="text-sm text-muted-foreground">{finding.description}</p>
                <p className="text-xs text-muted-foreground mt-2">Laterality: {finding.laterality}</p>
              </div>
            ))}</div></CardContent></Card>

            <Card><CardHeader><CardTitle>Recommendations</CardTitle></CardHeader><CardContent><div className="space-y-3">{data.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-3"><CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" /><div><p className="font-medium">{rec.action}</p>{rec.timeframe && <p className="text-sm text-muted-foreground">Timeframe: {rec.timeframe}</p>}</div></div>
            ))}</div></CardContent></Card>
          </TabsContent>

          <TabsContent value="json" className="mt-6">
            <Card><CardContent className="pt-6"><pre className="bg-muted p-4 rounded-lg overflow-auto text-sm font-mono max-h-[600px]">{JSON.stringify(data, null, 2)}</pre></CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
