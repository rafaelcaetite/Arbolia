import type { AppSlice } from './types';
import type { AppState, AppUser } from '../useAppStore';
import { auth } from '../../lib/firebase';
import { api } from '../../services/api';

export type AuthSliceType = Pick<AppState,
  'user' | 'userProfile' | 'setUser' | 'signOut' |
  'theme' | 'setTheme' |
  'employees' | 'fetchEmployees' | 'createEmployee' | 'updateEmployee' | 'uploadFile' |
  'weatherCity' | 'setWeatherCity' | 'weatherSettings' | 'updateWeatherSettings' |
  'auditLogs' | 'fetchAuditLogs' | 'logAudit' | 'updateProfile'
>;

export const createAuthSlice: AppSlice<AuthSliceType> = (set, get) => {
  const savedTheme = (localStorage.getItem('theme') as 'light' | 'dark') || 'light';

  return {
    employees: [],
    user: null,
    userProfile: null,
    
    theme: savedTheme,
    setTheme: (theme) => {
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
      set({ user: mappedUser as unknown as AppUser });
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

    auditLogs: [],
    fetchAuditLogs: async () => {
      try {
        const logs = await api.getAuditLogs();
        set({ auditLogs: logs });
      } catch (err) {
        console.error(err);
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
      } catch (err) {
        console.error(err);
        throw new Error('Erro ao registrar log de auditoria.', { cause: err });
      }
    },

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
        localStorage.setItem(`arbolia_weather_settings_${user.id}`, JSON.stringify(newSettings));
        
        if (userProfile) {
          try {
            const updatedProfile = await api.updateProfile(userProfile.id, {
              weather_settings: newSettings
            });
            set({ userProfile: updatedProfile });
          } catch (dbError) {
            console.warn('Erro ao salvar configurações de clima no banco, usando fallback local:', dbError);
          }
        }
      }
    },

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
          const nextState: Partial<AppState> = {
            employees: state.employees.map(emp => emp.id === id ? updatedProfile : emp)
          };
          if (userProfile && id === userProfile.id) {
            nextState.userProfile = updatedProfile;
          }
          return nextState;
        });
      } catch (err) {
        const error = err as Error;
        console.error('Erro ao atualizar funcionário:', error);
        alert(`Erro ao atualizar: ${error.message}`);
      }
    },
    updateProfile: async (updates) => {
      try {
        const { userProfile } = get();
        if (!userProfile) return;
        const updatedProfile = await api.updateProfile(userProfile.id, updates);
        set({ userProfile: updatedProfile });
        set(state => ({
          employees: state.employees.map(emp => emp.id === updatedProfile.id ? updatedProfile : emp)
        }));
      } catch (err) {
        console.error('Erro ao atualizar perfil:', err);
        throw err;
      }
    },
    uploadFile: async (bucket, file) => {
      try {
        const { compressImageToBase64, readFileToBase64 } = await import('../../lib/imageCompression');
        
        let dataUrl = '';
        if (file.type.startsWith('image/')) {
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
        const { id: _ignoredId, email, password, ...profileData } = data;

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

        if (!email || !password) throw new Error('Email e senha são obrigatórios');

        const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
        const newUid = userCredential.user.uid;

        await tempSignOut(tempAuth);

        const profileResult = await api.createEmployee({
          id: newUid,
          email,
          ...profileData,
          status: 'ativo',
          data_cadastro: new Date().toISOString()
        });

        set(state => ({ employees: [profileResult, ...state.employees] }));
      } catch (err) {
        const error = err as Error;
        console.error('Erro ao criar funcionário:', error);
        alert(`Erro ao criar funcionário: ${error.message}`);
        throw error;
      }
    },
  };
};
