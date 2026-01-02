import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RadiologyExtraction {
  summary: string;
  birads: { value: number | null; confidence: string; evidence: string[] };
  breast_density: { value: string | null; evidence: string[] };
  exam: { type: string | null; laterality: string | null; evidence: string[] };
  comparison: { prior_exam_date: string | null; evidence: string[] };
  findings: Array<{
    laterality: string;
    location: string | null;
    description: string;
    assessment: string;
    evidence: string[];
  }>;
  recommendations: Array<{
    action: string;
    timeframe: string | null;
    evidence: string[];
  }>;
  red_flags: string[];
}

interface ExtractionInput {
  filename: string;
  date: string;
  extraction: RadiologyExtraction;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { patientName, extractions } = await req.json() as { 
      patientName: string; 
      extractions: ExtractionInput[] 
    };

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build a comprehensive summary of all extractions
    const extractionSummaries = extractions.map((e, i) => {
      const data = e.extraction;
      const findingsText = data.findings.map(f => 
        `- ${f.laterality} ${f.location || 'unspecified location'}: ${f.description} (${f.assessment})`
      ).join('\n');
      
      const recsText = data.recommendations.map(r => 
        `- ${r.action}${r.timeframe ? ` (${r.timeframe})` : ''}`
      ).join('\n');

      return `
=== Report ${i + 1}: ${e.filename} (${new Date(e.date).toLocaleDateString()}) ===
Summary: ${data.summary}
BI-RADS: ${data.birads.value !== null ? data.birads.value : 'Not specified'} (Confidence: ${data.birads.confidence})
Breast Density: ${data.breast_density.value || 'Not specified'}
Exam Type: ${data.exam.type || 'Unknown'}, Laterality: ${data.exam.laterality || 'Not specified'}
${data.comparison.prior_exam_date ? `Prior Exam: ${data.comparison.prior_exam_date}` : ''}

Findings:
${findingsText || 'No findings documented'}

Recommendations:
${recsText || 'No recommendations documented'}

${data.red_flags.length > 0 ? `RED FLAGS: ${data.red_flags.join('; ')}` : ''}
`;
    }).join('\n\n');

    const systemPrompt = `You are a medical AI assistant specializing in radiology report analysis. Your task is to create a consolidated report that:

1. ONLY uses information from the provided extraction data - do not add any information that is not present
2. Synthesizes findings across multiple reports to identify patterns or changes over time
3. Provides AI-suggested recommendations based ONLY on the data provided
4. Highlights any concerning trends or urgent findings
5. Uses clear, professional medical language

CRITICAL: All content in your report must be directly traceable to the extraction data provided. Do not fabricate or assume any medical information.`;

    const userPrompt = `Patient: ${patientName}

Please create a consolidated report for the following ${extractions.length} radiology report extraction(s):

${extractionSummaries}

Create a structured consolidated report with the following sections:
1. **Patient Overview**: Brief summary of all reports analyzed
2. **BI-RADS History**: Track BI-RADS scores across reports (if multiple)
3. **Key Findings Summary**: Consolidated view of all significant findings
4. **Trend Analysis**: Any changes or patterns observed across reports (if applicable)
5. **Consolidated Recommendations**: Based ONLY on the recommendations from the reports
6. **AI-Suggested Follow-up**: Additional suggestions based on the data patterns (clearly marked as AI suggestions)
7. **Urgent Attention Items**: Any red flags or concerning findings that need immediate attention

Remember: Only include information that is present in the extraction data provided.`;

    console.log('Calling Lovable AI for consolidated report...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Usage limit reached. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const report = aiResponse.choices?.[0]?.message?.content;

    if (!report) {
      throw new Error('No report generated from AI');
    }

    console.log('Consolidated report generated successfully');

    return new Response(JSON.stringify({ report }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error generating consolidated report:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
