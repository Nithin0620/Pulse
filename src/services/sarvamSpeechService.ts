import type { SarvamAI } from 'sarvamai';
import { createSarvamClient } from './sarvamClient';

export class SarvamSpeechService {
  static async transcribe(request: SarvamAI.SpeechToTextTranscriptionRequest) {
    const client = createSarvamClient();
    return client.speechToText.transcribe(request);
  }

  static async translate(request: SarvamAI.SpeechToTextTranslationRequest) {
    const client = createSarvamClient();
    return client.speechToText.translate(request);
  }

  static async textToSpeech(request: SarvamAI.TextToSpeechRequest) {
    const client = createSarvamClient();
    return client.textToSpeech.convert(request);
  }
}
