
import { GoogleGenAI, Part } from "@google/genai";
import { fileToBase64 } from "../utils/fileUtils";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Threshold for using the File API (e.g., 15 MB)
const LARGE_FILE_THRESHOLD_BYTES = 15 * 1024 * 1024;

export interface ProgressState {
    status: string;
    percentage: number;
}

// Helper to poll for active file state
const pollFileState = async (fileName: string): Promise<void> => {
    let fileState = await ai.files.get({ name: fileName });
    while (fileState.file.state === 'PROCESSING') {
        // Wait for 2 seconds before polling again
        await new Promise(resolve => setTimeout(resolve, 2000));
        fileState = await ai.files.get({ name: fileName });
    }

    if (fileState.file.state !== 'ACTIVE') {
        throw new Error(`Datei konnte nicht verarbeitet werden. Status: ${fileState.file.state}`);
    }
}

export const transcribeMedia = async (
    file: File, 
    prompt: string, 
    model: 'gemini-2.5-flash' | 'gemini-2.5-pro',
    onProgress: (state: ProgressState) => void
): Promise<string> => {
  try {
    let mediaPart: Part;

    if (file.size > LARGE_FILE_THRESHOLD_BYTES) {
        // --- Large File Workflow using File API ---
        onProgress({ status: 'Datei wird hochgeladen...', percentage: 0 });

        const uploadResult = await ai.files.upload({
            file,
            onUploadProgress: (ev) => {
                if(ev.progress) {
                    onProgress({ status: 'Datei wird hochgeladen...', percentage: ev.progress * 100 });
                }
            },
        });
        
        onProgress({ status: 'Datei wird verarbeitet...', percentage: 100 });
        await pollFileState(uploadResult.file.name);

        mediaPart = {
            fileData: {
                mimeType: uploadResult.file.mimeType,
                fileName: uploadResult.file.name,
            },
        };

    } else {
        // --- Small File Workflow (existing method) ---
        onProgress({ status: 'Datei wird vorbereitet...', percentage: 0 });
        const { base64Data, mimeType } = await fileToBase64(file);
        mediaPart = {
          inlineData: {
            mimeType: mimeType,
            data: base64Data,
          },
        };
    }
    
    onProgress({ status: 'Transkription wird erstellt...', percentage: 100 });

    const textPart = {
      text: prompt,
    };

    const response = await ai.models.generateContent({
        model: model,
        contents: { parts: [mediaPart, textPart] },
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
