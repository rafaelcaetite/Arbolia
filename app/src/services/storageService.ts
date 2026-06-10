/**
 * Serviço centralizado de upload/download/delete para Firebase Storage.
 * 
 * Estrutura de buckets:
 *   - Gallery/{serviceId}/{filename}   → fotos de serviços
 *   - Documents/{serviceId}/{filename} → PDFs e documentos de serviços
 *   - Profiles/{userId}/{filename}     → fotos de perfil
 */

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../lib/firebase';

export type StorageBucket = 'Gallery' | 'Documents' | 'Profiles';

/**
 * Faz upload de um File/Blob para o Firebase Storage e retorna o storagePath e a downloadURL.
 */
export async function uploadToStorage(
  file: File | Blob,
  bucket: StorageBucket,
  fileName: string,
  subFolder?: string
): Promise<{ storagePath: string; downloadURL: string }> {
  const path = subFolder
    ? `${bucket}/${subFolder}/${fileName}`
    : `${bucket}/${fileName}`;

  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);

  return { storagePath: path, downloadURL };
}

/**
 * Comprime uma imagem via Canvas e retorna o Blob resultante.
 */
export function compressImageToBlob(
  file: File | Blob,
  maxDimension = 1200,
  quality = 0.75
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDimension) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) { reject(new Error('Canvas 2D indisponível')); return; }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Canvas.toBlob retornou null'));
            },
            'image/jpeg',
            quality
          );
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error('Erro ao carregar imagem'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsDataURL(file);
  });
}

/**
 * Deleta um arquivo do Firebase Storage pelo storagePath.
 */
export async function deleteFromStorage(storagePath: string): Promise<void> {
  try {
    // Ignora caminhos que não são do Storage (base64, http antigos)
    if (storagePath.startsWith('data:') || storagePath.startsWith('http')) return;

    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
  } catch (err) {
    console.warn('Erro ao deletar arquivo do Storage (pode já ter sido removido):', err);
  }
}

/**
 * Obtém a URL de download de um arquivo no Storage.
 */
export async function getStorageDownloadURL(storagePath: string): Promise<string | null> {
  if (storagePath.startsWith('http') || storagePath.startsWith('data:')) {
    return storagePath;
  }
  try {
    const storageRef = ref(storage, storagePath);
    return await getDownloadURL(storageRef);
  } catch (err) {
    console.error('Erro ao obter download URL:', err);
    return null;
  }
}
