import { put } from '@vercel/blob';

export const uploadFileToBlob = async (file: File) => {
  const { url } = await put(file.name, file, { access: 'public' });
  return url;
};

export const downloadFileFromBlob = async (url: string) => {
  const response = await fetch(url);
  return response.blob();
};

export const deleteFileFromBlob = async (url: string) => {
  const response = await fetch(url, { method: 'DELETE' });
  return response.json();
};
