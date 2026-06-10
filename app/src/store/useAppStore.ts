// Trigger Build: 2026-05-12 20:56
import { create } from 'zustand'

import type { User } from 'firebase/auth'

export interface AppUser extends User {
  id: string
  user_metadata?: {
    nome?: string
    full_name?: string
    avatar_url?: string
  }
}

import type { Limitante, ResultadoISA, EntradaRisco } from '../lib/isaRiskEngine'




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

export interface WeatherSettings {
  syncInterval: number // em minutos: 5, 15, 30, 60
  alertsEnabled: boolean
  tempUnit: 'celsius' | 'fahrenheit'
  windSpeedUnit: 'kmh' | 'ms'
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
  weather_settings?: WeatherSettings
}

export interface AuditLog {
  id: string
  user_id: string
  user_name: string
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  entity: string
  details: string
  payload?: Record<string, unknown>
  created_at: string
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

export interface AppNotification {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: 'aviso' | 'critico' | 'recomendacao';
  lida: boolean;
  data_criacao: string;
  acao?: { tipo: 'servicos_hoje' | 'arvores_risco' | 'servicos_atrasados', id?: string };
}


export interface AppState {
  clients: Client[]
  trees: Tree[]
  services: Service[]
  employees: UserProfile[]
  user: AppUser | null
  userProfile: UserProfile | null
  setUser: (user: User | null) => void
  signOut: () => Promise<void>
  
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
  
  notifications: AppNotification[]
  generateNotifications: () => void

  auditLogs: AuditLog[]
  fetchAuditLogs: () => Promise<void>
  logAudit: (action: 'CREATE' | 'UPDATE' | 'DELETE', entity: string, details: string, payload?: Record<string, unknown>) => Promise<void>
  addWeatherNotification: (weatherData: { windspeed: number; weathercode: number }) => void
  markNotificationAsRead: (id: string) => void
  markAllNotificationsAsRead: () => void
  deleteNotification: (id: string) => void

  hoveredTreeId: string | null

  selectedTreeIds: string[]
  
  isEditModalOpen: boolean
  editingTreeId: string | null
  
  isServiceModalOpen: boolean
  editingServiceId: string | null
  
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

  isSettingsModalOpen: boolean
  openSettingsModal: () => void
  closeSettingsModal: () => void

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

  
  openServiceModal: (id?: string) => void
  closeServiceModal: () => void
  createService: (data: Partial<Service>) => Promise<void>
  updateService: (id: string, updates: Partial<Service>) => Promise<void>
  completeService: (id: string, reavaliacao?: string, validade?: string) => Promise<void>
  deleteService: (id: string) => Promise<void>
  deactivateTrees: (treeIds: string[], motivo: string) => Promise<void>
  
  addServiceAttachment: (serviceId: string, treeId: string, attachment: ServiceAttachment) => Promise<void>
  renameAttachment: (serviceId: string, treeId: string, attachmentId: string, newName: string) => Promise<void>
  deleteAttachment: (serviceId: string, treeId: string, attachmentId: string) => Promise<void>

  openPostServiceModal: (id: string) => void
  closePostServiceModal: () => void

  openLaudoModal: (serviceId: string) => void
  closeLaudoModal: () => void
  // Salva o laudo e marca laudoGerado=true no serviço
  saveLaudo: (serviceId: string, laudo: ISALaudoData, attachmentsByTree: Record<string, ServiceAttachment[]>, storagePath?: string) => Promise<void>

  
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
  weatherSettings: WeatherSettings
  updateWeatherSettings: (settings: Partial<WeatherSettings>) => Promise<void>

  fetchEmployees: () => Promise<void>
  createEmployee: (data: Partial<UserProfile> & { id: string; password?: string }) => Promise<void>
  updateEmployee: (id: string, data: Partial<UserProfile>) => Promise<void>
  uploadFile: (bucket: string, file: File) => Promise<string>
}
import { createAuthSlice } from './slices/authSlice';
import { createUISlice } from './slices/uiSlice';
import { createDataSlice } from './slices/dataSlice';

export const useAppStore = create<AppState>((set, get, api) => ({
  ...createAuthSlice(set, get, api),
  ...createUISlice(set, get, api),
  ...createDataSlice(set, get, api),
}));
