import { db } from '../lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, orderBy, limit } from 'firebase/firestore';
import type { Tree, Client, Service, UserProfile, AuditLog } from '../store/useAppStore';

export const api = {
  // --- Clientes ---
  async getClients() {
    const querySnapshot = await getDocs(query(collection(db, 'clients'), orderBy('nome')));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Client[];
  },

  async createClient(client: Omit<Client, 'id' | 'data_cadastro'>) {
    const dataCadastro = new Date().toISOString();
    const docRef = await addDoc(collection(db, 'clients'), {
      ...client,
      data_cadastro: dataCadastro
    });
    const snap = await getDoc(docRef);
    return { id: docRef.id, ...snap.data() } as Client;
  },

  async updateClient(id: string, updates: Partial<Client>) {
    const docRef = doc(db, 'clients', id);
    await updateDoc(docRef, updates);
    const snap = await getDoc(docRef);
    return { id, ...snap.data() } as Client;
  },

  // --- Profiles & Employees ---
  async getProfile(userId: string) {
    const docRef = doc(db, 'profiles', userId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Perfil não encontrado');
    return { id: userId, ...snap.data() } as UserProfile;
  },

  async getEmployees() {
    const querySnapshot = await getDocs(query(collection(db, 'profiles'), orderBy('nome')));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserProfile[];
  },

  async createEmployee(employeeData: any) {
    const { id, ...rest } = employeeData;
    if (!id) {
      throw new Error('ID (UID) é obrigatório para cadastrar um perfil.');
    }
    const docRef = doc(db, 'profiles', id);
    await setDoc(docRef, {
      ...rest,
      status: rest.status || 'ativo',
      data_cadastro: rest.data_cadastro || new Date().toISOString()
    });
    const snap = await getDoc(docRef);
    return { id, ...snap.data() } as UserProfile;
  },

  async updateProfile(id: string, updates: Partial<UserProfile>) {
    const docRef = doc(db, 'profiles', id);
    await updateDoc(docRef, updates);
    const snap = await getDoc(docRef);
    return { id, ...snap.data() } as UserProfile;
  },

  // --- Árvores ---
  async getTrees() {
    const querySnapshot = await getDocs(query(collection(db, 'trees'), orderBy('data_cadastro', 'desc')));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Tree[];
  },

  async createTree(tree: Omit<Tree, 'id' | 'data_cadastro'>) {
    const dataCadastro = new Date().toISOString();
    const docRef = await addDoc(collection(db, 'trees'), {
      ...tree,
      data_cadastro: dataCadastro
    });
    const snap = await getDoc(docRef);
    return { id: docRef.id, ...snap.data() } as Tree;
  },

  async updateTree(id: string, updates: Partial<Tree>) {
    const docRef = doc(db, 'trees', id);
    await updateDoc(docRef, updates);
    const snap = await getDoc(docRef);
    return { id, ...snap.data() } as Tree;
  },

  // --- Serviços ---
  async getServices() {
    const querySnapshot = await getDocs(query(collection(db, 'services'), orderBy('data', 'desc')));
    const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return list.map(mapService);
  },

  async createService(service: Omit<Service, 'id'>) {
    const docRef = await addDoc(collection(db, 'services'), service);
    const snap = await getDoc(docRef);
    return mapService({ id: docRef.id, ...snap.data() });
  },

  async updateService(id: string, updates: Partial<Service>) {
    const docRef = doc(db, 'services', id);
    await updateDoc(docRef, updates);
    const snap = await getDoc(docRef);
    return mapService({ id, ...snap.data() });
  },

  async deleteService(id: string) {
    const docRef = doc(db, 'services', id);
    await deleteDoc(docRef);
  },

  // --- Audit Logs ---
  async getAuditLogs() {
    const querySnapshot = await getDocs(query(collection(db, 'audit_logs'), orderBy('created_at', 'desc'), limit(100)));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AuditLog[];
  },

  async createAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>) {
    const createdAt = new Date().toISOString();
    await addDoc(collection(db, 'audit_logs'), {
      ...log,
      created_at: createdAt
    });
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
    treeIds: s.treeIds || s.tree_ids || [],
    laudoGerado: s.laudoGerado !== undefined ? s.laudoGerado : s.laudo_gerado,
    laudoData: s.laudoData || s.laudo_data,
    attachmentsByTree: s.attachmentsByTree || s.attachments_by_tree || {}
  } as Service;
}
