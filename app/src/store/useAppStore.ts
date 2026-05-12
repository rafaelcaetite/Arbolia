import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

import type { Limitante, ResultadoISA, EntradaRisco } from '../lib/isaRiskEngine'

import { api } from '../services/api'


export interface Client {
  id: string
  nome: string
  documento: string
  email: string
  telefone: string
  endereco?: string
  data_cadastro: string
  status: 'ativo' | 'inativo'
}

// Dados do técnico responsável (usados no rodapé do PDF com peso legal)
export interface UserProfile {
  id: string
  nome: string
  email: string
  role: 'admin' | 'tecnico' | 'campo'
  crea?: string
  telefone?: string
  foto_url?: string
  data_nascimento?: string
  status: 'ativo' | 'inativo'
  data_cadastro?: string
}

export interface MapBounds {
  south: number
  west: number
  north: number
  east: number
}

export interface Tree {
  id: string
  cliente_id?: string | null
  especie: string
  altura: number
  tamanho_copa: number
  latitude: number
  longitude: number
  status_risco?: 'baixo' | 'medio' | 'alto' | 'critico' | null
  data_cadastro: string
  codigo_v6?: number | null
  ativo?: boolean | null
  fotos?: string[] | null
  motivo_supressao?: string | null
}

export interface ServiceAttachment {
  id: string
  name: string
  type: 'pdf' | 'image'
  dataUrl?: string   // Base64 data URL para persistência local (fallback)
  storagePath?: string // Caminho no bucket 'Documents' ou 'Gallery'
  size: number      // bytes
}

// Dados completos do laudo ISA — persistidos no serviço para rebuild do PDF
export interface ISALaudoData {
  // Etapa 1 e 3: Tabela de alvos cruzada com avaliação de risco
  entradasRisco: EntradaRisco[]
  descricaoLocal: string
  // Etapa 2
  defeitos: string[]
  // Etapa 4
  limitantes: Limitante[]
  // Etapa 4
  mitigacoesSelecionadas: string[]  // ids das OpcaoMitigacao
  parecer: 'final' | 'preliminar'
  avaliacaoAvancada: boolean
  observacoes: string
  // Resultado calculado (salvo para não recalcular ao exibir histórico)
  resultado: ResultadoISA
  // Metadados do técnico (capturados no momento da geração — imutabilidade legal)
  tecnicoNome: string
  tecnicoCrea: string
  dataLaudo: string  // ISO string
  // Interpretação por IA (Opcional)
  aiResumo?: {
    resumo_estado_geral: string
    explicacao_mitigacao: string
  }
}

export interface Service {
  id: string
  treeIds: string[]
  tipo: 'Poda' | 'Supressão' | 'Avaliação' | 'Tratamento'
  data: string
  horario?: string
  data_reavaliacao?: string
  data_validade_servico?: string
  responsavel: string
  status: 'concluido' | 'agendado' | 'atrasado'
  // Chave = treeId; cada árvore tem sua própria lista de anexos
  attachmentsByTree?: Record<string, ServiceAttachment[]>
  // Laudo ISA — presente apenas em serviços do tipo 'Avaliação'
  laudoGerado?: boolean
  laudoData?: ISALaudoData
}


interface AppState {
  clients: Client[]
  trees: Tree[]
  services: Service[]
  employees: UserProfile[]
  user: User | null
  userProfile: UserProfile | null
  setUser: (user: User | null) => void
  signOut: () => Promise<void>
  
  hoveredTreeId: string | null

  selectedTreeIds: string[]
  
  isEditModalOpen: boolean
  editingTreeId: string | null
  
  isServiceModalOpen: boolean
  
  isHistoryModalOpen: boolean
  viewingHistoryTreeId: string | null

  isTreeDetailsModalOpen: boolean
  viewingTreeDetailsId: string | null

  isClientDetailsModalOpen: boolean
  viewingClientDetailsId: string | null

  isReminderModalOpen: boolean
  activeReminderServiceId: string | null

  isPostServiceModalOpen: boolean
  activePostServiceId: string | null

  isClientModalOpen: boolean
  editingClientId: string | null

  isProfileModalOpen: boolean

  // Modal de Laudo ISA
  isLaudoModalOpen: boolean
  activeLaudoServiceId: string | null

  mapBounds: MapBounds | null
  setMapBounds: (bounds: MapBounds | null) => void

  isMapPickingMode: boolean
  pickedCoordinates: { lat: number, lng: number } | null
  startMapPicking: () => void
  cancelMapPicking: () => void
  finishMapPicking: (lat: number, lng: number) => void
  clearPickedCoordinates: () => void
  
  initializeData: () => Promise<void>
  setClients: (clients: Client[]) => void

  setTrees: (trees: Tree[]) => void
  setServices: (services: Service[]) => void
  setHoveredTreeId: (id: string | null) => void
  toggleTreeSelection: (id: string) => void
  clearSelection: () => void
  
  openEditModal: (id: string | null) => void
  closeEditModal: () => void
  updateTree: (id: string, data: Partial<Tree>) => Promise<void>
  createTree: (data: Omit<Tree, 'id' | 'data_cadastro'>) => Promise<void>

  
  openServiceModal: () => void
  closeServiceModal: () => void
  createService: (data: Omit<Service, 'id' | 'treeIds'>) => Promise<void>
  completeService: (id: string, reavaliacao?: string, validade?: string) => Promise<void>
  deactivateTrees: (treeIds: string[], motivo: string) => Promise<void>
  
  addServiceAttachment: (serviceId: string, treeId: string, attachment: ServiceAttachment) => Promise<void>
  renameAttachment: (serviceId: string, treeId: string, attachmentId: string, newName: string) => Promise<void>
  deleteAttachment: (serviceId: string, treeId: string, attachmentId: string) => Promise<void>


  openPostServiceModal: (id: string) => void
  closePostServiceModal: () => void

  openLaudoModal: (serviceId: string) => void
  closeLaudoModal: () => void
  // Salva o laudo e marca laudoGerado=true no serviço
  saveLaudo: (serviceId: string, laudo: ISALaudoData, attachmentsByTree: any, storagePath?: string) => Promise<void>

  
  openHistoryModal: (treeId: string) => void
  closeHistoryModal: () => void

  openTreeDetailsModal: (id: string) => void
  closeTreeDetailsModal: () => void

  openClientDetailsModal: (id: string) => void
  closeClientDetailsModal: () => void

  openReminderModal: (serviceId: string) => void
  closeReminderModal: () => void

  openClientModal: (id?: string) => void
  closeClientModal: () => void
  createClient: (data: Omit<Client, 'id' | 'data_cadastro'>) => Promise<void>
  updateClient: (id: string, data: Partial<Client>) => Promise<void>

  openProfileModal: () => void
  closeProfileModal: () => void
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>

  // Clima
  weatherCity: { name: string, lat: number, lon: number }
  setWeatherCity: (city: { name: string, lat: number, lon: number }) => void

  fetchEmployees: () => Promise<void>
  createEmployee: (data: any) => Promise<void>
  updateEmployee: (id: string, data: any) => Promise<void>
  uploadFile: (bucket: string, file: File) => Promise<string>
}

export const useAppStore = create<AppState>((set, get) => ({
  // ... (existing state)
  // (Note: I will only replace the implementation of updateEmployee and relevant parts)
  clients: [],
  trees: [],
  services: [],
  employees: [],
  user: null,
  userProfile: null,
  setUser: (user) => set({ user }),
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, userProfile: null, clients: [], trees: [], services: [], employees: [] });
  },

  hoveredTreeId: null,
  selectedTreeIds: [],
  
  isEditModalOpen: false,
  editingTreeId: null,
  
  isServiceModalOpen: false,
  
  isHistoryModalOpen: false,
  viewingHistoryTreeId: null,

  isTreeDetailsModalOpen: false,
  viewingTreeDetailsId: null,

  isClientDetailsModalOpen: false,
  viewingClientDetailsId: null,

  isReminderModalOpen: false,
  activeReminderServiceId: null,

  isPostServiceModalOpen: false,
  activePostServiceId: null,

  isClientModalOpen: false,
  editingClientId: null,

  isProfileModalOpen: false,

  isLaudoModalOpen: false,
  activeLaudoServiceId: null,

  mapBounds: null,
  setMapBounds: (bounds) => set({ mapBounds: bounds }),

  isMapPickingMode: false,
  pickedCoordinates: null,
  startMapPicking: () => set({ isMapPickingMode: true }),
  cancelMapPicking: () => set({ isMapPickingMode: false }),
  finishMapPicking: (lat, lng) => set({ isMapPickingMode: false, pickedCoordinates: { lat, lng } }),
  clearPickedCoordinates: () => set({ pickedCoordinates: null }),

  initializeData: async () => {
    try {
      const { user } = useAppStore.getState();
      if (!user) return;

      // 1. Tenta buscar o perfil do usuário logado
      let profile;
      try {
        profile = await api.getProfile(user.id);
      } catch (e) {
        // 2. Se não existir perfil, tenta criar um automaticamente para não ficar como "Técnico"
        console.log('Perfil não encontrado, tentando criar auto-perfil...');
        try {
          profile = await api.createEmployee({
            id: user.id,
            nome: user.user_metadata?.nome || user.email?.split('@')[0] || 'Administrador',
            email: user.email || '',
            role: 'admin', // O primeiro setup de usuário é tratado como admin
          });
        } catch (createErr) {
          console.error('Falha ao auto-criar perfil:', createErr);
        }
      }
      
      if (profile) {
        set({ userProfile: profile });
      }

      // 3. Carrega os dados principais
      const [clients, trees, services] = await Promise.all([
        api.getClients(),
        api.getTrees(),
        api.getServices()
      ]);
      
      set({ clients, trees, services });

      // 4. Se for admin, carregar funcionários
      if (profile?.role === 'admin') {
        const employees = await api.getEmployees();
        set({ employees });
      }
    } catch (error) {
      console.error('Erro ao carregar dados do Supabase:', error);
    }
  },


  setClients: (clients) => set({ clients }),
  setTrees: (trees) => set({ trees }),
  setServices: (services) => set({ services }),
  
  setHoveredTreeId: (id) => set({ hoveredTreeId: id }),
  
  toggleTreeSelection: (id) => set((state) => {
    const isSelected = state.selectedTreeIds.includes(id)
    if (isSelected) {
      return { selectedTreeIds: state.selectedTreeIds.filter(tId => tId !== id) }
    } else {
      return { selectedTreeIds: [...state.selectedTreeIds, id] }
    }
  }),
  
  clearSelection: () => set({ selectedTreeIds: [] }),
  
  openEditModal: (id) => set({ isEditModalOpen: true, editingTreeId: id }),
  closeEditModal: () => set({ isEditModalOpen: false, editingTreeId: null }),
  updateTree: async (id, data) => {
    try {
      const updated = await api.updateTree(id, data);
      set((state) => ({
        trees: state.trees.map(t => t.id === id ? updated : t)
      }));
    } catch (error) {
      console.error('Erro ao atualizar árvore:', error);
      throw error;
    }
  },
  createTree: async (data) => {
    try {
      // Tentativa inicial com todos os campos
      const newTree = await api.createTree({ ...data, ativo: true });
      set((state) => ({
        trees: [newTree, ...state.trees]
      }));
    } catch (error: any) {
      console.error('Erro ao criar árvore:', error);
      // Fallback: se o erro for de coluna faltante (fotos), tentamos sem ela
      if (error.message?.includes('fotos') || error.code === 'PGRST204') {
        console.warn('Coluna fotos não encontrada. Tentando inserção simplificada.');
        const { fotos, ...minimalData } = data as any;
        try {
          const recoveryTree = await api.createTree(minimalData);
          set((state) => ({ trees: [recoveryTree, ...state.trees] }));
          return;
        } catch (retryError) {
          throw retryError;
        }
      }
      throw error;
    }
  },

  
  openServiceModal: () => set({ isServiceModalOpen: true }),
  closeServiceModal: () => set({ isServiceModalOpen: false }),
  createService: async (data) => {
    try {
      const { selectedTreeIds } = useAppStore.getState();
      const newService = await api.createService({ ...data, treeIds: selectedTreeIds } as Service);
      set((state) => ({
        services: [newService, ...state.services],
        selectedTreeIds: []
      }));
    } catch (error) {
      console.error('Erro ao criar serviço:', error);
      throw error;
    }
  },

  completeService: async (id, reavaliacao, validade) => {
    try {
      const state = useAppStore.getState();
      const serviceToComplete = state.services.find(s => s.id === id);
      if (!serviceToComplete) return;

      const updatedService = await api.updateService(id, {
        status: 'concluido',
        data_reavaliacao: reavaliacao,
        data_validade_servico: validade
      });

      let newServices = state.services.map(s => s.id === id ? updatedService : s);

      if (reavaliacao) {
        const [datePart, timePart] = reavaliacao.split('T');
        const reavalService = await api.createService({
          treeIds: serviceToComplete.treeIds,
          tipo: 'Avaliação',
          data: datePart,
          horario: timePart || undefined,
          responsavel: serviceToComplete.responsavel,
          status: 'agendado'
        } as Service);
        newServices = [reavalService, ...newServices];
      }

      set({ services: newServices });
    } catch (error) {
      console.error('Erro ao concluir serviço:', error);
      throw error;
    }
  },



  saveLaudo: async (serviceId, laudoData, attachmentsByTree, storagePath) => {
    console.log('Iniciando persistência do laudo...', { serviceId, storagePath });
    try {
      const state = useAppStore.getState();
      const service = state.services.find(s => s.id === serviceId);
      if (!service) {
        console.error('Serviço não encontrado para salvar laudo:', serviceId);
        return;
      }

      const updates: any = {
        laudoGerado: true,
        laudoData,
        attachmentsByTree
      };

      console.log('Atualizando serviço no banco...', updates);
      const updated = await api.updateService(serviceId, updates);
      
      // Mapear risco ISA para risco do Banco
      const riskMapping: Record<string, 'baixo' | 'medio' | 'alto' | 'critico'> = {
        'Extremo': 'critico',
        'Alto': 'alto',
        'Moderado': 'medio',
        'Baixo': 'baixo'
      };
      const dbRisk = riskMapping[laudoData.resultado.classificacaoGeral] || 'baixo';
      console.log('Risco calculado para o banco:', dbRisk);

      // Atualizar todas as árvores associadas no banco e no estado local
      if (service.treeIds && service.treeIds.length > 0) {
        console.log('Sincronizando risco com as árvores:', service.treeIds);
        await Promise.all(service.treeIds.map(tId => api.updateTree(tId, { status_risco: dbRisk })));
        
        set((state) => ({
          services: state.services.map(s => s.id === serviceId ? updated : s),
          trees: state.trees.map(t => service.treeIds.includes(t.id) ? { ...t, status_risco: dbRisk } : t)
        }));
      } else {
        set((state) => ({
          services: state.services.map(s => s.id === serviceId ? updated : s)
        }));
      }
      console.log('Persistência concluída com sucesso.');
    } catch (error) {
      console.error('Erro crítico ao salvar laudo no banco:', error);
      throw error;
    }
  },

  addServiceAttachment: async (serviceId, treeId, attachment) => {
    try {
      const state = useAppStore.getState();
      const service = state.services.find(s => s.id === serviceId);
      if (!service) return;

      const prev = service.attachmentsByTree ?? {};
      const newAttachments = {
        ...prev,
        [treeId]: [...(prev[treeId] ?? []), attachment],
      };

      const updated = await api.updateService(serviceId, { attachmentsByTree: newAttachments });
      set((state) => ({
        services: state.services.map(s => s.id === serviceId ? updated : s)
      }));
    } catch (error) {
      console.error('Erro ao adicionar anexo:', error);
    }
  },


  deactivateTrees: async (treeIds, motivo) => {
    try {
      await Promise.all(treeIds.map(id => api.updateTree(id, { ativo: false, motivo_supressao: motivo })));
      set(state => ({
        trees: state.trees.map(t =>
          treeIds.includes(t.id)
            ? { ...t, ativo: false, motivo_supressao: motivo }
            : t
        )
      }));
    } catch (error) {
      console.error('Erro ao inativar árvores:', error);
      throw error;
    }
  },



  openPostServiceModal: (id) => set({ isPostServiceModalOpen: true, activePostServiceId: id }),
  closePostServiceModal: () => set({ isPostServiceModalOpen: false, activePostServiceId: null }),

  openLaudoModal: (serviceId) => set({ isLaudoModalOpen: true, activeLaudoServiceId: serviceId }),
  closeLaudoModal: () => set({ isLaudoModalOpen: false, activeLaudoServiceId: null }),


  
  openHistoryModal: (id) => set({ isHistoryModalOpen: true, viewingHistoryTreeId: id }),
  closeHistoryModal: () => set({ isHistoryModalOpen: false, viewingHistoryTreeId: null }),

  openTreeDetailsModal: (id) => set({ isTreeDetailsModalOpen: true, viewingTreeDetailsId: id }),
  closeTreeDetailsModal: () => set({ isTreeDetailsModalOpen: false, viewingTreeDetailsId: null }),

  openClientDetailsModal: (id) => set({ isClientDetailsModalOpen: true, viewingClientDetailsId: id }),
  closeClientDetailsModal: () => set({ isClientDetailsModalOpen: false, viewingClientDetailsId: null }),

  openReminderModal: (serviceId) => set({ isReminderModalOpen: true, activeReminderServiceId: serviceId }),
  closeReminderModal: () => set({ isReminderModalOpen: false, activeReminderServiceId: null }),

  openClientModal: (id) => set({ isClientModalOpen: true, editingClientId: id || null }),
  closeClientModal: () => set({ isClientModalOpen: false, editingClientId: null }),
  createClient: async (data) => {
    try {
      const newClient = await api.createClient(data);
      set(state => ({ clients: [newClient, ...state.clients] }));
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      throw error;
    }
  },
  updateClient: async (id, updates) => {
    try {
      const updated = await api.updateClient(id, updates);
      set(state => ({
        clients: state.clients.map(c => c.id === id ? updated : c)
      }));
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      throw error;
    }
  },

  openProfileModal: () => set({ isProfileModalOpen: true }),
  closeProfileModal: () => set({ isProfileModalOpen: false }),
  updateProfile: async (updates) => {
    try {
      const { userProfile } = get();
      if (!userProfile) return;
      
      // No api.ts precisamos do updateProfile
      const updated = await api.updateProfile(userProfile.id, updates);
      set({ userProfile: updated });
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  },

  // Clima
  weatherCity: { name: 'Belo Horizonte, MG', lat: -19.9167, lon: -43.9345 },
  setWeatherCity: (city) => set({ weatherCity: city }),

  // Gestão de Funcionários
  fetchEmployees: async () => {
    try {
      const employees = await api.getEmployees();
      set({ employees });
    } catch (error) {
      console.error('Erro ao buscar funcionários:', error);
    }
  },
  updateEmployee: async (id, data) => {
    try {
      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        employees: state.employees.map(emp => emp.id === id ? updatedProfile : emp)
      }));
    } catch (error: any) {
      console.error('Erro ao atualizar funcionário:', error);
      alert(`Erro ao atualizar: ${error.message}`);
    }
  },
  uploadFile: async (bucket, file) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Tenta usar o bucket fornecido ou fallback para profiles
      const targetBucket = bucket || 'profiles';
      
      const { error: uploadError } = await supabase.storage
        .from(targetBucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Erro no upload de arquivo:', error);
      throw error;
    }
  },
  createEmployee: async (data) => {
    try {
      const { email, password, ...profileData } = data;
      
      // 1. Criar instância temporária para evitar deslogar o Admin
      const { createClient } = await import('@supabase/supabase-js');
      const tempSupabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
          }
        }
      );

      // 2. Criar Usuário no Supabase Auth com metadados para satisfazer triggers do banco
      const { data: authData, error: authError } = await tempSupabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome: profileData.nome,
            full_name: profileData.nome,
            role: profileData.role,
            data_nascimento: profileData.data_nascimento
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Falha ao criar usuário na autenticação.');

      // 3. Criar ou Atualizar Perfil no Banco de Dados
      // Usamos upsert caso um trigger no banco já tenha criado o perfil básico
      const { data: profileResult, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email,
          ...profileData,
          status: 'ativo',
          data_cadastro: new Date().toISOString()
        })
        .select()
        .single();

      if (profileError) {
        console.error('Erro ao salvar perfil no banco:', profileError);
        throw new Error(`Usuário criado no Auth, mas erro no Perfil: ${profileError.message}`);
      }

      set(state => ({ employees: [profileResult, ...state.employees] }));
    } catch (error: any) {
      console.error('Erro ao criar funcionário:', error);
      alert(`Erro ao criar funcionário: ${error.message}`);
      throw error;
    }
  }
  renameAttachment: async (serviceId, treeId, attachmentId, newName) => {
    try {
      const state = get();
      const service = state.services.find(s => s.id === serviceId);
      if (!service || !service.attachmentsByTree) return;

      const treeAttachments = service.attachmentsByTree[treeId] || [];
      const updatedAttachments = treeAttachments.map(att => 
        att.id === attachmentId ? { ...att, name: newName } : att
      );

      const nextAttachmentsByTree = {
        ...service.attachmentsByTree,
        [treeId]: updatedAttachments
      };

      const updated = await api.updateService(serviceId, { attachmentsByTree: nextAttachmentsByTree } as any);
      
      set(state => ({
        services: state.services.map(s => s.id === serviceId ? updated : s)
      }));
    } catch (error) {
      console.error('Erro ao renomear anexo:', error);
      throw error;
    }
  },

  deleteAttachment: async (serviceId, treeId, attachmentId) => {
    try {
      const state = get();
      const service = state.services.find(s => s.id === serviceId);
      if (!service || !service.attachmentsByTree) return;

      const treeAttachments = service.attachmentsByTree[treeId] || [];
      const attachmentToDelete = treeAttachments.find(att => att.id === attachmentId);
      if (!attachmentToDelete) return;

      const updatedAttachments = treeAttachments.filter(att => att.id !== attachmentId);

      const nextAttachmentsByTree = {
        ...service.attachmentsByTree,
        [treeId]: updatedAttachments
      };

      // 1. Remover do Storage se tiver storagePath
      if (attachmentToDelete.storagePath) {
        const bucket = attachmentToDelete.type === 'image' ? 'Gallery' : 'Documents';
        await supabase.storage.from(bucket).remove([attachmentToDelete.storagePath]);
      }

      // 2. Atualizar no banco
      const updated = await api.updateService(serviceId, { attachmentsByTree: nextAttachmentsByTree } as any);
      
      set(state => ({
        services: state.services.map(s => s.id === serviceId ? updated : s)
      }));
    } catch (error) {
      console.error('Erro ao excluir anexo:', error);
      throw error;
    }
  },
}));
