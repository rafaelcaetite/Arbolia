import { useState, useEffect, useRef } from 'react';
import { X, Save, MapPin, Camera, Loader2, Trash2 } from 'lucide-react';
import { useAppStore, type Tree } from '../../store/useAppStore';
import { supabase } from '../../lib/supabase';

export function TreeModal() {
  const { 
    isEditModalOpen, editingTreeId, trees, clients, closeEditModal, updateTree, createTree,
    isMapPickingMode, startMapPicking, cancelMapPicking, pickedCoordinates, clearPickedCoordinates
  } = useAppStore();
  
  const [formData, setFormData] = useState<Partial<Tree>>({});
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditModalOpen && editingTreeId) {
      const tree = trees.find(t => t.id === editingTreeId);
      if (tree) {
        setFormData(tree);
      }
    } else {
      setFormData({ 
        especie: '', 
        altura: 0, 
        tamanho_copa: 0, 
        latitude: -20.7546, 
        longitude: -42.8825, 
        status_risco: 'baixo', 
        cliente_id: '',
        fotos: [],
        ativo: true 
      });
    }
  }, [isEditModalOpen, editingTreeId, trees]);

  useEffect(() => {
    if (pickedCoordinates) {
      setFormData(prev => ({ ...prev, latitude: pickedCoordinates.lat, longitude: pickedCoordinates.lng }));
      clearPickedCoordinates();
    }
  }, [pickedCoordinates, clearPickedCoordinates]);

  if (!isEditModalOpen) return null;

  if (isMapPickingMode) {
    return (
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-white px-5 py-3 rounded-full shadow-2xl border border-slate-200 flex items-center gap-4 animate-in slide-in-from-top-4 duration-300">
        <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <MapPin size={18} className="text-primary animate-bounce" /> 
          Clique no mapa para definir o local
        </span>
        <button 
          onClick={cancelMapPicking} 
          className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
        >
          Cancelar
        </button>
      </div>
    );
  }

  const isEditing = !!editingTreeId;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const newFotos = [...(formData.fotos || [])];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Limite de 2MB para fotos de árvore (um pouco mais que perfil)
        if (file.size > 2 * 1024 * 1024) continue;

        const fileExt = file.name.split('.').pop();
        const fileName = `${editingTreeId || 'new'}/${Math.random()}.${fileExt}`;
        const filePath = fileName;

        const { error: uploadError } = await supabase.storage
          .from('Gallery')
          .upload(filePath, file);

        if (!uploadError) {
          newFotos.push(filePath);
        }
      }

      setFormData(prev => ({ ...prev, fotos: newFotos }));
    } catch (err) {
      console.error('Erro no upload da galeria:', err);
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (path: string) => {
    setFormData(prev => ({
      ...prev,
      fotos: prev.fotos?.filter(f => f !== path)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Preparar dados para o banco (UUID nulo se vazio)
    const treeData = {
      ...formData,
      cliente_id: formData.cliente_id === "" ? null : formData.cliente_id,
      ativo: true,
      data_cadastro: new Date().toISOString()
    };

    try {
      if (isEditing) {
        await updateTree(editingTreeId, treeData);
      } else {
        await createTree(treeData as Omit<Tree, 'id'>);
      }
      closeEditModal();
    } catch (err: any) {
      console.error('Erro ao salvar árvore:', err);
      const msg = err.message || 'Erro desconhecido';
      const code = err.code || '';
      alert(`Erro ao salvar árvore: ${msg} [${code}]. Verifique as políticas de RLS no Supabase.`);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity"
        onClick={closeEditModal}
      ></div>
      
      {/* Modal Container */}
      <div className="bg-white rounded-3xl shadow-2xl shadow-slate-900/10 w-full max-w-lg relative z-10 overflow-hidden flex flex-col transform transition-all animate-in fade-in zoom-in-95 duration-200 h-[90vh] sm:h-auto sm:max-h-[95vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-20">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">
            {isEditing ? 'Atualizar Árvore' : 'Nova Árvore'}
          </h2>
          <button 
            onClick={closeEditModal}
            className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 bg-slate-50/30 overflow-y-auto">
          <form id="tree-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            {/* Galeria de Fotos */}
            <div className="flex flex-col gap-3">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center">
                Galeria de Campo
                <span className="text-[9px] font-medium text-slate-300">Máx 2MB por foto</span>
              </label>
              
              <div className="grid grid-cols-4 gap-3">
                {formData.fotos?.map((foto, idx) => (
                  <div key={idx} className="aspect-square rounded-2xl bg-slate-200 relative group overflow-hidden border border-slate-100">
                    <img 
                      src={foto.startsWith('http') || foto.startsWith('data:') ? foto : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/Gallery/${foto}`} 
                      alt="Tree" 
                      className="w-full h-full object-cover"
                    />
                    <button 
                      type="button"
                      onClick={() => removePhoto(foto)}
                      className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 hover:border-primary hover:bg-primary/5 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-primary transition-all disabled:opacity-50"
                >
                  {uploading ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
                  <span className="text-[10px] font-bold">Adicionar</span>
                </button>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                multiple 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileUpload} 
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cliente Proprietário</label>
              <select 
                value={formData.cliente_id || ''}
                onChange={(e) => setFormData({...formData, cliente_id: e.target.value})}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
              >
                <option value="">Selecione um cliente (opcional)</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Espécie</label>
              <input 
                type="text" 
                required
                value={formData.especie || ''}
                onChange={(e) => setFormData({...formData, especie: e.target.value})}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="Ex: Ipê Amarelo"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Altura (m)</label>
                <input 
                  type="number" 
                  step="0.1"
                  required
                  value={formData.altura || ''}
                  onChange={(e) => setFormData({...formData, altura: parseFloat(e.target.value)})}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Copa (m)</label>
                <input 
                  type="number" 
                  step="0.1"
                  required
                  value={formData.tamanho_copa || ''}
                  onChange={(e) => setFormData({...formData, tamanho_copa: parseFloat(e.target.value)})}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Latitude</label>
                <input 
                  type="number" 
                  step="any"
                  required
                  value={formData.latitude || ''}
                  onChange={(e) => setFormData({...formData, latitude: parseFloat(e.target.value)})}
                  placeholder="-20.7546"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <div className="flex justify-between items-end">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Longitude</label>
                  <button 
                    type="button"
                    onClick={startMapPicking}
                    className="text-[10px] font-bold text-primary hover:text-primary-dark flex items-center gap-1 bg-primary/5 px-2 py-1 rounded-md"
                  >
                    <MapPin size={10} /> Escolher no Mapa
                  </button>
                </div>
                <input 
                  type="number" 
                  step="any"
                  required
                  value={formData.longitude || ''}
                  onChange={(e) => setFormData({...formData, longitude: parseFloat(e.target.value)})}
                  placeholder="-42.8825"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nível de Risco</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                {(['baixo', 'medio', 'alto', 'critico'] as const).map((risk) => (
                  <button
                    key={risk}
                    type="button"
                    onClick={() => setFormData({...formData, status_risco: risk})}
                    className={`py-2 px-1 rounded-xl text-xs font-bold uppercase transition-all border ${
                      formData.status_risco === risk 
                        ? risk === 'baixo' ? 'bg-emerald-100 border-emerald-200 text-emerald-700 shadow-sm' :
                          risk === 'medio' ? 'bg-yellow-100 border-yellow-200 text-yellow-700 shadow-sm' :
                          risk === 'alto' ? 'bg-orange-100 border-orange-200 text-orange-700 shadow-sm' :
                          'bg-red-100 border-red-200 text-red-700 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    {risk}
                  </button>
                ))}
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-slate-100 bg-white flex justify-end">
          <button 
            type="submit"
            form="tree-form"
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/30 transition-all transform hover:scale-[1.01] active:scale-95"
          >
            <Save size={18} />
            Efetivar Mudanças
          </button>
        </div>

      </div>
    </div>
  );
}
