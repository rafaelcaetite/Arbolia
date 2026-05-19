export interface MinimallyRequiredTree {
  id: string;
  codigo_v6?: number | null;
}

/**
 * Padroniza a formatação do ID da Árvore de maneira amigável e escalável.
 * Se houver `codigo_v6` sequencial do banco de dados, retorna no formato `ARB-0023` (4 dígitos zero-padded).
 * Caso contrário, usa os primeiros 8 caracteres do UUID no formato `ARB-8CHARHEX` (ex: `ARB-D18650B8`).
 */
export function formatTreeId(
  treeOrId: MinimallyRequiredTree | string | null | undefined
): string {
  if (!treeOrId) return 'N/A';
  
  if (typeof treeOrId === 'string') {
    const cleanId = treeOrId.replace('#', '').trim();
    const shortUuid = cleanId.length > 8 ? cleanId.slice(0, 8) : cleanId;
    return `ARB-${shortUuid.toUpperCase()}`;
  }
  
  if (treeOrId.codigo_v6 !== undefined && treeOrId.codigo_v6 !== null) {
    return `ARB-${treeOrId.codigo_v6.toString().padStart(4, '0')}`;
  }
  
  const cleanId = treeOrId.id.replace('#', '').trim();
  const shortUuid = cleanId.length > 8 ? cleanId.slice(0, 8) : cleanId;
  return `ARB-${shortUuid.toUpperCase()}`;
}
