
export const fileToBase64 = (file: File): Promise<{ base64Data: string, mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // result is in format: "data:audio/mpeg;base64,..."
      // we need to extract the base64 part
      const base64Data = result.split(',')[1];
      const mimeType = result.split(';')[0].split(':')[1];
      resolve({ base64Data, mimeType });
    };
    reader.onerror = (error) => reject(error);
  });
};
