
import React, { useState, useEffect, useCallback } from 'react';
import { GoogleDriveIcon } from './icons/GoogleDriveIcon';
import * as driveService from '../services/googleDriveService';

// App.tsx stellt sicher, dass GOOGLE_CLIENT_ID vorhanden ist, bevor diese Komponente gerendert wird.
// Das '!' am Ende ist eine TypeScript-Zusicherung, dass der Wert nicht null oder undefiniert sein wird.
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;

interface GoogleDrivePickerProps {
    token: string | null;
    onTokenChange: (token: string | null) => void;
    onFileChange: (file: File) => void;
    apiKey: string;
}

const GoogleDrivePicker: React.FC<GoogleDrivePickerProps> = ({ token, onTokenChange, onFileChange, apiKey }) => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'picking' | 'downloading' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        setStatus('loading');
        driveService.initGoogleClients(GOOGLE_CLIENT_ID)
            .then(() => setStatus('idle'))
            .catch(err => {
                console.error("Fehler bei der Initialisierung der Google-Clients:", err);
                setErrorMessage("Google-Dienste konnten nicht geladen werden. Überprüfe die Konsolenausgabe für Details.");
                setStatus('error');
            });
    }, []);

    const handleAuth = useCallback(async () => {
        try {
            const tokenResponse = await driveService.requestAccessToken();
            onTokenChange(tokenResponse.access_token);
        } catch (err: any) {
            console.error("Authentifizierungsfehler:", err);
            setErrorMessage("Authentifizierung fehlgeschlagen. Bitte versuche es erneut.");
            setStatus('error');
        }
    }, [onTokenChange]);
    
    const handlePickFile = useCallback(async () => {
        if (!token) return;
        setStatus('picking');
        setErrorMessage(null);
        try {
            const doc = await driveService.showPicker(apiKey, token);
            setStatus('downloading');
            const blob = await driveService.downloadFile(token, doc.id);
            
            const file = new File([blob], doc.name, { type: blob.type });
            onFileChange(file);
            setStatus('idle');
        } catch (err: any) {
            if (err.message !== 'Picker wurde abgebrochen') {
                 console.error("Fehler beim Auswählen/Herunterladen der Datei:", err);
                 setErrorMessage("Datei konnte nicht verarbeitet werden.");
                 setStatus('error');
            } else {
                 setStatus('idle'); // Zurück zum Normalzustand bei Abbruch
            }
        }
    }, [apiKey, token, onFileChange]);

    const renderContent = () => {
        if (status === 'error' && errorMessage) {
            return <p className="text-red-400 max-w-sm">{errorMessage}</p>;
        }
        if (status === 'loading') {
            return <p className="text-gray-400">Google-Dienste werden geladen...</p>;
        }

        if (!token) {
            return (
                <>
                    <GoogleDriveIcon className="w-10 h-10 mb-4 text-gray-400" />
                    <p className="mb-4 text-sm text-gray-400">Verbinde dein Google Drive-Konto, um eine Datei auszuwählen.</p>
                    <button
                        onClick={handleAuth}
                        disabled={status !== 'idle'}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500/50 disabled:bg-gray-500"
                    >
                        <GoogleDriveIcon className="w-5 h-5" />
                        Mit Google verbinden
                    </button>
                </>
            );
        }

        let buttonText = 'Datei aus Drive auswählen';
        if (status === 'picking') buttonText = 'Picker wird geöffnet...';
        if (status === 'downloading') buttonText = 'Datei wird geladen...';

        return (
            <>
                <GoogleDriveIcon className="w-10 h-10 mb-4 text-green-400" />
                <p className="mb-4 text-sm text-gray-400">Du bist mit Google Drive verbunden.</p>
                <button
                    onClick={handlePickFile}
                    disabled={status !== 'idle'}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-500/50 disabled:bg-gray-500"
                >
                    {buttonText}
                </button>
            </>
        );
    };

    return (
        <div className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-600 border-dashed rounded-lg bg-gray-700/50 p-6 text-center">
            {renderContent()}
        </div>
    );
};

export default GoogleDrivePicker;
