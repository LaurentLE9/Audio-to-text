
import React from 'react';
import { InfoIcon } from './icons/InfoIcon';

type Model = 'flash' | 'pro';

interface TranscriptionSettingsProps {
  model: Model;
  onModelChange: (model: Model) => void;
  postProcessEnabled: boolean;
  onPostProcessChange: (enabled: boolean) => void;
}

const TranscriptionSettings: React.FC<TranscriptionSettingsProps> = ({
  model,
  onModelChange,
  postProcessEnabled,
  onPostProcessChange,
}) => {
  return (
    <div className="w-full space-y-4 my-4 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
      <fieldset>
        <legend className="text-sm font-semibold text-gray-300 mb-2">Modell auswählen</legend>
        <div className="flex w-full bg-gray-800 rounded-md p-1">
          <button
            onClick={() => onModelChange('flash')}
            className={`flex-1 py-2 text-sm font-semibold rounded transition-colors ${model === 'flash' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
          >
            Standard (Flash)
          </button>
          <button
            onClick={() => onModelChange('pro')}
            className={`flex-1 py-2 text-sm font-semibold rounded transition-colors ${model === 'pro' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
          >
            Hohe Genauigkeit (Pro)
          </button>
        </div>
      </fieldset>

      <div className="relative flex items-start">
        <div className="flex h-6 items-center">
          <input
            id="post-process"
            aria-describedby="post-process-description"
            name="post-process"
            type="checkbox"
            checked={postProcessEnabled}
            onChange={(e) => onPostProcessChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-500 bg-gray-800 text-indigo-600 focus:ring-indigo-600"
          />
        </div>
        <div className="ml-3 text-sm leading-6">
          <label htmlFor="post-process" className="font-medium text-gray-300 flex items-center gap-1 cursor-pointer">
            Genauigkeit verbessern
            <span className="group relative">
                <InfoIcon className="w-4 h-4 text-gray-400" />
                <span className="absolute bottom-full mb-2 w-64 -translate-x-1/2 left-1/2 p-2 text-xs text-white bg-gray-900 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    Wendet nach der Transkription eine zusätzliche Korrektur durch ein fortgeschrittenes Modell an, um Fehler zu beheben und die Formatierung zu verbessern.
                </span>
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default TranscriptionSettings;
