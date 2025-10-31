
import React, { useState, useRef, useCallback } from 'react';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { StopIcon } from './icons/StopIcon';

interface MicrophoneInputProps {
  onFileChange: (file: File) => void;
}

const MicrophoneInput: React.FC<MicrophoneInputProps> = ({ onFileChange }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);
      setRecordingTime(0);
      audioChunksRef.current = [];

      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `aufnahme_${new Date().toISOString()}.webm`, { type: 'audio/webm' });
        onFileChange(audioFile);
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();

      timerIntervalRef.current = window.setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);

    } catch (err) {
      console.error("Fehler beim Zugriff auf das Mikrofon:", err);
      alert("Konnte nicht auf das Mikrofon zugreifen. Bitte überprüfe die Berechtigungen in deinem Browser.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-600 border-dashed rounded-lg bg-gray-700/50 p-6 text-center">
      {!isRecording ? (
        <>
          <MicrophoneIcon className="w-10 h-10 mb-4 text-gray-400" />
          <p className="mb-4 text-sm text-gray-400">
            Klicke auf die Schaltfläche, um die Aufnahme zu starten
          </p>
          <button
            onClick={startRecording}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-500/50"
          >
            <MicrophoneIcon className="w-5 h-5" />
            Aufnahme starten
          </button>
        </>
      ) : (
        <>
          <div className="relative w-24 h-24 flex items-center justify-center mb-4">
             <div className="absolute w-full h-full bg-red-500/50 rounded-full animate-pulse"></div>
             <p className="text-2xl font-mono text-white z-10">{formatTime(recordingTime)}</p>
          </div>
           <p className="mb-4 text-sm text-gray-400">
            Aufnahme läuft...
          </p>
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 ease-in-out"
          >
            <StopIcon className="w-5 h-5" />
            Aufnahme stoppen
          </button>
        </>
      )}
    </div>
  );
};

export default MicrophoneInput;
