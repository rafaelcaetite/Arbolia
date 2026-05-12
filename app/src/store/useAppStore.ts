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
  data_cadastro: string
}

export interface MapBounds {
  south: number
  west: number
  north: number
  east: number
}

export interface Tree {
  id: string
  cliente_id?: string
  especie: string
  altura: number
  tamanho_copa: number
  latitude: number
  longitude: number
  status_risco: 'baixo' | 'medio' | 'alto' | 'critico'
  data_cadastro: string
  codigo_v6?: number         // Código sequencial gerado pelo banco
  ativo?: boolean            // false = suprimida

  motivo_supressao?: string  // Motivo registrado na conclusão do serviço
}

export interface ServiceAttachment {
  id: string
  name: string
  type: 'pdf' | 'image'
  dataUrl: string   // Base64 data URL para persistência local
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


  openPostServiceModal: (id: string) => void
  closePostServiceModal: () => void

  openLaudoModal: (serviceId: string) => void
  closeLaudoModal: () => void
  // Salva o laudo e marca laudoGerado=true no serviço
  saveLaudo: (serviceId: string, laudo: ISALaudoData) => Promise<void>

  
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

  // Gestão de Funcionários
  fetchEmployees: () => Promise<void>
  createEmployee: (data: any) => Promise<void>
}

export const useAppStore = create<AppState>((set, get) => ({
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
    }
  },
  createTree: async (data) => {
    try {
      const newTree = await api.createTree(data);
      set((state) => ({
        trees: [newTree, ...state.trees]
      }));
    } catch (error) {
      console.error('Erro ao criar árvore:', error);
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
  saveLaudo: async (serviceId, laudo) => {
    try {
      const updated = await api.updateService(serviceId, { laudoGerado: true, laudoData: laudo });
      set(state => ({
        services: state.services.map(s => s.id === serviceId ? updated : s)
      }));
    } catch (error) {
      console.error('Erro ao salvar laudo:', error);
    }
  },

  
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
  createEmployee: async (data) => {
    try {
      // 1. Criar no Auth via API customizada ou Edge Function (em produção)
      // Por simplicidade no dev, criamos no banco profiles (o Auth exigiria admin key)
      const newEmployee = await api.createEmployee(data);
      set(state => ({ employees: [newEmployee, ...state.employees] }));
    } catch (error) {
      console.error('Erro ao criar funcionário:', error);
      throw error;
    }
  }
}))
