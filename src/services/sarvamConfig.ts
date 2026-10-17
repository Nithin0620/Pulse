let runtimeSarvamApiKey: string | null = null;

export const getSarvamApiKey = (): string | null => {
  return runtimeSarvamApiKey || (import.meta.env.VITE_SARVAM_API_KEY as string | undefined) || null;
};

export const setSarvamApiKeyOverride = (apiKey: string) => {
  runtimeSarvamApiKey = apiKey.trim() || null;
};

export const clearSarvamApiKeyOverride = () => {
  runtimeSarvamApiKey = null;
};
