import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDocuments } from '@/hooks/useDocuments';
import { usePatients } from '@/hooks/usePatients';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload as UploadIcon, FileText, Loader2, AlertTriangle, User, Plus } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export default function Upload() {
  const [searchParams] = useSearchParams();
  const preselectedPatientId = searchParams.get('patientId');
  
  const [file, setFile] = useState<File | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(preselectedPatientId || '');
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickPatient, setQuickPatient] = useState({ first_name: '', last_name: '' });
  
  const { uploadDocument } = useDocuments();
  const { patients, loading: patientsLoading, createPatient } = usePatients();
  const { hasApiKey, getApiKey } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (preselectedPatientId) {
      setSelectedPatientId(preselectedPatientId);
    }
  }, [preselectedPatientId]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type === 'application/pdf' || droppedFile.type.includes('word'))) {
      setFile(droppedFile);
    } else {
      toast({ title: 'Invalid file', description: 'Please upload a PDF or Word document', variant: 'destructive' });
    }
  }, [toast]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
    });
  };

  const handleQuickAdd = async () => {
    if (!quickPatient.first_name.trim() || !quickPatient.last_name.trim()) {
      toast({ title: 'Error', description: 'First and last name are required', variant: 'destructive' });
      return;
    }
    const { patient, error } = await createPatient({
      first_name: quickPatient.first_name.trim(),
      last_name: quickPatient.last_name.trim(),
      date_of_birth: null,
      medical_record_number: null,
      phone: null,
      email: null,
      address: null
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else if (patient) {
      setSelectedPatientId(patient.id);
      setQuickAddOpen(false);
      setQuickPatient({ first_name: '', last_name: '' });
      toast({ title: 'Patient created' });
    }
  };

  const handleUpload = async () => {
    if (!file || !hasApiKey || !selectedPatientId) return;
    setUploading(true);
    try {
      const { documentId, error } = await uploadDocument(file, selectedPatientId);
      if (error) throw error;
      setUploading(false);
      setProcessing(true);
      
      const fileBase64 = await fileToBase64(file);
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
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Extraction failed');
      toast({ title: 'Success', description: 'Document extracted successfully!' });
      navigate(`/results/${documentId}`);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div><h1 className="text-3xl font-bold">Upload Document</h1><p className="text-muted-foreground mt-1">Upload a radiology report for AI-powered extraction</p></div>
        
        {!hasApiKey && (
          <Card className="border-warning bg-warning/5"><CardContent className="flex items-center gap-4 py-4"><AlertTriangle className="w-5 h-5 text-warning" /><p>Please configure your OpenAI API key in settings first.</p></CardContent></Card>
        )}

        {/* Patient Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Patient</CardTitle>
            <CardDescription>Choose which patient this document belongs to</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                  <SelectTrigger>
                    <SelectValue placeholder={patientsLoading ? "Loading patients..." : "Select a patient"} />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {p.first_name} {p.last_name}
                          {p.medical_record_number && <span className="text-muted-foreground text-xs">({p.medical_record_number})</span>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" onClick={() => setQuickAddOpen(true)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {!selectedPatientId && patients.length === 0 && !patientsLoading && (
              <p className="text-sm text-muted-foreground">No patients yet. Create one to get started.</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Add Patient Dialog */}
        <Dialog open={quickAddOpen} onOpenChange={setQuickAddOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Quick Add Patient</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="q_first">First Name</Label>
                <Input id="q_first" value={quickPatient.first_name} onChange={(e) => setQuickPatient(p => ({ ...p, first_name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="q_last">Last Name</Label>
                <Input id="q_last" value={quickPatient.last_name} onChange={(e) => setQuickPatient(p => ({ ...p, last_name: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setQuickAddOpen(false)}>Cancel</Button>
              <Button onClick={handleQuickAdd}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* File Upload */}
        <Card>
          <CardHeader><CardTitle>Select Document</CardTitle><CardDescription>PDF or Word documents are supported</CardDescription></CardHeader>
          <CardContent>
            <div className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${dragOver ? 'border-primary bg-primary/5' : 'border-muted'} relative`} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}>
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
                </div>
              )}
            </div>
            <Button className="w-full mt-6" size="lg" disabled={!file || !hasApiKey || !selectedPatientId || uploading || processing} onClick={handleUpload}>
              {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading...</> : processing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing with AI...</> : 'Extract Document'}
            </Button>
            {!selectedPatientId && file && (
              <p className="text-sm text-destructive text-center mt-2">Please select a patient first</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
