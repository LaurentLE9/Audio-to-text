
import React, { useState, useCallback } from 'react';
import { transcribeAudio } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';
import FileUploader from './components/FileUploader';
import TranscriptionDisplay from './components/TranscriptionDisplay';
import Spinner from './components/Spinner';

type Status = 'idle' | 'processing' | 'success' | 'error';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile) {
      setFile(selectedFile);
      setStatus('idle');
      setTranscription('');
      setError(null);
    }
  };
  
  const handleTranscription = useCallback(async () => {
    if (!file) {
      setError('Bitte wähle zuerst eine Datei aus.');
      setStatus('error');
      return;
    }

    setStatus('processing');
    setError(null);

    try {
      const { base64Data, mimeType } = await fileToBase64(file);
      
      const prompt = "Transkribiere den folgenden gesprochenen Text. Gib nur die Transkription aus, ohne zusätzliche Kommentare oder Formatierungen.";

      const result = await transcribeAudio(prompt, base64Data, mimeType);
      setTranscription(result);
      setStatus('success');
    } catch (err) {
      console.error(err);
      setError('Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
      setStatus('error');
    }
  }, [file]);

  const resetState = () => {
    setFile(null);
    setTranscription('');
    setStatus('idle');
    setError(null);
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-2xl mx-auto bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        <header className="p-6 bg-gray-700/50 border-b border-gray-600">
          <h1 className="text-2xl sm:text-3xl font-bold text-center text-white">
            Audio-zu-Text Extraktor
          </h1>
          <p className="text-center text-gray-400 mt-2">
            Wandle gesprochene Sprache aus Audiodateien in Text um.
          </p>
        </header>

        <main className="p-6 sm:p-8">
          {status === 'idle' || status === 'error' ? (
            <FileUploader onFileChange={handleFileChange} file={file} />
          ) : null}

          {status === 'processing' && (
            <div className="flex flex-col items-center justify-center space-y-4 my-8">
              <Spinner />
              <p className="text-lg text-gray-300 animate-pulse">Transkription wird erstellt...</p>
            </div>
          )}

          {status === 'success' && transcription && (
            <TranscriptionDisplay transcription={transcription} fileName={file?.name || 'transkription'} onReset={resetState} />
          )}

          {status === 'error' && error && (
            <div className="mt-4 text-center bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg" role="alert">
              <strong className="font-bold">Fehler: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {file && (status === 'idle' || status === 'error') && (
             <div className="mt-6 flex flex-col sm:flex-row gap-4">
               <button
                  onClick={handleTranscription}
                  disabled={status === 'processing'}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-500/50 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:transform-none"
                >
                  Transkribieren
                </button>
                <button
                  onClick={resetState}
                  className="w-full sm:w-auto bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 ease-in-out"
                >
                  Abbrechen
                </button>
            </div>
          )}
        </main>
      </div>
       <footer className="text-center mt-8 text-gray-500 text-sm">
        <p>Powered by Google Gemini</p>
      </footer>
    </div>
  );
};

export default App;
