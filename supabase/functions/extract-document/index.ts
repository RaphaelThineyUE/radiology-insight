import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RadiologyExtraction {
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
  findings: Array<{
    laterality: 'left' | 'right' | 'bilateral' | 'unknown';
    location: string | null;
    description: string;
    assessment: 'benign' | 'probably_benign' | 'suspicious' | 'highly_suggestive_malignancy' | 'incomplete' | 'unknown';
    evidence: string[];
  }>;
  recommendations: Array<{
    action: string;
    timeframe: string | null;
    evidence: string[];
  }>;
  red_flags: string[];
}

const EXTRACTION_PROMPT = `You are a specialized medical AI assistant trained to extract structured data from breast radiology reports. Your task is to parse the provided radiology report and extract information into a specific JSON structure.

IMPORTANT: You must respond ONLY with a valid JSON object matching the exact structure below. Do not include any other text, markdown, or explanation.

Extract the following information:

1. **summary**: A concise 2-3 sentence summary of the key findings in plain language suitable for a surgeon.

2. **birads**: 
   - value: The BI-RADS category (0-6) or null if not found
   - confidence: Your confidence level in this extraction ('low', 'medium', 'high')
   - evidence: Array of exact quotes from the document supporting this

3. **breast_density**:
   - value: ACR density category ('A', 'B', 'C', 'D') or null
   - evidence: Array of exact quotes

4. **exam**:
   - type: Type of examination (e.g., "Mammogram", "Ultrasound", "MRI")
   - laterality: 'left', 'right', 'bilateral', or null
   - evidence: Array of exact quotes

5. **comparison**:
   - prior_exam_date: Date of comparison study if mentioned (format: YYYY-MM-DD if possible)
   - evidence: Array of exact quotes

6. **findings**: Array of findings, each with:
   - laterality: 'left', 'right', 'bilateral', or 'unknown'
   - location: Anatomical location (e.g., "upper outer quadrant", "2 o'clock")
   - description: Brief description of the finding
   - assessment: 'benign', 'probably_benign', 'suspicious', 'highly_suggestive_malignancy', 'incomplete', or 'unknown'
   - evidence: Array of exact quotes

7. **recommendations**: Array of recommendations, each with:
   - action: The recommended action
   - timeframe: When it should occur (e.g., "6 months", "immediately")
   - evidence: Array of exact quotes

8. **red_flags**: Array of any urgent findings requiring immediate attention

Respond with this exact JSON structure:
{
  "summary": "string",
  "birads": { "value": number|null, "confidence": "low"|"medium"|"high", "evidence": ["string"] },
  "breast_density": { "value": "A"|"B"|"C"|"D"|null, "evidence": ["string"] },
  "exam": { "type": "string"|null, "laterality": "left"|"right"|"bilateral"|null, "evidence": ["string"] },
  "comparison": { "prior_exam_date": "string"|null, "evidence": ["string"] },
  "findings": [{ "laterality": "string", "location": "string"|null, "description": "string", "assessment": "string", "evidence": ["string"] }],
  "recommendations": [{ "action": "string", "timeframe": "string"|null, "evidence": ["string"] }],
  "red_flags": ["string"]
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    const { documentId, fileBase64, fileName, fileType, openaiApiKey } = await req.json();

    if (!documentId || !fileBase64) {
      throw new Error('Missing required fields: documentId and fileBase64');
    }

    if (!openaiApiKey) {
      throw new Error('OpenAI API key is required');
    }

    // Decode base64 to get file content
    const fileBytes = Uint8Array.from(atob(fileBase64), c => c.charCodeAt(0));
    
    // For now, we'll send the file content as text to OpenAI
    // In a production app, you'd use a proper PDF parser
    // OpenAI's GPT-4o can handle base64 encoded documents directly
    const documentText = new TextDecoder().decode(fileBytes);

    // Log usage
    await supabase.from('usage_logs').insert({
      user_id: user.id,
      action: 'extraction_started',
      document_id: documentId,
      metadata: { file_name: fileName, file_type: fileType }
    });

    // Update document status
    await supabase
      .from('documents')
      .update({ status: 'processing' })
      .eq('id', documentId);

    // Call OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: EXTRACTION_PROMPT },
          { role: 'user', content: `Please extract the structured data from this radiology report:\n\n${documentText}` }
        ],
        temperature: 0.1,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      
      // Log error
      await supabase.from('error_logs').insert({
        user_id: user.id,
        document_id: documentId,
        error_type: 'openai_api_error',
        error_message: `OpenAI API returned ${response.status}`,
        metadata: { response: errorText }
      });

      await supabase
        .from('documents')
        .update({ status: 'failed' })
        .eq('id', documentId);

      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    // Parse the JSON response
    let extraction: RadiologyExtraction;
    try {
      // Clean up the response in case it has markdown code blocks
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7);
      }
      if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3);
      }
      extraction = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);
      
      await supabase.from('error_logs').insert({
        user_id: user.id,
        document_id: documentId,
        error_type: 'parse_error',
        error_message: 'Failed to parse OpenAI response as JSON',
        metadata: { raw_response: content }
      });

      await supabase
        .from('documents')
        .update({ status: 'failed' })
        .eq('id', documentId);

      throw new Error('Failed to parse extraction result');
    }

    const processingTime = Date.now() - startTime;

    // Save extraction
    const { error: insertError } = await supabase
      .from('extractions')
      .insert({
        document_id: documentId,
        user_id: user.id,
        extraction_data: extraction,
        summary: extraction.summary,
        birads_score: extraction.birads.value,
        processing_time_ms: processingTime
      });

    if (insertError) {
      console.error('Failed to save extraction:', insertError);
      throw new Error('Failed to save extraction result');
    }

    // Update document status
    await supabase
      .from('documents')
      .update({ status: 'completed' })
      .eq('id', documentId);

    // Log success
    await supabase.from('usage_logs').insert({
      user_id: user.id,
      action: 'extraction_completed',
      document_id: documentId,
      metadata: { 
        processing_time_ms: processingTime,
        birads_score: extraction.birads.value,
        findings_count: extraction.findings.length
      }
    });

    return new Response(JSON.stringify({ 
      success: true, 
      extraction,
      processingTime 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in extract-document function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
