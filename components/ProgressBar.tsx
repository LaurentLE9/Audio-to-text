
import React from 'react';
import { ProgressState } from '../services/geminiService';

interface ProgressBarProps {
  isComplete: boolean;
  progressInfo: ProgressState;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ isComplete, progressInfo }) => {
  const { status, percentage } = progressInfo;

  return (
    <div className="flex flex-col items-center justify-center space-y-4 my-8 w-full px-4">
      <p className="text-lg text-gray-300 font-medium">{isComplete ? 'Abgeschlossen!' : status}</p>
      <div className="w-full bg-gray-700 rounded-full h-4 relative overflow-hidden border border-gray-600">
        <div 
          className="bg-indigo-500 h-full rounded-full transition-all duration-500 ease-out" 
          style={{ width: `${percentage}%` }}
        ></div>
         <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white mix-blend-difference">
          {Math.round(percentage)}%
        </span>
      </div>
      <p className="text-sm text-gray-400">Dieser Vorgang kann je nach Dateigröße einige Zeit dauern.</p>
    </div>
  );
};

export default ProgressBar;
