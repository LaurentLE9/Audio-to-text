
import React, { useCallback, useState } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { FileAudioIcon } from './icons/FileAudioIcon';

interface FileUploaderProps {
  onFileChange: (file: File) => void;
  file: File | null;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileChange, file }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback((selectedFile: File) => {
    if (selectedFile && (selectedFile.type.startsWith('audio/') || selectedFile.type.startsWith('video/'))) {
      onFileChange(selectedFile);
    } else {
      alert('Bitte lade eine gültige Audio- oder Videodatei hoch.');
    }
  }, [onFileChange]);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  return (
    <div className="flex flex-col items-center justify-center w-full">
      {file ? (
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
      ) : (
        <label
          htmlFor="dropzone-file"
          className={`flex flex-col items-center justify-center w-full h-64 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700/50 hover:bg-gray-700/70 transition-colors duration-300 ${isDragging ? 'border-indigo-500' : ''}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <UploadIcon className="w-10 h-10 mb-4 text-gray-400" />
            <p className="mb-2 text-sm text-gray-400">
              <span className="font-semibold">Klicke zum Hochladen</span> oder ziehe eine Datei hierher
            </p>
            <p className="text-xs text-gray-500">Unterstützte Formate: MP3, WAV, MP4, MOV, etc.</p>
          </div>
          <input id="dropzone-file" type="file" className="hidden" onChange={handleChange} accept="audio/*,video/*" />
        </label>
      )}
    </div>
  );
};

export default FileUploader;
