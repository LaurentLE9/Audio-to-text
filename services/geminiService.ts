
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const transcribeAudio = async (prompt: string, base64Data: string, mimeType: string): Promise<string> => {
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
        model: 'gemini-2.5-flash',
        contents: { parts: [audioPart, textPart] },
    });

    if (response.text) {
        return response.text;
    } else {
        throw new Error("Keine Transkription vom Modell erhalten.");
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Fehler bei der Kommunikation mit der Gemini API.");
  }
};
