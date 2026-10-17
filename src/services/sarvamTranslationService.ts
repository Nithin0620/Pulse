import type { SarvamAI } from 'sarvamai';
import { createSarvamClient } from './sarvamClient';

export class SarvamTranslationService {
  static async translate(request: SarvamAI.TranslationRequest) {
    const client = createSarvamClient();
    return client.text.translate(request);
  }

  static async identifyLanguage(request: SarvamAI.LanguageIdentificationRequest) {
    const client = createSarvamClient();
    return client.text.identifyLanguage(request);
  }

  static async transliterate(request: SarvamAI.TransliterationRequest) {
    const client = createSarvamClient();
    return client.text.transliterate(request);
  }
}
