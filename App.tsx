
import React, { useState, useCallback } from 'react';
import { transcribeAudio } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';
import FileUploader from './components/FileUploader';
import TranscriptionDisplay from './components/TranscriptionDisplay';
import ProgressBar from './components/ProgressBar';
import MicrophoneInput from './components/MicrophoneInput';
import { FileAudioIcon } from './components/icons/FileAudioIcon';
import { MicrophoneIcon } from './components/icons/MicrophoneIcon';
import { UploadIcon } from './components/icons/UploadIcon';


type Status = 'idle' | 'processing' | 'success' | 'error';
type InputType = 'file' | 'microphone';


const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isTranscriptionComplete, setIsTranscriptionComplete] = useState(false);
  const [inputType, setInputType] = useState<InputType>('file');

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
      setError('Bitte wähle zuerst eine Datei aus oder erstelle eine Aufnahme.');
      setStatus('error');
      return;
    }

    setStatus('processing');
    setIsTranscriptionComplete(false);
    setError(null);

    try {
      const { base64Data, mimeType } = await fileToBase64(file);
      
      const prompt = "Transkribiere den folgenden gesprochenen Text. Gib nur die Transkription aus, ohne zusätzliche Kommentare oder Formatierungen.";

      const result = await transcribeAudio(prompt, base64Data, mimeType);
      setTranscription(result);
      setIsTranscriptionComplete(true);

      // Allow time for the progress bar to animate to 100%
      setTimeout(() => {
        setStatus('success');
      }, 1000);

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
    setIsTranscriptionComplete(false);
  }
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  const renderContent = () => {
    if (status === 'processing') {
      return <ProgressBar isComplete={isTranscriptionComplete} />;
    }

    if (status === 'success') {
      return <TranscriptionDisplay transcription={transcription} fileName={file?.name || 'transkription'} onReset={resetState} />;
    }

    // Idle or Error status
    if (file) {
      return (
        <div className="w-full text-center p-6 border-2 border-dashed border-gray-600 rounded-lg bg-gray-700/50">
           <FileAudioIcon className="w-16 h-16 mx-auto text-indigo-400 mb-4" />
           <p className="text-lg font-semibold text-gray-200">{file.name}</p>
           <p className="text-sm text-gray-400">{formatFileSize(file.size)}</p>
           {file.type.startsWith('video/') && (
             <div className="mt-4 text-sm bg-yellow-900/50 border border-yellow-700 text-yellow-300 px-4 py-2 rounded-lg">
               <strong>Hinweis:</strong> Aus Videodateien wird nur die Audiospur für die Transkription verwendet.
             </div>
           )}
        </div>
      );
    }

    // No file selected, show input options
    return (
      <>
        <div className="flex w-full mb-4 border-b border-gray-600">
            <button 
                onClick={() => setInputType('file')}
                className={`flex-1 py-3 text-center font-semibold transition-colors duration-300 flex items-center justify-center gap-2 ${inputType === 'file' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}
            >
                <UploadIcon className="w-5 h-5" />
                Datei-Upload
            </button>
            <button 
                onClick={() => setInputType('microphone')}
                className={`flex-1 py-3 text-center font-semibold transition-colors duration-300 flex items-center justify-center gap-2 ${inputType === 'microphone' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}
            >
                <MicrophoneIcon className="w-5 h-5" />
                Mikrofon
            </button>
        </div>
        {inputType === 'file' ? (
          <FileUploader onFileChange={handleFileChange} />
        ) : (
          <MicrophoneInput onFileChange={handleFileChange} />
        )}
      </>
    );
  };


  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-2xl mx-auto bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        <header className="p-6 bg-gray-700/50 border-b border-gray-600">
          <h1 className="text-2xl sm:text-3xl font-bold text-center text-white">
            Audio-zu-Text Extraktor
          </h1>
          <p className="text-center text-gray-400 mt-2">
            Wandle gesprochene Sprache aus Audiodateien oder dem Mikrofon in Text um.
          </p>
        </header>

        <main className="p-6 sm:p-8">
          {renderContent()}

          {status === 'error' && error && (
            <div className="mt-4 text-center bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg" role="alert">
              <strong className="font-bold">Fehler: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {/* FIX: Use !includes to prevent TS from narrowing status type, which caused a type error on the disabled prop check. */}
          {file && !['processing', 'success'].includes(status) && (
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