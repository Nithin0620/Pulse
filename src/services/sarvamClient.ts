import { SarvamAIClient } from 'sarvamai';
import { getSarvamApiKey } from './sarvamConfig';
import { SarvamConfigurationError } from './sarvamErrors';

export const createSarvamClient = () => {
  const apiKey = getSarvamApiKey();

  if (!apiKey) {
    throw new SarvamConfigurationError(
      'Set VITE_SARVAM_API_KEY in your environment or provide a runtime override.'
    );
  }

  return new SarvamAIClient({
    apiSubscriptionKey: apiKey,
  });
};
