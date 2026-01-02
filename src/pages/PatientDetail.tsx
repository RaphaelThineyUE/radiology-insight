import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { usePatients } from '@/hooks/usePatients';
import { useDocuments } from '@/hooks/useDocuments';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, FileText, Upload, Loader2, Sparkles, User, Phone, Mail, MapPin, Calendar, Hash } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import type { Patient, Document, Extraction, RadiologyExtraction } from '@/types/radiology';

export default function PatientDetail() {
  const { patientId } = useParams<{ patientId: string }>();
  const { getPatient } = usePatients();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [documents, setDocuments] = useState<(Document & { extraction?: Extraction })[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [consolidatedReport, setConsolidatedReport] = useState<string | null>(null);

  useEffect(() => {
    if (patientId) loadData();
  }, [patientId]);

  const loadData = async () => {
    if (!patientId) return;
    setLoading(true);
    
    const { patient: fetchedPatient } = await getPatient(patientId);
    setPatient(fetchedPatient);
    
    // Fetch documents for this patient
    const { data: docs } = await supabase
      .from('documents')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    
    if (docs && docs.length > 0) {
      type DocRow = typeof docs[number];
      // Fetch extractions for these documents
      const docIds = docs.map((d: DocRow) => d.id);
      const { data: extractions } = await supabase
        .from('extractions')
        .select('*')
        .in('document_id', docIds);
      
      const docsWithExtractions = docs.map((doc: DocRow) => ({
        ...doc,
        extraction: extractions?.find(e => e.document_id === doc.id) as unknown as Extraction | undefined
      }));
      setDocuments(docsWithExtractions as unknown as (Document & { extraction?: Extraction })[]);
    } else {
      setDocuments([]);
    }
    
    setLoading(false);
  };

  const generateConsolidatedReport = async () => {
    const completedDocs = documents.filter(d => d.status === 'completed' && d.extraction);
    if (completedDocs.length === 0) {
      toast({ title: 'No data', description: 'No completed extractions to consolidate', variant: 'destructive' });
      return;
    }

    setGeneratingReport(true);
    try {
      const extractionData = completedDocs.map(doc => ({
        filename: doc.filename,
        date: doc.created_at,
        extraction: doc.extraction?.extraction_data as RadiologyExtraction
      }));

      const response = await supabase.functions.invoke('consolidate-report', {
        body: { 
          patientName: `${patient?.first_name} ${patient?.last_name}`,
          extractions: extractionData 
        }
      });

      if (response.error) throw response.error;
      setConsolidatedReport(response.data.report);
      toast({ title: 'Report generated', description: 'AI consolidated report is ready' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to generate report', variant: 'destructive' });
    } finally {
      setGeneratingReport(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </AppLayout>
    );
  }

  if (!patient) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Patient not found</p>
          <Button asChild className="mt-4"><Link to="/patients">Back to Patients</Link></Button>
        </div>
      </AppLayout>
    );
  }

  const completedCount = documents.filter(d => d.status === 'completed').length;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/patients"><ArrowLeft className="h-4 w-4 mr-2" />Back</Link>
          </Button>
        </div>

        {/* Patient Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{patient.first_name} {patient.last_name}</CardTitle>
                {patient.medical_record_number && (
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <Hash className="h-3 w-3" />MRN: {patient.medical_record_number}
                  </CardDescription>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {patient.date_of_birth && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{new Date(patient.date_of_birth).toLocaleDateString()}</span>
                </div>
              )}
              {patient.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{patient.phone}</span>
                </div>
              )}
              {patient.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{patient.email}</span>
                </div>
              )}
              {patient.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{patient.address}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 flex-wrap">
          <Button asChild>
            <Link to={`/upload?patientId=${patient.id}`}>
              <Upload className="h-4 w-4 mr-2" />Upload Document
            </Link>
          </Button>
          {completedCount > 0 && (
            <Button 
              variant="outline" 
              onClick={generateConsolidatedReport}
              disabled={generatingReport}
            >
              {generatingReport ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {generatingReport ? 'Generating...' : 'Consolidated Report'}
            </Button>
          )}
        </div>

        {/* Consolidated Report */}
        {consolidatedReport && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Consolidated Report
              </CardTitle>
              <CardDescription>
                Summary of {completedCount} document(s) with AI-suggested recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                {consolidatedReport}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Documents List */}
        <Card>
          <CardHeader>
            <CardTitle>Documents ({documents.length})</CardTitle>
            <CardDescription>All uploaded radiology reports for this patient</CardDescription>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No documents uploaded yet</p>
                <Button asChild className="mt-4">
                  <Link to={`/upload?patientId=${patient.id}`}>
                    <Upload className="h-4 w-4 mr-2" />Upload First Document
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{doc.filename}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        doc.status === 'completed' ? 'bg-success/10 text-success' : 
                        doc.status === 'failed' ? 'bg-destructive/10 text-destructive' : 
                        'bg-muted text-muted-foreground'
                      }`}>
                        {doc.status}
                      </span>
                      {doc.status === 'completed' && (
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/results/${doc.id}`}>View</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
