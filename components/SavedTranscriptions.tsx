
import React, { useState } from 'react';
import { Transcription } from '../App';
import { CopyIcon } from './icons/CopyIcon';
import { TrashIcon } from './icons/TrashIcon';

interface SavedTranscriptionsProps {
  transcriptions: Transcription[];
  onDelete: (id: number) => void;
}

const SavedTranscriptions: React.FC<SavedTranscriptionsProps> = ({ transcriptions, onDelete }) => {
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopy = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (transcriptions.length === 0) {
    return (
      <div className="text-center text-gray-400 py-16">
        <p className="font-semibold text-lg">Keine gespeicherten Transkriptionen</p>
        <p className="mt-2 text-sm">Bearbeite eine Datei, um sie hier zu speichern.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      {transcriptions.map((item) => (
        <div key={item.id} className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold text-gray-200 break-all">{item.fileName}</p>
              <p className="text-xs text-gray-400 mt-1">
                Gespeichert am: {new Date(item.savedAt).toLocaleString('de-DE')}
              </p>
            </div>
             <div className="flex items-center gap-2 flex-shrink-0 ml-4">
              <button 
                onClick={() => handleCopy(item.text, item.id)}
                className="p-2 rounded-md bg-gray-600 hover:bg-indigo-600 text-white transition-colors"
                aria-label="Transkription kopieren"
              >
                {copiedId === item.id ? <span className="text-xs">Kopiert!</span> : <CopyIcon className="w-5 h-5" />}
              </button>
              <button 
                onClick={() => onDelete(item.id)}
                className="p-2 rounded-md bg-gray-600 hover:bg-red-600 text-white transition-colors"
                aria-label="Transkription löschen"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
          <p className="mt-3 text-sm text-gray-300 bg-gray-900/50 p-3 rounded-md max-h-24 overflow-y-auto whitespace-pre-wrap">
            {item.text}
          </p>
        </div>
      ))}
    </div>
  );
};

export default SavedTranscriptions;
