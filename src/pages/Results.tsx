import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDocuments } from '@/hooks/useDocuments';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Download, Copy, AlertTriangle, CheckCircle, FileText, Eye, EyeOff } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import type { Document, Extraction, RadiologyExtraction } from '@/types/radiology';
import { createLogger } from '@/lib/logger';

const biradsColors: Record<number, string> = { 0: 'bg-muted', 1: 'birads-1', 2: 'birads-2', 3: 'birads-3', 4: 'birads-4', 5: 'birads-5', 6: 'birads-6' };
const biradsLabels: Record<number, string> = { 0: 'Incomplete', 1: 'Negative', 2: 'Benign', 3: 'Probably Benign', 4: 'Suspicious', 5: 'Highly Suggestive', 6: 'Known Malignancy' };

// Collect all evidence/quotes from extraction data
function collectAllEvidence(data: RadiologyExtraction): string[] {
  const evidence: string[] = [];
  
  if (data.birads.evidence) evidence.push(...data.birads.evidence);
  if (data.breast_density.evidence) evidence.push(...data.breast_density.evidence);
  if (data.exam.evidence) evidence.push(...data.exam.evidence);
  if (data.comparison.evidence) evidence.push(...data.comparison.evidence);
  
  data.findings.forEach(f => {
    if (f.evidence) evidence.push(...f.evidence);
  });
  
  data.recommendations.forEach(r => {
    if (r.evidence) evidence.push(...r.evidence);
  });
  
  return [...new Set(evidence)].filter(e => e && e.trim());
}

export default function Results() {
  const log = createLogger('ResultsPage');
  const { documentId } = useParams<{ documentId: string }>();
  const { getDocumentWithExtraction } = useDocuments();
  const [doc, setDoc] = useState<Document | null>(null);
  const [extraction, setExtraction] = useState<Extraction | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (documentId) {
      getDocumentWithExtraction(documentId).then(({ document: fetchedDoc, extraction, documentUrl }) => {
        setDoc(fetchedDoc);
      log.info('Loading results', { documentId });
    //  getDocumentWithExtraction(documentId).then(({ document, extraction }) => {
     //   setDocument(document);
        setExtraction(extraction);
        setDocumentUrl(documentUrl);
        setLoading(false);
        log.info('Results loaded', { hasExtraction: !!extraction });
      });
    }
  }, [documentId]);

  const data = extraction?.extraction_data as RadiologyExtraction | undefined;
  const allEvidence = data ? collectAllEvidence(data) : [];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard' });
    log.info('Copied JSON to clipboard');
  };

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc?.filename || 'extraction'}.json`;
    a.click();
    log.info('Downloaded JSON');
  };

  if (loading) return <AppLayout><div className="flex justify-center py-12"><p className="text-muted-foreground">Loading...</p></div></AppLayout>;
  if (!data) return <AppLayout><div className="text-center py-12"><p className="text-muted-foreground">No extraction data found.</p><Button asChild className="mt-4"><Link to="/library">Back to Library</Link></Button></div></AppLayout>;

  const isPdf = doc?.file_type === 'application/pdf' || doc?.filename?.toLowerCase().endsWith('.pdf');

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/library"><ArrowLeft className="h-4 w-4 mr-2" />Back</Link>
            </Button>
            <h1 className="text-2xl font-bold">{doc?.filename}</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
              {showPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => copyToClipboard(JSON.stringify(data, null, 2))}>
              <Copy className="h-4 w-4 mr-2" />Copy JSON
            </Button>
            <Button variant="outline" size="sm" onClick={downloadJSON}>
              <Download className="h-4 w-4 mr-2" />Download
            </Button>
          </div>
        </div>

        <div className={`grid gap-6 ${showPreview && documentUrl ? 'lg:grid-cols-2' : ''}`}>
          {/* Document Preview Panel */}
          {showPreview && documentUrl && (
            <Card className="h-fit lg:sticky lg:top-6">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4" />
                  Document Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isPdf ? (
                  <iframe 
                    src={documentUrl} 
                    className="w-full h-[600px] rounded-lg border bg-muted"
                    title="Document Preview"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] bg-muted rounded-lg border">
                    <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-sm">Preview not available for this file type</p>
                    <Button variant="outline" size="sm" className="mt-4" asChild>
                      <a href={documentUrl} target="_blank" rel="noopener noreferrer">
                        Open Document
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Extraction Results Panel */}
          <div className="space-y-6">
            <Tabs defaultValue="report">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="report">Report Card</TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="evidence">Raw Text</TabsTrigger>
                <TabsTrigger value="json">JSON</TabsTrigger>
              </TabsList>
              
              {/* Report Card View */}
              <TabsContent value="report" className="space-y-6 mt-6">
                {data.red_flags.length > 0 && (
                  <Card className="border-destructive bg-destructive/5">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />Red Flags
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside space-y-1">
                        {data.red_flags.map((flag, i) => <li key={i}>{flag}</li>)}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">BI-RADS</CardTitle></CardHeader>
                    <CardContent>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${data.birads.value !== null ? biradsColors[data.birads.value] : 'bg-muted'}`}>
                        {data.birads.value !== null ? `${data.birads.value} - ${biradsLabels[data.birads.value]}` : 'Not found'}
                      </span>
                      <p className="text-xs text-muted-foreground mt-2">Confidence: {data.birads.confidence}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Breast Density</CardTitle></CardHeader>
                    <CardContent>
                      <span className="text-2xl font-bold">{data.breast_density.value || '-'}</span>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Exam Type</CardTitle></CardHeader>
                    <CardContent>
                      <p className="font-medium">{data.exam.type || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground">{data.exam.laterality || 'Not specified'}</p>
                    </CardContent>
                  </Card>
                </div>

                {data.comparison.prior_exam_date && (
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Comparison</CardTitle></CardHeader>
                    <CardContent>
                      <p className="text-sm">Prior exam date: <span className="font-medium">{data.comparison.prior_exam_date}</span></p>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader><CardTitle>Findings ({data.findings.length})</CardTitle></CardHeader>
                  <CardContent>
                    {data.findings.length === 0 ? (
                      <p className="text-muted-foreground">No findings extracted.</p>
                    ) : (
                      <div className="space-y-4">
                        {data.findings.map((finding, i) => (
                          <div key={i} className="p-4 rounded-lg bg-muted/50">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium">{finding.location || 'Location not specified'}</span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                finding.assessment === 'benign' ? 'bg-success/10 text-success' : 
                                finding.assessment === 'suspicious' || finding.assessment === 'highly_suggestive_malignancy' ? 'bg-destructive/10 text-destructive' : 
                                'bg-warning/10 text-warning'
                              }`}>
                                {finding.assessment.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{finding.description}</p>
                            <p className="text-xs text-muted-foreground mt-2">Laterality: {finding.laterality}</p>
                            {finding.evidence && finding.evidence.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-border/50">
                                <p className="text-xs font-medium text-muted-foreground mb-1">Evidence:</p>
                                <ul className="text-xs text-muted-foreground italic">
                                  {finding.evidence.map((e, j) => <li key={j}>"{e}"</li>)}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Recommendations</CardTitle></CardHeader>
                  <CardContent>
                    {data.recommendations.length === 0 ? (
                      <p className="text-muted-foreground">No recommendations extracted.</p>
                    ) : (
                      <div className="space-y-3">
                        {data.recommendations.map((rec, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium">{rec.action}</p>
                              {rec.timeframe && <p className="text-sm text-muted-foreground">Timeframe: {rec.timeframe}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Summary View */}
              <TabsContent value="summary" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>AI-Generated Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-lg leading-relaxed">{data.summary}</p>
                    
                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-2">Key Points:</h4>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <span className="text-muted-foreground">BI-RADS:</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${data.birads.value !== null ? biradsColors[data.birads.value] : 'bg-muted'}`}>
                            {data.birads.value !== null ? `${data.birads.value} - ${biradsLabels[data.birads.value]}` : 'Not found'}
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-muted-foreground">Density:</span>
                          <span className="font-medium">{data.breast_density.value || 'Not specified'}</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-muted-foreground">Findings:</span>
                          <span className="font-medium">{data.findings.length} identified</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-muted-foreground">Recommendations:</span>
                          <span className="font-medium">{data.recommendations.length} suggested</span>
                        </li>
                        {data.red_flags.length > 0 && (
                          <li className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="font-medium">{data.red_flags.length} red flag(s) identified</span>
                          </li>
                        )}
                      </ul>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(data.summary)}>
                        <Copy className="h-4 w-4 mr-2" />Copy Summary
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Raw Text / Evidence View */}
              <TabsContent value="evidence" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Extracted Text Evidence</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      All quotes and evidence extracted from the original document
                    </p>
                  </CardHeader>
                  <CardContent>
                    {allEvidence.length === 0 ? (
                      <p className="text-muted-foreground">No text evidence was captured during extraction.</p>
                    ) : (
                      <div className="space-y-3">
                        {allEvidence.map((evidence, i) => (
                          <div key={i} className="p-3 bg-muted/50 rounded-lg border-l-4 border-primary/30">
                            <p className="text-sm italic">"{evidence}"</p>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {allEvidence.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => copyToClipboard(allEvidence.join('\n\n'))}
                        >
                          <Copy className="h-4 w-4 mr-2" />Copy All Evidence
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* JSON View */}
              <TabsContent value="json" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Complete Extraction (JSON)</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Full structured data extracted from the document - 100% derived from document content
                    </p>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm font-mono max-h-[600px] whitespace-pre-wrap">
                      {JSON.stringify(data, null, 2)}
                    </pre>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(JSON.stringify(data, null, 2))}>
                        <Copy className="h-4 w-4 mr-2" />Copy JSON
                      </Button>
                      <Button variant="outline" size="sm" onClick={downloadJSON}>
                        <Download className="h-4 w-4 mr-2" />Download JSON
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
