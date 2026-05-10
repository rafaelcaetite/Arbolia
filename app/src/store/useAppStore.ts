import { create } from 'zustand'

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
}

interface AppState {
  clients: Client[]
  trees: Tree[]
  services: Service[]
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

  mapBounds: MapBounds | null
  setMapBounds: (bounds: MapBounds | null) => void

  isMapPickingMode: boolean
  pickedCoordinates: { lat: number, lng: number } | null
  startMapPicking: () => void
  cancelMapPicking: () => void
  finishMapPicking: (lat: number, lng: number) => void
  clearPickedCoordinates: () => void
  
  setClients: (clients: Client[]) => void
  setTrees: (trees: Tree[]) => void
  setServices: (services: Service[]) => void
  setHoveredTreeId: (id: string | null) => void
  toggleTreeSelection: (id: string) => void
  clearSelection: () => void
  
  openEditModal: (id: string | null) => void
  closeEditModal: () => void
  updateTree: (id: string, data: Partial<Tree>) => void
  createTree: (data: Omit<Tree, 'id' | 'data_cadastro'>) => void
  
  openServiceModal: () => void
  closeServiceModal: () => void
  createService: (data: Omit<Service, 'id' | 'treeIds'>) => void
  completeService: (id: string, reavaliacao?: string, validade?: string) => void
  deactivateTrees: (treeIds: string[], motivo: string) => void
  
  addServiceAttachment: (serviceId: string, treeId: string, attachment: ServiceAttachment) => void

  openPostServiceModal: (id: string) => void
  closePostServiceModal: () => void
  
  openHistoryModal: (treeId: string) => void
  closeHistoryModal: () => void

  openTreeDetailsModal: (id: string) => void
  closeTreeDetailsModal: () => void

  openClientDetailsModal: (id: string) => void
  closeClientDetailsModal: () => void

  openReminderModal: (serviceId: string) => void
  closeReminderModal: () => void
}

export const useAppStore = create<AppState>((set) => ({
  clients: [],
  trees: [],
  services: [],
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

  mapBounds: null,
  setMapBounds: (bounds) => set({ mapBounds: bounds }),

  isMapPickingMode: false,
  pickedCoordinates: null,
  startMapPicking: () => set({ isMapPickingMode: true }),
  cancelMapPicking: () => set({ isMapPickingMode: false }),
  finishMapPicking: (lat, lng) => set({ isMapPickingMode: false, pickedCoordinates: { lat, lng } }),
  clearPickedCoordinates: () => set({ pickedCoordinates: null }),

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
  updateTree: (id, data) => set((state) => ({
    trees: state.trees.map(t => t.id === id ? { ...t, ...data } : t)
  })),
  createTree: (data) => set((state) => ({
    trees: [
      { 
        ...data, 
        id: `tree-${Date.now()}`, 
        data_cadastro: new Date().toISOString() 
      } as Tree,
      ...state.trees
    ]
  })),
  
  openServiceModal: () => set({ isServiceModalOpen: true }),
  closeServiceModal: () => set({ isServiceModalOpen: false }),
  createService: (data) => set((state) => ({
    services: [
      { ...data, id: `svc-${Date.now()}`, treeIds: state.selectedTreeIds } as Service,
      ...state.services
    ],
    selectedTreeIds: [] // Limpa seleção após agendamento
  })),
  completeService: (id, reavaliacao, validade) => set((state) => {
    const serviceToComplete = state.services.find(s => s.id === id);
    
    let newServices = state.services.map(s => s.id === id ? { 
      ...s, 
      status: 'concluido' as const,
      data_reavaliacao: reavaliacao,
      data_validade_servico: validade
    } : s);

    if (reavaliacao && serviceToComplete) {
      const [datePart, timePart] = reavaliacao.split('T');
      newServices = [
        {
          id: `svc-reav-${Date.now()}`,
          treeIds: serviceToComplete.treeIds,
          tipo: 'Avaliação',
          data: datePart,
          horario: timePart || undefined,
          responsavel: serviceToComplete.responsavel,
          status: 'agendado'
        },
        ...newServices
      ];
    }

    return { services: newServices };
  }),

  addServiceAttachment: (serviceId, treeId, attachment) => set(state => ({
    services: state.services.map(s => {
      if (s.id !== serviceId) return s;
      const prev = s.attachmentsByTree ?? {};
      return {
        ...s,
        attachmentsByTree: {
          ...prev,
          [treeId]: [...(prev[treeId] ?? []), attachment],
        },
      };
    })
  })),

  deactivateTrees: (treeIds, motivo) => set(state => ({
    trees: state.trees.map(t =>
      treeIds.includes(t.id)
        ? { ...t, ativo: false, motivo_supressao: motivo }
        : t
    )
  })),

  openPostServiceModal: (id) => set({ isPostServiceModalOpen: true, activePostServiceId: id }),
  closePostServiceModal: () => set({ isPostServiceModalOpen: false, activePostServiceId: null }),
  
  openHistoryModal: (id) => set({ isHistoryModalOpen: true, viewingHistoryTreeId: id }),
  closeHistoryModal: () => set({ isHistoryModalOpen: false, viewingHistoryTreeId: null }),

  openTreeDetailsModal: (id) => set({ isTreeDetailsModalOpen: true, viewingTreeDetailsId: id }),
  closeTreeDetailsModal: () => set({ isTreeDetailsModalOpen: false, viewingTreeDetailsId: null }),

  openClientDetailsModal: (id) => set({ isClientDetailsModalOpen: true, viewingClientDetailsId: id }),
  closeClientDetailsModal: () => set({ isClientDetailsModalOpen: false, viewingClientDetailsId: null }),

  openReminderModal: (serviceId) => set({ isReminderModalOpen: true, activeReminderServiceId: serviceId }),
  closeReminderModal: () => set({ isReminderModalOpen: false, activeReminderServiceId: null })
}))
