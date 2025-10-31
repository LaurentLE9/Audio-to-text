
// Typdeklarationen, um die Verwendung von 'any' zu vermeiden
declare const gapi: any;
declare const google: {
    accounts: {
        oauth2: {
            initTokenClient: (config: {
                client_id: string;
                scope: string;
                callback: (tokenResponse: any) => void;
            }) => any; // Returns a TokenClient
        };
    };
    picker: {
        View: new (viewId: any) => any;
        ViewId: {
            DOCS: string;
        };
        PickerBuilder: new () => any;
        Action: {
            PICKED: string;
            CANCEL: string;
        };
        ResponseObject: any;
        Document: any;
    };
};

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

let gapiInited = false;
let gisInited = false;
let tokenClient: any | null = null;
let googleReadyPromise: Promise<void> | null = null;

function loadGapiScript(): Promise<void> {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => gapi.load('client:picker', resolve);
    document.body.appendChild(script);
  });
}

function loadGisScript(): Promise<void> {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => resolve();
    document.body.appendChild(script);
  });
}

export function initGoogleClients(clientId: string): Promise<void> {
    if (!googleReadyPromise) {
        googleReadyPromise = (async () => {
            if (gapiInited && gisInited) return;

            // Load scripts in parallel
            await Promise.all([loadGapiScript(), loadGisScript()]);

            await gapi.client.init({});
            gapiInited = true;

            tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: DRIVE_SCOPE,
                callback: () => {}, // Wird im Promise von requestAccessToken gehandhabt
            });
            gisInited = true;
        })();
    }
    return googleReadyPromise;
}

export function requestAccessToken(): Promise<any> {
    return new Promise((resolve, reject) => {
        if (!tokenClient) {
            return reject(new Error('Google Auth ist nicht initialisiert'));
        }
        
        tokenClient.callback = (resp: any) => {
            if (resp.error) {
                return reject(resp);
            }
            resolve(resp);
        };
        
        tokenClient.requestAccessToken({ prompt: 'consent' });
    });
}

export function showPicker(apiKey: string, token: string): Promise<any> {
    return new Promise((resolve, reject) => {
        const view = new google.picker.View(google.picker.ViewId.DOCS);
        view.setMimeTypes("audio/*,video/*");
        
        const picker = new google.picker.PickerBuilder()
            .setDeveloperKey(apiKey)
            .setOAuthToken(token)
            .addView(view)
            .setCallback((data: any) => {
                if (data.action === google.picker.Action.PICKED) {
                    resolve(data.docs[0]);
                } else if (data.action === google.picker.Action.CANCEL) {
                    reject(new Error('Picker wurde abgebrochen'));
                }
            })
            .build();
        picker.setVisible(true);
    });
}

export async function downloadFile(token: string, fileId: string): Promise<Blob> {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!response.ok) {
        throw new Error('Fehler beim Herunterladen der Datei von Google Drive');
    }
    return response.blob();
}

export async function uploadFile(token: string, fileName: string, content: string): Promise<any> {
    const metadata = {
        name: fileName,
        mimeType: 'text/plain',
        parents: ['root']
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([content], { type: 'text/plain' }));

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body: form,
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Fehler beim Hochladen der Datei zu Google Drive: ${error.error.message}`);
    }
    
    return response.json();
}
