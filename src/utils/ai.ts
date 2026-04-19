/**
 * Formats Gemini AI errors into user-friendly messages.
 */
export function formatAiError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  
  if (message.includes("reported as leaked")) {
    return "Your Gemini API key has been leaked (it was found in your public code or history). SECURITY ACTION REQUIRED: 1. Generate a NEW key at https://aistudio.google.dev/app/apikey. 2. Delete the old key. 3. Update your Netlify/Vercel environment variables.";
  }
  
  if (message.includes("quota") || message.includes("RESOURCE_EXHAUSTED")) {
    return "The AI quota for the free tier has been reached. Please wait a short while and try again, or consider a higher tier if this is a production app.";
  }

  if (message.includes("API Key is missing") || message.includes("key is missing")) {
    return "Gemini API Key is missing. Ensure VITE_GEMINI_API_KEY is set in your deployment environment variables.";
  }
  
  return message;
}
