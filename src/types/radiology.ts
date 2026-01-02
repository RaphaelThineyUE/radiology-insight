export interface RadiologyExtraction {
  summary: string;
  birads: {
    value: number | null;
    confidence: 'low' | 'medium' | 'high';
    evidence: string[];
  };
  breast_density: {
    value: 'A' | 'B' | 'C' | 'D' | null;
    evidence: string[];
  };
  exam: {
    type: string | null;
    laterality: 'left' | 'right' | 'bilateral' | null;
    evidence: string[];
  };
  comparison: {
    prior_exam_date: string | null;
    evidence: string[];
  };
  findings: Finding[];
  recommendations: Recommendation[];
  red_flags: string[];
}

export interface Finding {
  laterality: 'left' | 'right' | 'bilateral' | 'unknown';
  location: string | null;
  description: string;
  assessment: 'benign' | 'probably_benign' | 'suspicious' | 'highly_suggestive_malignancy' | 'incomplete' | 'unknown';
  evidence: string[];
}

export interface Recommendation {
  action: string;
  timeframe: string | null;
  evidence: string[];
}

export interface Patient {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  medical_record_number: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  user_id: string;
  patient_id: string | null;
  filename: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface Extraction {
  id: string;
  document_id: string;
  user_id: string;
  extraction_data: RadiologyExtraction;
  summary: string | null;
  birads_score: number | null;
  processing_time_ms: number | null;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string | null;
  openai_api_key_encrypted: string | null;
  created_at: string;
  updated_at: string;
}

export interface UsageLog {
  id: string;
  user_id: string;
  action: string;
  document_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ErrorLog {
  id: string;
  user_id: string;
  document_id: string | null;
  error_type: string;
  error_message: string;
  stack_trace: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface UsageStats {
  totalDocuments: number;
  completedExtractions: number;
  failedExtractions: number;
  avgProcessingTime: number;
  recentActivity: UsageLog[];
}
