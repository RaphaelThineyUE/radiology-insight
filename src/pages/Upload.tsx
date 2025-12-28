import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocuments } from '@/hooks/useDocuments';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload as UploadIcon, FileText, Loader2, AlertTriangle } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { createLogger } from '@/lib/logger';

// Use the worker from the pdfjs-dist package
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export default function Upload() {
  const log = createLogger('UploadPage');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const { uploadDocument } = useDocuments();
  const { hasApiKey, getApiKey } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    log.info('File dropped', { name: droppedFile?.name, type: droppedFile?.type, size: droppedFile?.size });
    if (droppedFile && (droppedFile.type === 'application/pdf' || droppedFile.type.includes('word'))) {
      setFile(droppedFile);
    } else {
      toast({ title: 'Invalid file', description: 'Please upload a PDF or Word document', variant: 'destructive' });
      log.warn('Invalid file type', { type: droppedFile?.type });
    }
  }, [toast]);

  const extractTextFromPDF = async (file: File): Promise<string> => {
    log.info('Extracting text from PDF', { name: file.name });
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item: any) => item.str).join(' ') + '\n';
    }
    log.info('PDF text extracted', { length: text.length });
    return text;
  };

  const handleUpload = async () => {
    if (!file || !hasApiKey) return;
    setUploading(true);
    try {
      log.info('Starting upload');
      const { documentId, error } = await uploadDocument(file);
      if (error) throw error;
      setUploading(false);
      setProcessing(true);
      log.info('Upload inserted document row', { documentId });
      const text = await extractTextFromPDF(file);
      log.info('Calling extract-document function');
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ 
          documentId, 
          fileBase64, 
          fileName: file.name,
          fileType: file.type,
          openaiApiKey: getApiKey() 
        }),
      });
      log.info('Extract-document response', { status: response.status });
      const result = await response.json();
      if (!response.ok) { log.error('Extraction failed', result); throw new Error(result.error || 'Extraction failed'); }
      log.info('Extraction success', { processingTime: result.processingTime });
      toast({ title: 'Success', description: 'Document extracted successfully!' });
      navigate(`/results/${documentId}`);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      log.error('Upload flow error', error);
    } finally {
      setUploading(false);
      setProcessing(false);
      log.info('Upload flow finished');
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div><h1 className="text-3xl font-bold">Upload Document</h1><p className="text-muted-foreground mt-1">Upload a radiology report for AI-powered extraction</p></div>
        {!hasApiKey && (
          <Card className="border-warning bg-warning/5"><CardContent className="flex items-center gap-4 py-4"><AlertTriangle className="w-5 h-5 text-warning" /><p>Please configure your OpenAI API key in settings first.</p></CardContent></Card>
        )}
        <Card>
          <CardHeader><CardTitle>Select Document</CardTitle><CardDescription>PDF or Word documents are supported</CardDescription></CardHeader>
          <CardContent>
            <div className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${dragOver ? 'border-primary bg-primary/5' : 'border-muted'}`} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}>
              {file ? (
                <div className="space-y-4">
                  <FileText className="h-12 w-12 mx-auto text-primary" />
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                  <Button variant="outline" onClick={() => setFile(null)}>Remove</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <UploadIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div><p className="font-medium">Drop your file here</p><p className="text-sm text-muted-foreground">or click to browse</p></div>
                  <input type="file" accept=".pdf,.doc,.docx" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])} />
                  {/* Log file selection via click */}
                  {file && log.debug('File selected via browser', { name: file.name })}
                </div>
              )}
            </div>
            <Button className="w-full mt-6" size="lg" disabled={!file || !hasApiKey || uploading || processing} onClick={handleUpload}>
              {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading...</> : processing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing with AI...</> : 'Extract Document'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
