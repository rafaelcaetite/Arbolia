import { supabase } from '../lib/supabase';
import type { Tree, Client, Service, UserProfile } from '../store/useAppStore';

export const api = {
  // --- Clientes ---
  async getClients() {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('nome');
    if (error) throw error;
    return data as Client[];
  },

  async createClient(client: Omit<Client, 'id' | 'data_cadastro'>) {
    const { data, error } = await supabase
      .from('clients')
      .insert([client])
      .select()
      .single();
    if (error) throw error;
    return data as Client;
  },

  async updateClient(id: string, updates: Partial<Client>) {
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Client;
  },

  // --- Profiles & Employees
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  async getEmployees() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('nome');
    if (error) throw error;
    return data;
  },

  async createEmployee(employeeData: any) {
    const { data, error } = await supabase
      .from('profiles')
      .insert([employeeData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateProfile(id: string, updates: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // --- Árvores ---
  async getTrees() {
    const { data, error } = await supabase
      .from('trees')
      .select('*')
      .order('data_cadastro', { ascending: false });
    if (error) throw error;
    return data as Tree[];
  },

  async createTree(tree: Omit<Tree, 'id' | 'data_cadastro'>) {
    const { data, error } = await supabase
      .from('trees')
      .insert([tree])
      .select()
      .single();
    
    if (error) {
      console.error('Erro Supabase (createTree):', error);
      throw error;
    }
    return data as Tree;
  },

  async updateTree(id: string, updates: Partial<Tree>) {
    const { data, error } = await supabase
      .from('trees')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro Supabase (updateTree):', error);
      throw error;
    }
    return data as Tree;
  },

  // --- Serviços ---
  async getServices() {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('data', { ascending: false });
    if (error) throw error;
    
    return (data || []).map(mapService);
  },

  async createService(service: Omit<Service, 'id'>) {
    const { treeIds, laudoGerado, laudoData, attachmentsByTree, ...rest } = service as any;
    const dbPayload = {
      ...rest,
      tree_ids: treeIds || [],
      laudo_gerado: laudoGerado,
      laudo_data: laudoData,
      attachments_by_tree: attachmentsByTree || {}
    };

    // 1. Criar o serviço na tabela principal
    const { data: newService, error: serviceError } = await supabase
      .from('services')
      .insert([dbPayload])
      .select()
      .single();
    
    if (serviceError) {
      console.error('Erro ao criar serviço no Supabase:', serviceError);
      throw serviceError;
    }

    // 2. Criar os vínculos na tabela de junção service_trees
    if (treeIds && treeIds.length > 0) {
      const relations = treeIds.map((tId: string) => ({
        service_id: newService.id,
        tree_id: tId
      }));
      
      const { error: relError } = await supabase
        .from('service_trees')
        .insert(relations);
        
      if (relError) {
        console.error('Erro ao criar vínculos service_trees:', relError);
        // Não lançamos erro aqui para não invalidar a criação do serviço, 
        // mas o ideal seria uma transação se o Supabase suportasse via JS (ou usar RPC)
      }
    }

    return mapService(newService);
  },

  async updateService(id: string, updates: Partial<Service>) {
    const { treeIds, laudoGerado, laudoData, attachmentsByTree, ...rest } = updates as any;
    const dbPayload = { ...rest };
    
    if (treeIds !== undefined) dbPayload.tree_ids = treeIds;
    if (laudoGerado !== undefined) dbPayload.laudo_gerado = laudoGerado;
    if (laudoData !== undefined) dbPayload.laudo_data = laudoData;
    if (attachmentsByTree !== undefined) dbPayload.attachments_by_tree = attachmentsByTree;

    // 1. Atualizar o serviço
    const { data: updatedService, error: serviceError } = await supabase
      .from('services')
      .update(dbPayload)
      .eq('id', id)
      .select()
      .single();
    
    if (serviceError) throw serviceError;

    // 2. Sincronizar vínculos na tabela service_trees se treeIds foi alterado
    if (treeIds !== undefined) {
      // Deletar vínculos antigos
      await supabase.from('service_trees').delete().eq('service_id', id);
      
      // Inserir novos vínculos
      if (treeIds.length > 0) {
        const relations = treeIds.map((tId: string) => ({
          service_id: id,
          tree_id: tId
        }));
        await supabase.from('service_trees').insert(relations);
      }
    }

    return mapService(updatedService);
  }
};

// Helper to map and dynamically evaluate logical service status
function mapService(s: any): Service {
  let status = s.status;
  if (status === 'agendado') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const svcDate = new Date(s.data + 'T00:00:00');
    svcDate.setHours(0, 0, 0, 0);
    if (svcDate < today) {
      status = 'atrasado';
    }
  }

  return {
    ...s,
    status,
    treeIds: s.tree_ids || [],
    laudoGerado: s.laudo_gerado,
    laudoData: s.laudo_data,
    attachmentsByTree: s.attachments_by_tree || {}
  } as Service;
}
