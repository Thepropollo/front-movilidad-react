import api from './api';

export async function fetchApiBlob(path: string): Promise<Blob> {
  const { data } = await api.get<Blob>(path, { responseType: 'blob' });
  return data;
}

export async function downloadApiFile(
  path: string,
  filename: string,
  params?: Record<string, string>
): Promise<void> {
  const { data } = await api.get<Blob>(path, {
    params,
    responseType: 'blob',
  });
  const objectUrl = URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
