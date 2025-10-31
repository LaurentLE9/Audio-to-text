
import React, { useState, useCallback, useEffect, useMemo } from 'react';
// FIX: Import `postProcessTranscription` to use for improving the transcription.
import { transcribeMedia, postProcessTranscription, ProgressState } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';
import FileUploader from './components/FileUploader';
import TranscriptionDisplay from './components/TranscriptionDisplay';
import ProgressBar from './components/ProgressBar';
import MicrophoneInput from './components/MicrophoneInput';
import SavedTranscriptions from './components/SavedTranscriptions';
import TranscriptionSettings from './components/TranscriptionSettings';
import GoogleDrivePicker from './components/GoogleDrivePicker';
import { FileAudioIcon } from './components/icons/FileAudioIcon';
import { MicrophoneIcon } from './components/icons/MicrophoneIcon';
import { UploadIcon } from './components/icons/UploadIcon';
import { ArchiveIcon } from './components/icons/ArchiveIcon';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { GoogleDriveIcon } from './components/icons/GoogleDriveIcon';
import { uploadFile as uploadToDrive } from './services/googleDriveService';


type Status = 'idle' | 'processing' | 'success' | 'error';
type InputType = 'file' | 'microphone' | 'drive';
type ActiveView = 'extractor' | 'saved';
type Model = 'flash' | 'pro';

export interface Transcription {
  id: number;
  text: string;
  fileName: string;
  savedAt: string;
}


const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isTranscriptionComplete, setIsTranscriptionComplete] = useState(false);
  const [inputType, setInputType] = useState<InputType>('file');
  const [googleAuthToken, setGoogleAuthToken] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('extractor');
  const [savedTranscriptions, setSavedTranscriptions] = useState<Transcription[]>([]);

  // New state for settings
  const [model, setModel] = useState<Model>('flash');
  const [postProcess, setPostProcess] = useState(true);
  const [progressInfo, setProgressInfo] = useState<ProgressState>({ status: 'Vorbereitung...', percentage: 0 });
  
  const apiKey = useMemo(() => process.env.API_KEY || '', []);
  const isGoogleDriveEnabled = useMemo(() => !!process.env.GOOGLE_CLIENT_ID, []);


  useEffect(() => {
    // When the app loads or the feature is disabled, if the current input type
    // is 'drive', reset it to 'file'.
    if (!isGoogleDriveEnabled && inputType === 'drive') {
      setInputType('file');
    }
  }, [isGoogleDriveEnabled, inputType]);


  useEffect(() => {
    try {
      const stored = localStorage.getItem('savedTranscriptions');
      if (stored) {
        setSavedTranscriptions(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Fehler beim Laden der Transkriptionen aus dem localStorage", e);
      setSavedTranscriptions([]);
    }
  }, []);

  const handleSaveTranscription = useCallback(() => {
    if (!transcription || !file) return;

    const newSavedItem: Transcription = {
      id: Date.now(),
      text: transcription,
      fileName: file.name,
      savedAt: new Date().toISOString(),
    };

    setSavedTranscriptions(prev => {
      const updated = [newSavedItem, ...prev];
      localStorage.setItem('savedTranscriptions', JSON.stringify(updated));
      return updated;
    });
  }, [transcription, file]);
  
  const handleDeleteTranscription = useCallback((id: number) => {
    setSavedTranscriptions(prev => {
      const updated = prev.filter(t => t.id !== id);
      localStorage.setItem('savedTranscriptions', JSON.stringify(updated));
      return updated;
    });
  }, []);


  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile) {
      setFile(selectedFile);
      setStatus('idle');
      setTranscription('');
      setError(null);
    }
  };
  
  const handleSaveToDrive = useCallback(async () => {
    if (!googleAuthToken || !transcription || !file) {
      throw new Error("Bedingungen zum Speichern auf Drive nicht erfüllt.");
    }
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    const driveFileName = `${baseName}_transkription.txt`;
    await uploadToDrive(googleAuthToken, driveFileName, transcription);
  }, [googleAuthToken, transcription, file]);

  const handleTranscription = useCallback(async () => {
    if (!file) {
      setError('Bitte wähle zuerst eine Datei aus oder erstelle eine Aufnahme.');
      setStatus('error');
      return;
    }

    setStatus('processing');
    setIsTranscriptionComplete(false);
    setError(null);
    setProgressInfo({ status: 'Vorbereitung...', percentage: 0 });

    try {
      const prompt = "Transkribiere den folgenden gesprochenen Text. Gib nur die Transkription aus, ohne zusätzliche Kommentare oder Formatierungen.";
      const selectedModel = model === 'pro' ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
      
      const handleProgress = (progress: ProgressState) => {
        setProgressInfo(progress);
      };

      let initialTranscription = await transcribeMedia(file, prompt, selectedModel, handleProgress);
      
      let finalTranscription = initialTranscription;
      if (postProcess) {
        setProgressInfo({ status: 'Ergebnisse werden verbessert...', percentage: 99 });
        // FIX: Call `postProcessTranscription` instead of `transcribeMedia` for post-processing.
        finalTranscription = await postProcessTranscription(initialTranscription);
      }
      
      setTranscription(finalTranscription);
      setIsTranscriptionComplete(true);
      setProgressInfo({ status: 'Abgeschlossen!', percentage: 100 });

      // Allow time for the progress bar to animate to 100%
      setTimeout(() => {
        setStatus('success');
      }, 1000);

    } catch (err) {
      console.error(err);
      setError('Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
      setStatus('error');
    }
  }, [file, model, postProcess]);

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

  const renderExtractorContent = () => {
    if (status === 'processing') {
      return <ProgressBar isComplete={isTranscriptionComplete} progressInfo={progressInfo} />;
    }

    if (status === 'success') {
      return <TranscriptionDisplay 
                transcription={transcription} 
                fileName={file?.name || 'transkription'} 
                onReset={resetState}
                onSave={handleSaveTranscription}
                onSaveToDrive={isGoogleDriveEnabled ? handleSaveToDrive : undefined}
                isDriveAuthenticated={!!googleAuthToken}
             />;
    }

    // Idle or Error status
    if (file) {
      return (
        <>
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
            <TranscriptionSettings
                model={model}
                onModelChange={setModel}
                postProcessEnabled={postProcess}
                onPostProcessChange={setPostProcess}
            />
        </>
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
            {isGoogleDriveEnabled && (
                <button 
                    onClick={() => setInputType('drive')}
                    className={`flex-1 py-3 text-center font-semibold transition-colors duration-300 flex items-center justify-center gap-2 ${inputType === 'drive' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}
                >
                    <GoogleDriveIcon className="w-5 h-5" />
                    Google Drive
                </button>
            )}
        </div>
        {inputType === 'file' && <FileUploader onFileChange={handleFileChange} />}
        {inputType === 'microphone' && <MicrophoneInput onFileChange={handleFileChange} />}
        {inputType === 'drive' && isGoogleDriveEnabled && (
            <GoogleDrivePicker 
                token={googleAuthToken} 
                onTokenChange={setGoogleAuthToken} 
                onFileChange={handleFileChange} 
                apiKey={apiKey}
            />
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
            Wandle gesprochene Sprache aus Audioquellen in Text um und speichere deine Ergebnisse.
          </p>
        </header>

         <div className="flex w-full border-b border-gray-600 bg-gray-700/20">
            <button 
                onClick={() => setActiveView('extractor')}
                className={`flex-1 py-3 text-center font-semibold transition-colors duration-300 flex items-center justify-center gap-2 ${activeView === 'extractor' ? 'text-indigo-400 border-b-2 border-indigo-400 bg-gray-800/50' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'}`}
            >
                <SparklesIcon className="w-5 h-5" />
                Extraktor
            </button>
            <button 
                onClick={() => setActiveView('saved')}
                className={`flex-1 py-3 text-center font-semibold transition-colors duration-300 flex items-center justify-center gap-2 ${activeView === 'saved' ? 'text-indigo-400 border-b-2 border-indigo-400 bg-gray-800/50' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'}`}
            >
                <ArchiveIcon className="w-5 h-5" />
                Gespeicherte Transkriptionen
                {savedTranscriptions.length > 0 && (
                    <span className="ml-2 bg-indigo-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{savedTranscriptions.length}</span>
                )}
            </button>
        </div>


        <main className="p-6 sm:p-8">
          {activeView === 'extractor' ? (
            <>
              {renderExtractorContent()}
              {status === 'error' && error && (
                <div className="mt-4 text-center bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg" role="alert">
                  <strong className="font-bold">Fehler: </strong>
                  <span className="block sm:inline">{error}</span>
                </div>
              )}
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
            </>
          ) : (
             <SavedTranscriptions transcriptions={savedTranscriptions} onDelete={handleDeleteTranscription} />
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