import { ENV } from '../config/env';

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export interface ExtractedPrescription {
  doctor: string;
  hospital: string;
  date: string;
  medicines: {
    name: string;
    dosage: string;
    frequency: string;
    timing: ('morning' | 'afternoon' | 'evening' | 'night')[];
    instructions: string;
  }[];
  rawText: string;
}

export class GeminiVisionService {
  public static async analyzePrescription(imageBase64: string, mimeType = 'image/jpeg'): Promise<ExtractedPrescription> {
    if (!ENV.GEMINI_API_KEY) {
      throw new Error('Gemini API key is not configured');
    }

    const prompt = `You are a clinical OCR and prescription extraction expert for Indian medical prescriptions.
Analyze this prescription image carefully.
Transcribe all text and extract the structured medical details.

Return ONLY valid JSON in this exact structure:
{
  "doctor": "Doctor name or Dr. Unknown",
  "hospital": "Hospital / Clinic name or Not specified",
  "date": "YYYY-MM-DD or today's date",
  "medicines": [
    {
      "name": "Medicine name (e.g. Metformin)",
      "dosage": "e.g. 500mg or 1 tab",
      "frequency": "Daily / Twice daily",
      "timing": ["morning", "night"],
      "instructions": "After food"
    }
  ],
  "rawText": "Full transcript of the prescription"
}
Do not enclose in markdown blocks. Output strict raw JSON only.`;

    const res = await fetch(`${GEMINI_ENDPOINT}?key=${ENV.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType,
                  data: imageBase64,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.warn('Gemini OCR error', err);
      throw new Error(`Gemini OCR failed: ${res.status}`);
    }

    const data = await res.json();
    const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    try {
      const clean = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(clean);
    } catch {
      return {
        doctor: 'Doctor',
        hospital: 'Clinic',
        date: new Date().toISOString().split('T')[0],
        medicines: [],
        rawText: textOutput,
      };
    }
  }
}
