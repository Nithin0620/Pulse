import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { ENV } from '../config/env';
import { LanguageCode } from '../context/SettingsContext';

const SARVAM_BASE = 'https://api.sarvam.ai';

const LANG_MAP: Record<string, string> = {
  hi: 'hi-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  gu: 'gu-IN',
  mr: 'mr-IN',
  bn: 'bn-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  en: 'en-IN',
};

export class SarvamService {
  private static soundObject: Audio.Sound | null = null;

  public static async speechToText(audioUri: string, languageCode: LanguageCode = 'hi'): Promise<string> {
    try {
      const targetLang = LANG_MAP[languageCode] || 'hi-IN';
      const formData = new FormData();

      const filename = audioUri.split('/').pop() || 'recording.m4a';
      const fileType = filename.endsWith('.wav') ? 'audio/wav' : 'audio/m4a';

      // React Native FormData format
      formData.append('file', {
        uri: audioUri,
        name: filename,
        type: fileType,
      } as any);

      formData.append('model', 'saarika:v2.5');
      formData.append('language_code', targetLang);

      const res = await fetch(`${SARVAM_BASE}/speech-to-text`, {
        method: 'POST',
        headers: {
          'api-subscription-key': ENV.SARVAM_API_KEY,
        },
        body: formData,
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn('Sarvam STT failed', res.status, errText);
        throw new Error(`STT failed: ${res.status}`);
      }

      const json = await res.json();
      return json.transcript || '';
    } catch (e: any) {
      console.warn('Sarvam STT exception', e);
      throw e;
    }
  }

  public static async textToSpeech(text: string, languageCode: LanguageCode = 'hi', autoPlay = true): Promise<string> {
    try {
      const targetLang = LANG_MAP[languageCode] || 'hi-IN';

      const res = await fetch(`${SARVAM_BASE}/text-to-speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': ENV.SARVAM_API_KEY,
        },
        body: JSON.stringify({
          inputs: [text],
          target_language_code: targetLang,
          speaker: 'meera',
          model: 'bulbul:v2',
          speech_sample_rate: 22050,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.warn('Sarvam TTS error', err);
        return '';
      }

      const data = await res.json();
      const base64Audio = data.audios?.[0] || '';

      if (autoPlay && base64Audio) {
        await this.playAudioBase64(base64Audio);
      }

      return base64Audio;
    } catch (e) {
      console.warn('TTS playback error', e);
      return '';
    }
  }

  public static async playAudioBase64(base64: string): Promise<void> {
    try {
      if (this.soundObject) {
        await this.soundObject.unloadAsync();
        this.soundObject = null;
      }

      const path = `${FileSystem.cacheDirectory}sarvam_tts_${Date.now()}.wav`;
      await FileSystem.writeAsStringAsync(path, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: path },
        { shouldPlay: true }
      );
      this.soundObject = sound;
      await sound.playAsync();
    } catch (e) {
      console.warn('Audio play error', e);
    }
  }

  public static async chat(
    messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
    temperature = 0.3
  ): Promise<string> {
    try {
      const res = await fetch(`${SARVAM_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': ENV.SARVAM_API_KEY,
        },
        body: JSON.stringify({
          model: 'sarvam-105b',
          messages,
          temperature,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.warn('Sarvam chat failed', err);
        return 'Sorry, I am currently unable to connect to the medical assistant service.';
      }

      const data = await res.json();
      return data.choices?.[0]?.message?.content || '';
    } catch (e: any) {
      console.warn('Sarvam Chat exception', e);
      return 'Unable to process question at this moment.';
    }
  }

  public static async extractMedicationFromText(text: string): Promise<any> {
    const prompt = `Extract medication details from this transcript:
"${text}"

Return ONLY valid JSON matching this schema:
{
  "name": "Medication Name",
  "dosage": "e.g. 500mg or 1 tablet",
  "frequency": "Daily / Twice a day",
  "timing": ["morning", "night"],
  "instructions": "After meals"
}
If a field is missing, use reasonable clinical defaults. Do not add markdown or explanation.`;

    const raw = await this.chat([
      { role: 'system', content: 'You are a medical pharmacist data extractor. Output strictly valid JSON.' },
      { role: 'user', content: prompt },
    ], 0);

    try {
      const cleanJson = raw.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch {
      return {
        name: text.slice(0, 30),
        dosage: '1 tablet',
        frequency: 'Daily',
        timing: ['morning'],
        instructions: 'After meals',
      };
    }
  }

  public static async triageSOS(text: string): Promise<{ urgency: 'HIGH' | 'MED' | 'LOW'; summary: string }> {
    const prompt = `You are an emergency triage AI. Evaluate this distress message from an elderly patient:
"${text}"

Respond with ONLY valid JSON:
{
  "urgency": "HIGH" | "MED" | "LOW",
  "summary": "Brief 1-line emergency summary for caregivers"
}`;

    const raw = await this.chat([
      { role: 'system', content: 'You are an emergency triage assistant. Output only JSON.' },
      { role: 'user', content: prompt },
    ], 0);

    try {
      const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(clean);
      return {
        urgency: parsed.urgency || 'HIGH',
        summary: parsed.summary || 'Emergency SOS triggered with voice distress message.',
      };
    } catch {
      return {
        urgency: 'HIGH',
        summary: text ? `Distress message: "${text.slice(0, 80)}"` : 'Emergency SOS triggered',
      };
    }
  }
}
