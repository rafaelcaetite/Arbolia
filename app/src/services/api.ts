import { supabase } from '../lib/supabase';
import type { Tree, Client, Service } from '../store/useAppStore';

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
    // Nota: Em um sistema real, aqui chamaríamos uma Edge Function 
    // ou uma rota de backend que tenha privilégios para criar no Auth.
    // Para o MVP, assumimos que o registro no Auth é feito por fora ou 
    // simulamos via tabela profiles se o login não for obrigatório imediato.
    const { data, error } = await supabase
      .from('profiles')
      .insert([employeeData])
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
    if (error) throw error;
    return data as Tree;
  },

  async updateTree(id: string, updates: Partial<Tree>) {
    const { data, error } = await supabase
      .from('trees')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Tree;
  },

  // --- Serviços ---
  async getServices() {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('data', { ascending: false });
    if (error) throw error;
    return data as Service[];
  },

  async createService(service: Omit<Service, 'id'>) {
    const { data, error } = await supabase
      .from('services')
      .insert([service])
      .select()
      .single();
    if (error) throw error;
    return data as Service;
  },

  async updateService(id: string, updates: Partial<Service>) {
    const { data, error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Service;
  }
};
