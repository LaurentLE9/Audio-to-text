
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const transcribeAudio = async (prompt: string, base64Data: string, mimeType: string, model: 'gemini-2.5-flash' | 'gemini-2.5-pro'): Promise<string> => {
  try {
    const audioPart = {
      inlineData: {
        mimeType: mimeType,
        data: base64Data,
      },
    };

    const textPart = {
      text: prompt,
    };

    const response = await ai.models.generateContent({
        model: model,
        contents: { parts: [audioPart, textPart] },
    });

    if (response.text) {
        return response.text;
    } else {
        throw new Error("Keine Transkription vom Modell erhalten.");
    }
  } catch (error) {
    console.error("Error calling Gemini API for transcription:", error);
    throw new Error("Fehler bei der Kommunikation mit der Gemini API.");
  }
};


export const postProcessTranscription = async (transcription: string): Promise<string> => {
  try {
      const prompt = `Du bist ein erfahrener Korrekturleser. Überprüfe die folgende Transkription auf Rechtschreib-, Grammatik- und Zeichensetzungsfehler. Korrigiere alle Fehler und formatiere den Text für bessere Lesbarkeit, indem du Absätze hinzufügst, wo es sinnvoll ist. Gib nur den korrigierten und verbesserten Text aus, ohne zusätzliche Kommentare oder einleitende Sätze.

Originaltext:
"${transcription}"`;

      const response = await ai.models.generateContent({
          model: 'gemini-2.5-pro', // Always use pro for best quality post-processing
          contents: prompt,
      });

      if (response.text) {
          return response.text;
      } else {
          // If post-processing fails, return original text as fallback
          console.warn("Post-processing returned no text, falling back to original transcription.");
          return transcription;
      }
  } catch (error) {
      console.error("Error during post-processing:", error);
      // Fallback to original transcription on error
      return transcription;
  }
};
