import type { ServiceAttachment } from '../../store/useAppStore';

export interface RichAttachment extends ServiceAttachment {
  serviceId: string;
  serviceTipo: string;
  serviceData: string;
  treeEspecie: string;
  treeId: string;
  clienteNome: string;
  tags: string[];
  docValidade?: string; // Para documentos com vencimento
}

export function daysUntil(dateStr: string) {
  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(dateStr + 'T00:00:00'); d.setHours(0,0,0,0);
  return Math.ceil((d.getTime() - today.getTime()) / (1000*60*60*24));
}

export async function getAttachmentUrl(storagePath: string, _bucket: 'Gallery' | 'Documents') {
  const { getStorageDownloadURL } = await import('../../services/storageService');
  return getStorageDownloadURL(storagePath);
}

export async function downloadAttachment(att: RichAttachment) {
  let url = att.dataUrl;
  
  if (!url && att.storagePath) {
    const bucket = att.type === 'image' ? 'Gallery' : 'Documents';
    url = await getAttachmentUrl(att.storagePath, bucket) || undefined;
  }

  if (!url) return;

  const a = document.createElement('a');
  a.href = url;
  a.download = att.name;
  a.click();
}
