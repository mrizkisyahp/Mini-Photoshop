import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 30000,
});

export async function sendImageRequest(endpoint, file, params = {}) {
  const formData = new FormData();
  formData.append('file', file);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });

  const response = await api.post(endpoint, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    responseType: 'blob',
  });

  return { blob: response.data, headers: response.headers };
}

export async function sendDataRequest(endpoint, file, params = {}) {
  const formData = new FormData();
  formData.append('file', file);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });

  const response = await api.post(endpoint, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

export async function downloadFileRequest(endpoint, file, params = {}, filename = 'download') {
  const { blob, headers } = await sendImageRequest(endpoint, file, params);
  
  // Try to extract filename from Content-Disposition if available
  let finalFilename = filename;
  const contentDisposition = headers['content-disposition'];
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
    if (filenameMatch && filenameMatch.length === 2) {
      finalFilename = filenameMatch[1];
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = finalFilename;
  a.click();
  URL.revokeObjectURL(url);
}
