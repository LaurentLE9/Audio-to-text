
import React, { useCallback, useState } from 'react';
import { UploadIcon } from './icons/UploadIcon';

interface FileUploaderProps {
  onFileChange: (file: File | null) => void;
}

const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const FileUploader: React.FC<FileUploaderProps> = ({ onFileChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((selectedFile: File) => {
    setError(null);
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setError(`Die Datei überschreitet das Limit von ${MAX_FILE_SIZE_MB} MB.`);
      onFileChange(null);
      return;
    }
    onFileChange(selectedFile);
  }, [onFileChange]);

  // FIX: Correctly type drag events for HTMLLabelElement.
  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  // FIX: Correctly type drag events for HTMLLabelElement.
  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  // FIX: Correctly type drag events for HTMLLabelElement.
  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // FIX: Correctly type drag events for HTMLLabelElement.
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
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
    // Reset input to allow re-selecting the same file after an error
    e.target.value = '';
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
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
          <p className="text-xs text-gray-500">Max. {MAX_FILE_SIZE_MB} MB. Audio- und Videoformate werden unterstützt.</p>
        </div>
        <input id="dropzone-file" type="file" className="hidden" onChange={handleChange} accept="audio/*,video/*" />
      </label>
      {error && (
        <div className="mt-4 w-full text-center bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg" role="alert">
          <strong className="font-bold">Fehler: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
