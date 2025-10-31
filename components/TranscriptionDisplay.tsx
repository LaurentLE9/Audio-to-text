
import React from 'react';
import { DownloadIcon } from './icons/DownloadIcon';

interface TranscriptionDisplayProps {
  transcription: string;
  fileName: string;
  onReset: () => void;
}

const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({ transcription, fileName, onReset }) => {
  
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

  return (
    <div className="w-full flex flex-col space-y-4">
      <h2 className="text-xl font-semibold text-center text-gray-200">Transkription</h2>
      <div className="w-full bg-gray-900/50 rounded-lg p-4 h-64 overflow-y-auto border border-gray-600">
        <p className="text-gray-300 whitespace-pre-wrap">{transcription}</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
         <button
            onClick={downloadTranscription}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-500/50"
          >
            <DownloadIcon className="w-5 h-5" />
            Text herunterladen
          </button>
           <button
            onClick={onReset}
            className="w-full sm:w-auto bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 ease-in-out"
          >
            Neue Datei
          </button>
      </div>
    </div>
  );
};

export default TranscriptionDisplay;
