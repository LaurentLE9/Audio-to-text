
import React, { useState } from 'react';
import { DownloadIcon } from './icons/DownloadIcon';
import { SaveIcon } from './icons/SaveIcon';
import { GoogleDriveIcon } from './icons/GoogleDriveIcon';

interface TranscriptionDisplayProps {
  transcription: string;
  fileName: string;
  onReset: () => void;
  onSave: () => void;
  onSaveToDrive?: () => Promise<void>;
  isDriveAuthenticated: boolean;
}

const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({ transcription, fileName, onReset, onSave, onSaveToDrive, isDriveAuthenticated }) => {
  const [isSaved, setIsSaved] = useState(false);
  const [driveSaveState, setDriveSaveState] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  
  const downloadTranscription = () => {
    const blob = new Blob([transcription], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
    a.download = `${baseName}_transkription.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleSave = () => {
    onSave();
    setIsSaved(true);
  };

  const handleSaveToDrive = async () => {
    if (!onSaveToDrive) return;
    setDriveSaveState('saving');
    try {
      await onSaveToDrive();
      setDriveSaveState('success');
    } catch (error) {
      console.error("Fehler beim Speichern in Google Drive:", error);
      setDriveSaveState('error');
      // Nach ein paar Sekunden zurücksetzen
      setTimeout(() => setDriveSaveState('idle'), 3000);
    }
  };

  const getDriveButtonText = () => {
    switch (driveSaveState) {
      case 'saving':
        return 'Speichern...';
      case 'success':
        return 'Gespeichert!';
      case 'error':
        return 'Fehler';
      default:
        return 'In Drive speichern';
    }
  };


  return (
    <div className="w-full flex flex-col space-y-4">
      <h2 className="text-xl font-semibold text-center text-gray-200">Transkription</h2>
      <div className="w-full bg-gray-900/50 rounded-lg p-4 h-64 overflow-y-auto border border-gray-600">
        <p className="text-gray-300 whitespace-pre-wrap">{transcription}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-4">
         <button
            onClick={downloadTranscription}
            className="flex-grow flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-500/50"
          >
            <DownloadIcon className="w-5 h-5" />
            Herunterladen
          </button>
          <button
            onClick={handleSave}
            disabled={isSaved}
            className="flex-grow flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-500/50 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:transform-none"
          >
            <SaveIcon className="w-5 h-5" />
            {isSaved ? 'Gespeichert' : 'Speichern'}
          </button>
          {onSaveToDrive && isDriveAuthenticated && (
              <button
                onClick={handleSaveToDrive}
                disabled={driveSaveState !== 'idle'}
                className="flex-grow flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500/50 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:transform-none"
              >
                  <GoogleDriveIcon className="w-5 h-5" />
                  {getDriveButtonText()}
              </button>
          )}
           <button
            onClick={onReset}
            className="flex-grow bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 ease-in-out"
          >
            Neue Datei
          </button>
      </div>
    </div>
  );
};

export default TranscriptionDisplay;