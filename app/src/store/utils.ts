export const getLocalArray = (key: string): string[] => {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
};

export const addLocalId = (key: string, id: string) => {
  const arr = getLocalArray(key);
  if (!arr.includes(id)) { arr.push(id); localStorage.setItem(key, JSON.stringify(arr)); }
};

export const calculateDiff = (oldObj: Record<string, unknown> | undefined | null, newObj: Record<string, unknown>) => {
  const ignoreKeys = ['id', 'created_at', 'updated_at', 'data_cadastro', 'ativo', 'treeIds'];
  const diff: Record<string, { old: unknown; new: unknown }> = {};
  if (!oldObj || !newObj) return undefined;
  Object.entries(newObj).forEach(([key, val]) => {
    if (ignoreKeys.includes(key)) return;
    
    // Normalize para comparação (evita falsos positivos de datas vs strings)
    const oldStr = JSON.stringify(oldObj[key])?.replace(/"/g, '');
    const newStr = JSON.stringify(val)?.replace(/"/g, '');
    
    if (oldStr !== newStr && val !== undefined && oldStr !== undefined) {
      diff[key] = { old: oldObj[key], new: val };
    }
  });
  return Object.keys(diff).length > 0 ? diff : undefined;
};
