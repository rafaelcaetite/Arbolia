// Trigger Build: 2026-05-12 20:56
import { create } from 'zustand'
import { auth, storage } from '../lib/firebase'
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
  payload?: Record<string, any>
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


interface AppState {
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
  logAudit: (action: 'CREATE' | 'UPDATE' | 'DELETE', entity: string, details: string, payload?: Record<string, any>) => Promise<void>
  addWeatherNotification: (weatherData: any) => void
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
  weatherSettings: WeatherSettings
  updateWeatherSettings: (settings: Partial<WeatherSettings>) => Promise<void>

  fetchEmployees: () => Promise<void>
  createEmployee: (data: any) => Promise<void>
  updateEmployee: (id: string, data: any) => Promise<void>
  uploadFile: (bucket: string, file: File) => Promise<string>
}const getLocalArray = (key: string): string[] => {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
};
const addLocalId = (key: string, id: string) => {
  const arr = getLocalArray(key);
  if (!arr.includes(id)) { arr.push(id); localStorage.setItem(key, JSON.stringify(arr)); }
};

const calculateDiff = (oldObj: any, newObj: any) => {
  const ignoreKeys = ['id', 'created_at', 'updated_at', 'data_cadastro', 'ativo', 'treeIds'];
  const diff: Record<string, { old: any; new: any }> = {};
  if (!oldObj || !newObj) return diff;
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

export const useAppStore = create<AppState>((set, get) => {
  const savedTheme = (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  
  return {
  // ... (existing state)
  // (Note: I will only replace the implementation of updateEmployee and relevant parts)
  clients: [],
  trees: [],
  services: [],
  employees: [],
  user: null,
  userProfile: null,
  
  theme: savedTheme,
  setTheme: (theme: 'light' | 'dark') => {
    localStorage.setItem('theme', theme);
    set({ theme });
  },

  weatherSettings: {
    syncInterval: 30,
    alertsEnabled: true,
    tempUnit: 'celsius',
    windSpeedUnit: 'kmh'
  },

  setUser: (firebaseUser) => {
    if (!firebaseUser) {
      set({ user: null });
      return;
    }
    const mappedUser = {
      ...firebaseUser,
      id: firebaseUser.uid,
      user_metadata: {
        nome: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário',
        full_name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário',
      }
    };
    set({ user: mappedUser as any });
  },
  signOut: async () => {
    const { signOut: firebaseSignOut } = await import('firebase/auth');
    await firebaseSignOut(auth);
    set({
      user: null,
      userProfile: null,
      clients: [],
      trees: [],
      services: [],
      employees: [],
      notifications: [],
      weatherCity: { name: 'Belo Horizonte, MG', lat: -19.9167, lon: -43.9345 },
      weatherSettings: {
        syncInterval: 30,
        alertsEnabled: true,
        tempUnit: 'celsius',
        windSpeedUnit: 'kmh'
      }
    });
  },

  notifications: [],
  
  auditLogs: [],
  fetchAuditLogs: async () => {
    try {
      const logs = await api.getAuditLogs();
      set({ auditLogs: logs });
    } catch (e) {
      console.error('Erro ao carregar audit logs:', e);
    }
  },
  logAudit: async (action, entity, details, payload) => {
    try {
      const state = get();
      if (!state.userProfile) return;
      await api.createAuditLog({
        user_id: state.userProfile.id,
        user_name: state.userProfile.nome,
        action,
        entity,
        details,
        payload
      });
      if (state.userProfile.role === 'admin') {
        get().fetchAuditLogs();
      }
    } catch (e) {
      console.error('Erro ao registrar log:', e);
    }
  },

  generateNotifications: () => {
    const { services, notifications: existingNotifications } = get();
    const today = new Date().toISOString().split('T')[0];
    
    const readIds = getLocalArray('arbolia_read_notifs');
    const deletedIds = getLocalArray('arbolia_deleted_notifs');

    // 1. Manter notificações que NÃO são geradas automaticamente por data (como alertas climáticos)
    const preservedNotifications = existingNotifications.filter(
      n => !n.id.startsWith('hoje-') && !n.id.startsWith('atrasados-') && !deletedIds.includes(n.id)
    );

    const newNotifications: AppNotification[] = [];

    // Helper para verificar se a notificação já existia e estava marcada como lida
    const isAlreadyRead = (id: string) => {
      const existing = existingNotifications.find(n => n.id === id);
      return (existing && existing.lida) || readIds.includes(id);
    };

    // 2. Serviços de Hoje
    const servicosHoje = services.filter(s => s.data === today && s.status !== 'concluido');
    if (servicosHoje.length > 0) {
      const id = `hoje-${today}`;
      if (!deletedIds.includes(id)) {
        newNotifications.push({
          id,
          titulo: 'Alertas do Dia',
          mensagem: `Você tem ${servicosHoje.length} serviço(s) agendados para hoje.`,
          tipo: 'aviso',
          lida: isAlreadyRead(id),
          data_criacao: new Date().toISOString(),
          acao: { tipo: 'servicos_hoje' }
        });
      }
    }

    // 3. Serviços Atrasados
    const servicosAtrasados = services.filter(s => s.status === 'atrasado');
    if (servicosAtrasados.length > 0) {
      const id = `atrasados-${today}`;
      if (!deletedIds.includes(id)) {
        newNotifications.push({
          id,
          titulo: 'Alerta Crítico',
          mensagem: `Existem ${servicosAtrasados.length} serviços em atraso no sistema.`,
          tipo: 'critico',
          lida: isAlreadyRead(id),
          data_criacao: new Date().toISOString(),
          acao: { tipo: 'servicos_atrasados' }
        });
      }
    }

    set({ notifications: [...newNotifications, ...preservedNotifications] });
  },
  addWeatherNotification: (weatherData: any) => {
    const { notifications, weatherSettings } = get();
    
    // Evita gerar notificações de clima se o alarme estiver desabilitado nas configurações
    if (!weatherSettings.alertsEnabled) return;

    const today = new Date().toISOString().split('T')[0];
    const weatherId = `weather-${today}`;
    
    const deletedIds = getLocalArray('arbolia_deleted_notifs');
    const readIds = getLocalArray('arbolia_read_notifs');

    // Evita duplicar ou recriar deletada
    if (deletedIds.includes(weatherId)) return;
    if (notifications.some(n => n.id === weatherId)) return;

    let mensagem = null;
    let titulo = 'Recomendação Climática';
    let tipo: 'aviso' | 'recomendacao' | 'critico' = 'recomendacao';

    // Windspeed da API
    const wind = weatherData.windspeed;
    const code = weatherData.weathercode;

    // Códigos Open-Meteo: Chuva (61, 63, 65, 80, 81, 82), Tempestade (95, 96, 99)
    const isRaining = [61, 63, 65, 80, 81, 82].includes(code);
    const isStorming = [95, 96, 99].includes(code);

    // Limites de vento baseados na escala configurada (m/s vs km/h)
    const isMs = weatherSettings.windSpeedUnit === 'ms';
    const limitCritical = isMs ? 11.1 : 40; // 40 km/h = 11.1 m/s
    const limitWarning = isMs ? 5.6 : 20;  // 20 km/h = 5.56 m/s
    const unitLabel = isMs ? ' m/s' : ' km/h';

    if (isStorming || wind > limitCritical) {
      titulo = 'Alerta Climático Crítico';
      mensagem = `Condições perigosas detectadas (Ventos de ${wind}${unitLabel} ou Tempestade). Recomendamos suspender o trabalho em altura e poda com motosserras.`;
      tipo = 'critico';
    } else if (isRaining || wind > limitWarning) {
      mensagem = `Condições instáveis (Chuva ou ventos de ${wind}${unitLabel}). Avalie com cautela a segurança para realização de podas hoje.`;
      tipo = 'aviso';
    } else {
      mensagem = 'Condições climáticas favoráveis para serviços de poda e supressão hoje.';
      tipo = 'recomendacao';
    }

    if (mensagem) {
      set({
        notifications: [
          {
            id: weatherId,
            titulo,
            mensagem,
            tipo,
            lida: readIds.includes(weatherId),
            data_criacao: new Date().toISOString(),
          },
          ...notifications
        ]
      });
    }
  },
  markNotificationAsRead: (id) => {
    addLocalId('arbolia_read_notifs', id);
    set(state => ({
      notifications: state.notifications.map(n => n.id === id ? { ...n, lida: true } : n)
    }));
  },
  markAllNotificationsAsRead: () => {
    const { notifications } = get();
    const readIds = getLocalArray('arbolia_read_notifs');
    notifications.forEach(n => {
      if (!readIds.includes(n.id)) readIds.push(n.id);
    });
    localStorage.setItem('arbolia_read_notifs', JSON.stringify(readIds));

    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, lida: true }))
    }));
  },
  deleteNotification: (id) => {
    addLocalId('arbolia_deleted_notifs', id);
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }));
  },

  hoveredTreeId: null,
  selectedTreeIds: [],
  
  isEditModalOpen: false,
  editingTreeId: null,
  
  isServiceModalOpen: false,
  editingServiceId: null,
  
  isHistoryModalOpen: false,
  viewingHistoryTreeId: null,

  isTreeDetailsModalOpen: false,
  viewingTreeDetailsId: null,

  isClientDetailsModalOpen: false,
  viewingClientDetailsId: null,

  isReminderModalOpen: false,
  activeReminderServiceId: null,

  isSettingsModalOpen: false,

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

      // Carrega a última cidade escolhida por este usuário específico, se houver
      const savedCity = localStorage.getItem(`arbolia_weather_city_${user.id}`);
      if (savedCity) {
        try {
          const parsed = JSON.parse(savedCity);
          if (parsed && parsed.name && parsed.lat && parsed.lon) {
            set({ weatherCity: parsed });
          }
        } catch (e) {
          console.error('Erro ao decodificar cidade persistida:', e);
        }
      }

      // Carrega as configurações de clima por usuário do localStorage como primeiro passo rápido
      const savedSettings = localStorage.getItem(`arbolia_weather_settings_${user.id}`);
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          if (parsed) {
            set({ weatherSettings: { ...get().weatherSettings, ...parsed } });
          }
        } catch (e) {
          console.error('Erro ao decodificar configurações de clima persistidas:', e);
        }
      }

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
        if (profile.weather_settings) {
          set({ weatherSettings: profile.weather_settings });
          localStorage.setItem(`arbolia_weather_settings_${user.id}`, JSON.stringify(profile.weather_settings));
        }
      }

      // 3. Carrega os dados principais
      const [clients, trees, services] = await Promise.all([
        api.getClients(),
        api.getTrees(),
        api.getServices()
      ]);
      
      set({ clients, trees, services });
      get().generateNotifications();

      // 4. Carrega funcionários para todos os perfis (necessário para exibição de CREA e atribuição de técnicos)
      const employees = await api.getEmployees();
      set({ employees });
    } catch (error) {
      console.error('Erro ao carregar dados do Firebase:', error);
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
      const oldTree = get().trees.find(t => t.id === id);
      const updated = await api.updateTree(id, data);
      set((state) => ({
        trees: state.trees.map(t => t.id === id ? updated : t)
      }));
      
      const diff = calculateDiff(oldTree, data);
      if (diff) {
        get().logAudit('UPDATE', 'Árvore', `Atualizou dados da árvore #${id.slice(0, 8)}`, diff);
      }
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
      get().logAudit('CREATE', 'Árvore', `Cadastrou nova árvore #${newTree.id.slice(0, 8)} (${newTree.especie})`, data);
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

  
  openServiceModal: (id) => set({ isServiceModalOpen: true, editingServiceId: id || null }),
  closeServiceModal: () => set({ isServiceModalOpen: false, editingServiceId: null }),
  createService: async (data) => {
    try {
      const { selectedTreeIds } = useAppStore.getState();
      const newService = await api.createService({ ...data, treeIds: selectedTreeIds } as Service);
      set((state) => ({
        services: [newService, ...state.services],
        selectedTreeIds: []
      }));
      get().logAudit('CREATE', 'Atendimento', `Criou agendamento de ${newService.tipo} para ${selectedTreeIds.length} árvore(s)`, data);
    } catch (error) {
      console.error('Erro ao criar serviço:', error);
      throw error;
    }
  },
  updateService: async (id, updates) => {
    try {
      const oldService = get().services.find(s => s.id === id);
      const updated = await api.updateService(id, updates);
      set((state) => ({
        services: state.services.map(s => s.id === id ? updated : s)
      }));
      
      const diff = calculateDiff(oldService, updates);
      if (diff) {
        get().logAudit('UPDATE', 'Atendimento', `Atualizou atendimento #${id.slice(0, 8)} (${updated.tipo})`, diff);
      }
    } catch (error) {
      console.error('Erro ao atualizar serviço:', error);
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
      get().logAudit('UPDATE', 'Atendimento', `Concluiu atendimento #${id.slice(0, 8)}`, { status: 'concluido', data_reavaliacao: reavaliacao, data_validade_servico: validade });
    } catch (error) {
      console.error('Erro ao concluir serviço:', error);
      throw error;
    }
  },

  deleteService: async (id) => {
    try {
      await api.deleteService(id);
      set((state) => ({
        services: state.services.filter(s => s.id !== id)
      }));
      get().logAudit('DELETE', 'Atendimento', `Excluiu atendimento #${id.slice(0, 8)}`, { id });
      get().generateNotifications();
    } catch (error) {
      console.error('Erro ao excluir serviço:', error);
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
      get().logAudit('DELETE', 'Árvore', `Inativou/Suprimiu ${treeIds.length} árvore(s). Motivo: ${motivo.slice(0, 30)}...`, { treeIds, motivo });
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
      get().logAudit('CREATE', 'Cliente', `Cadastrou novo cliente: ${newClient.nome}`, data);
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      throw error;
    }
  },
  updateClient: async (id, updates) => {
    try {
      const oldClient = get().clients.find(c => c.id === id);
      const updated = await api.updateClient(id, updates);
      set(state => ({
        clients: state.clients.map(c => c.id === id ? updated : c)
      }));

      const diff = calculateDiff(oldClient, updates);
      if (diff) {
        get().logAudit('UPDATE', 'Cliente', `Atualizou dados do cliente: ${updated.nome}`, diff);
      }
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
      
      const updated = await api.updateProfile(userProfile.id, updates);
      set(state => ({
        userProfile: updated,
        employees: state.employees.map(emp => emp.id === userProfile.id ? updated : emp)
      }));
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  },

  // Clima
  weatherCity: { name: 'Belo Horizonte, MG', lat: -19.9167, lon: -43.9345 },
  setWeatherCity: (city) => {
    const { user } = get();
    if (user) {
      localStorage.setItem(`arbolia_weather_city_${user.id}`, JSON.stringify(city));
    }
    set({ weatherCity: city });
  },
  updateWeatherSettings: async (settings) => {
    const { user, weatherSettings, userProfile } = get();
    const newSettings = { ...weatherSettings, ...settings };
    set({ weatherSettings: newSettings });

    if (user) {
      // Persistência local rápida (offline-first)
      localStorage.setItem(`arbolia_weather_settings_${user.id}`, JSON.stringify(newSettings));
      
      // Persistência remota assíncrona no Firebase
      if (userProfile) {
        try {
          const updatedProfile = await api.updateProfile(userProfile.id, {
            weather_settings: newSettings
          });
          set({ userProfile: updatedProfile });
        } catch (dbError) {
          console.warn('Erro ao salvar configurações de clima no banco, usando fallback local:', dbError);
          // Falha graciosamente em ambiente sandbox/offline
        }
      }
    }
  },

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
      const { userProfile } = get();
      const updatedProfile = await api.updateProfile(id, data);
      set(state => {
        const nextState: any = {
          employees: state.employees.map(emp => emp.id === id ? updatedProfile : emp)
        };
        if (userProfile && id === userProfile.id) {
          nextState.userProfile = updatedProfile;
        }
        return nextState;
      });
    } catch (error: any) {
      console.error('Erro ao atualizar funcionário:', error);
      alert(`Erro ao atualizar: ${error.message}`);
    }
  },
  uploadFile: async (bucket, file) => {
    try {
      const { compressImageToBase64, readFileToBase64 } = await import('../lib/imageCompression');
      
      let dataUrl = '';
      if (file.type.startsWith('image/')) {
        // Se for imagem de perfil, 300px max. Caso contrário (galeria) 1200px max.
        const isProfile = bucket === 'profiles' || bucket === 'Profiles';
        const maxDimension = isProfile ? 300 : 1200;
        const quality = isProfile ? 0.8 : 0.75;
        dataUrl = await compressImageToBase64(file, maxDimension, quality);
      } else {
        dataUrl = await readFileToBase64(file);
      }
      
      return dataUrl;
    } catch (error) {
      console.error('Erro no upload/conversão de arquivo:', error);
      throw error;
    }
  },
  createEmployee: async (data) => {
    try {
      const { email, password, ...profileData } = data;

      // 1. Criar app temporário para registrar o funcionário sem deslogar o Admin atual
      const { initializeApp } = await import('firebase/app');
      const { initializeAuth, inMemoryPersistence, createUserWithEmailAndPassword, signOut: tempSignOut } = await import('firebase/auth');

      const firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'mock-key',
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'mock.firebaseapp.com',
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'mock-project-id',
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'mock-bucket.appspot.com',
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
        appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789:web:mockid'
      };

      const tempApp = initializeApp(firebaseConfig, `TempApp-${Date.now()}`);
      const tempAuth = initializeAuth(tempApp, {
        persistence: inMemoryPersistence
      });

      const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
      const newUid = userCredential.user.uid;

      // Desloga do app temporário
      await tempSignOut(tempAuth);

      // 2. Criar perfil no Firestore
      const profileResult = await api.createEmployee({
        id: newUid,
        email,
        ...profileData,
        status: 'ativo',
        data_cadastro: new Date().toISOString()
      });

      set(state => ({ employees: [profileResult, ...state.employees] }));
    } catch (error: any) {
      console.error('Erro ao criar funcionário:', error);
      alert(`Erro ao criar funcionário: ${error.message}`);
      throw error;
    }
  },
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
        const { ref, deleteObject } = await import('firebase/storage');
        const fileRef = ref(storage, `${bucket}/${attachmentToDelete.storagePath}`);
        await deleteObject(fileRef).catch(err => console.warn('Erro ao deletar arquivo no Storage:', err));
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

  openSettingsModal: () => set({ isSettingsModalOpen: true }),
  closeSettingsModal: () => set({ isSettingsModalOpen: false }),
};
});
