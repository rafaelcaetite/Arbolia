/**
 * Utilitários para compressão e conversão de arquivos para Base64 no Arbolia.
 * Projetado para viabilizar armazenamento Offline e NoSQL 100% no Firestore.
 */

/**
 * Comprime uma imagem utilizando HTML5 Canvas e a converte para Base64 (data URL).
 * Mantém excelente qualidade visual limitando as dimensões máximas (1200px) e aplicando compressão JPEG.
 *
 * @param file Arquivo de imagem original (File ou Blob)
 * @param maxDimension Limite de largura ou altura (padrão 1200px)
 * @param quality Fator de qualidade do JPEG (0.0 a 1.0, padrão 0.75)
 * @returns Promessa contendo a string em formato Base64 (data:image/jpeg;base64,...)
 */
export function compressImageToBase64(
  file: File | Blob,
  maxDimension = 1200,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Redimensionamento proporcional respeitando a dimensão máxima
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
          if (!ctx) {
            reject(new Error('Não foi possível obter o contexto 2D do Canvas.'));
            return;
          }

          // Desenha a imagem redimensionada
          ctx.drawImage(img, 0, 0, width, height);

          // Exporta como JPEG com o fator de qualidade especificado
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error('Erro ao carregar a imagem original no elemento HTMLImage.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo original.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Lê qualquer arquivo (como PDF) e o converte diretamente para string Base64 (data URL).
 *
 * @param file Arquivo original
 * @returns Promessa contendo a string em formato Base64 (data:application/pdf;base64,...)
 */
export function readFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    reader.onerror = () => reject(new Error('Erro ao converter arquivo para Base64.'));
    reader.readAsDataURL(file);
  });
}
