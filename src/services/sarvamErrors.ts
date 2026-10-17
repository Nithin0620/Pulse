export class SarvamConfigurationError extends Error {
  constructor(message = 'Sarvam API key is missing.') {
    super(message);
    this.name = 'SarvamConfigurationError';
  }
}

export class SarvamUnsupportedDocumentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SarvamUnsupportedDocumentError';
  }
}

export class SarvamDocumentProcessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SarvamDocumentProcessingError';
  }
}
