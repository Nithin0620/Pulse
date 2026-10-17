export const VERIFIED_SARVAM_METHODS = {
  speechToText: ['transcribe', 'translate'],
  textToSpeech: ['convert', 'convertStream'],
  translation: ['translate', 'identifyLanguage', 'transliterate'],
  chat: ['completions'],
  documentDigitization: [
    'initialise',
    'createJob',
    'getUploadLinks',
    'start',
    'getStatus',
    'getDownloadLinks',
  ],
} as const;
