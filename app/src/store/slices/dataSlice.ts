import type { AppSlice } from './types';
import type { AppState, Tree, Service, AppNotification } from '../useAppStore';
import { api } from '../../services/api';
import { getLocalArray, addLocalId, calculateDiff } from '../utils';

export type DataSliceType = Pick<AppState,
  'clients' | 'trees' | 'services' | 'notifications' |
  'generateNotifications' | 'addWeatherNotification' |
  'markNotificationAsRead' | 'markAllNotificationsAsRead' | 'deleteNotification' |
  'initializeData' |
  'setClients' | 'setTrees' | 'setServices' |
  'updateTree' | 'createTree' | 'deactivateTrees' |
  'createService' | 'updateService' | 'completeService' | 'deleteService' | 'deactivateTrees' | 'deleteService' |
  'addServiceAttachment' | 'renameAttachment' | 'deleteAttachment' |
  'saveLaudo' |
  'createClient' | 'updateClient'
>;

export const createDataSlice: AppSlice<DataSliceType> = (set, get) => ({
  clients: [],
  trees: [],
  services: [],
  notifications: [],

  generateNotifications: () => {
    const { services, notifications: existingNotifications } = get();
    const today = new Date().toISOString().split('T')[0];
    
    const readIds = getLocalArray('arbolia_read_notifs');
    const deletedIds = getLocalArray('arbolia_deleted_notifs');

    const preservedNotifications = existingNotifications.filter(
      n => !n.id.startsWith('hoje-') && !n.id.startsWith('atrasados-') && !deletedIds.includes(n.id)
    );

    const newNotifications: AppNotification[] = [];

    const isAlreadyRead = (id: string) => {
      const existing = existingNotifications.find(n => n.id === id);
      return (existing && existing.lida) || readIds.includes(id);
    };

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

  addWeatherNotification: (weatherData) => {
    const { notifications, weatherSettings } = get();
    if (!weatherSettings.alertsEnabled) return;

    const today = new Date().toISOString().split('T')[0];
    const weatherId = `weather-${today}`;
    
    const deletedIds = getLocalArray('arbolia_deleted_notifs');
    const readIds = getLocalArray('arbolia_read_notifs');

    if (deletedIds.includes(weatherId)) return;
    if (notifications.some(n => n.id === weatherId)) return;

    let mensagem: string;
    let titulo: string;
    let tipo: 'aviso' | 'recomendacao' | 'critico';

    const wind = weatherData.windspeed;
    const code = weatherData.weathercode;

    const isRaining = [61, 63, 65, 80, 81, 82].includes(code);
    const isStorming = [95, 96, 99].includes(code);

    const isMs = weatherSettings.windSpeedUnit === 'ms';
    const limitCritical = isMs ? 11.1 : 40;
    const limitWarning = isMs ? 5.6 : 20;
    const unitLabel = isMs ? ' m/s' : ' km/h';

    if (isStorming || wind > limitCritical) {
      titulo = 'Alerta Climático Crítico';
      mensagem = `Condições perigosas detectadas (Ventos de ${wind}${unitLabel} ou Tempestade). Recomendamos suspender o trabalho em altura e poda com motosserras.`;
      tipo = 'critico';
    } else if (isRaining || wind > limitWarning) {
      titulo = 'Recomendação Climática';
      mensagem = `Condições instáveis (Chuva ou ventos de ${wind}${unitLabel}). Avalie com cautela a segurança para realização de podas hoje.`;
      tipo = 'aviso';
    } else {
      titulo = 'Recomendação Climática';
      mensagem = 'Condições climáticas favoráveis para serviços de poda e supressão hoje.';
      tipo = 'recomendacao';
    }

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

  initializeData: async () => {
    try {
      const { user } = get();
      if (!user) return;

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

      let profile;
      try {
        profile = await api.getProfile(user.id);
      } catch {
        console.log('Perfil não encontrado, tentando criar auto-perfil...');
        try {
          profile = await api.createEmployee({
            id: user.id,
            nome: user.user_metadata?.nome || user.email?.split('@')[0] || 'Administrador',
            email: user.email || '',
            role: 'admin',
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

      const [clients, trees, services] = await Promise.all([
        api.getClients(),
        api.getTrees(),
        api.getServices()
      ]);
      
      set({ clients, trees, services });
      get().generateNotifications();

      const employees = await api.getEmployees();
      set({ employees });
    } catch (error) {
      console.error('Erro ao carregar dados do Firebase:', error);
    }
  },

  setClients: (clients) => set({ clients }),
  setTrees: (trees) => set({ trees }),
  setServices: (services) => set({ services }),

  updateTree: async (id, data) => {
    try {
      const oldTree = get().trees.find(t => t.id === id);
      const updated = await api.updateTree(id, data);
      set((state) => ({
        trees: state.trees.map(t => t.id === id ? updated : t)
      }));
      
      const diff = calculateDiff(oldTree as unknown as Record<string, unknown>, data as unknown as Record<string, unknown>);
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
      const newTree = await api.createTree({ ...data, ativo: true });
      set((state) => ({
        trees: [newTree, ...state.trees]
      }));
      get().logAudit('CREATE', 'Árvore', `Cadastrou nova árvore #${newTree.id.slice(0, 8)} (${newTree.especie})`, data as unknown as Record<string, unknown>);
    } catch (err) {
      const error = err as Error & { code?: string };
      console.error('Erro ao criar árvore:', error);
      if (error.message?.includes('fotos') || error.code === 'PGRST204') {
        console.warn('Coluna fotos não encontrada. Tentando inserção simplificada.');
        const minimalData = { ...data };
        delete minimalData.fotos;
        const recoveryTree = await api.createTree(minimalData as Omit<Tree, 'id' | 'data_cadastro'>);
        set((state) => ({ trees: [recoveryTree, ...state.trees] }));
        return;
      }
      throw error;
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

  createService: async (data) => {
    try {
      const { selectedTreeIds } = get();
      const newService = await api.createService({ ...data, treeIds: selectedTreeIds } as Service);
      set((state) => ({
        services: [newService, ...state.services],
        selectedTreeIds: []
      }));
      get().logAudit('CREATE', 'Atendimento', `Criou agendamento de ${newService.tipo} para ${selectedTreeIds.length} árvore(s)`, data as unknown as Record<string, unknown>);
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
      
      const diff = calculateDiff(oldService as unknown as unknown as Record<string, unknown>, updates as unknown as unknown as Record<string, unknown>);
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
      const state = get();
      const serviceToComplete = state.services.find(s => s.id === id);
      if (!serviceToComplete) return;

      const updateData: any = { status: 'concluido' };
      if (reavaliacao) updateData.data_reavaliacao = reavaliacao;
      if (validade) updateData.data_validade_servico = validade;

      const updatedService = await api.updateService(id, updateData);

      let newServices = state.services.map(s => s.id === id ? updatedService : s);

      if (reavaliacao) {
        const [datePart, timePart] = reavaliacao.split('T');
        const newServiceData: any = {
          treeIds: serviceToComplete.treeIds,
          tipo: 'Avaliação',
          data: datePart,
          responsavel: serviceToComplete.responsavel,
          status: 'agendado'
        };
        if (timePart) newServiceData.horario = timePart;

        const reavalService = await api.createService(newServiceData as Service);
        newServices = [reavalService, ...newServices];
      }

      set({ services: newServices });
      get().logAudit('UPDATE', 'Atendimento', `Concluiu atendimento #${id.slice(0, 8)}`, updateData);
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

  saveLaudo: async (serviceId, laudoData, attachmentsByTree) => {
    try {
      const state = get();
      const service = state.services.find(s => s.id === serviceId);
      if (!service) return;

      const updates = JSON.parse(JSON.stringify({
        laudoGerado: true,
        laudoData,
        attachmentsByTree
      })) as Partial<Service>;

      const updated = await api.updateService(serviceId, updates);
      
      const riskMapping: Record<string, 'baixo' | 'medio' | 'alto' | 'critico'> = {
        'Extremo': 'critico',
        'Alto': 'alto',
        'Moderado': 'medio',
        'Baixo': 'baixo'
      };
      const dbRisk = riskMapping[laudoData.resultado.classificacaoGeral] || 'baixo';

      if (service.treeIds && service.treeIds.length > 0) {
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
    } catch (error) {
      console.error('Erro crítico ao salvar laudo no banco:', error);
      throw error;
    }
  },

  addServiceAttachment: async (serviceId, treeId, attachment) => {
    try {
      const state = get();
      const service = state.services.find(s => s.id === serviceId);
      if (!service) return;

      const prev = service.attachmentsByTree ?? {};
      const newAttachments = {
        ...prev,
        [treeId]: [...(prev[treeId] ?? []), attachment],
      };

      // Sanitiza para remover valores não-serializáveis antes de enviar ao Firestore
      const sanitized = JSON.parse(JSON.stringify({ attachmentsByTree: newAttachments }));
      const updated = await api.updateService(serviceId, sanitized);
      set((state) => ({
        services: state.services.map(s => s.id === serviceId ? updated : s)
      }));
    } catch (error) {
      console.error('Erro ao adicionar anexo:', error);
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

      const updated = await api.updateService(serviceId, { attachmentsByTree: nextAttachmentsByTree } as Partial<Service>);
      
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

      if (attachmentToDelete.storagePath) {
        const { deleteFromStorage } = await import('../../services/storageService');
        await deleteFromStorage(attachmentToDelete.storagePath);
      }

      const updated = await api.updateService(serviceId, { attachmentsByTree: nextAttachmentsByTree } as Partial<Service>);
      
      set(state => ({
        services: state.services.map(s => s.id === serviceId ? updated : s)
      }));
    } catch (error) {
      console.error('Erro ao excluir anexo:', error);
      throw error;
    }
  },

  createClient: async (data) => {
    try {
      const newClient = await api.createClient(data);
      set(state => ({ clients: [newClient, ...state.clients] }));
      get().logAudit('CREATE', 'Cliente', `Cadastrou novo cliente: ${newClient.nome}`, data as unknown as Record<string, unknown>);
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

      const diff = calculateDiff(oldClient as unknown as unknown as Record<string, unknown>, updates as unknown as unknown as Record<string, unknown>);
      if (diff) {
        get().logAudit('UPDATE', 'Cliente', `Atualizou dados do cliente: ${updated.nome}`, diff);
      }
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      throw error;
    }
  },
});
