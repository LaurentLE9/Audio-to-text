
import React, { useState, useEffect, useRef } from 'react';

interface ProgressBarProps {
  isComplete: boolean;
  statusText: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ isComplete, statusText }) => {
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Start the simulation interval
    intervalRef.current = window.setInterval(() => {
      setProgress(oldProgress => {
        if (oldProgress >= 95) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return oldProgress;
        }
        
        // Slower "transcription" phase
        const increment = Math.random() * 2 + 0.5;
        const newProgress = Math.min(oldProgress + increment, 95);

        return newProgress;
      });
    }, 400);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []); // Run only on mount

  useEffect(() => {
    if (isComplete) {
      // If the process is complete, clear the simulation interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Animate to 100%
      setProgress(100);
    }
  }, [isComplete]);


  return (
    <div className="flex flex-col items-center justify-center space-y-4 my-8 w-full px-4">
      <p className="text-lg text-gray-300 font-medium">{isComplete ? 'Abgeschlossen!' : statusText}</p>
      <div className="w-full bg-gray-700 rounded-full h-4 relative overflow-hidden border border-gray-600">
        <div 
          className="bg-indigo-500 h-full rounded-full transition-all duration-500 ease-out" 
          style={{ width: `${progress}%` }}
        ></div>
         <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white mix-blend-difference">
          {Math.round(progress)}%
        </span>
      </div>
      <p className="text-sm text-gray-400">Dieser Vorgang kann je nach Dateigröße einige Zeit dauern.</p>
    </div>
  );
};

export default ProgressBar;
