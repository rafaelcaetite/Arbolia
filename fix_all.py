import os
import re

def fix_use_app_store():
    path = "c:/Users/rafae/Documents/Projetos/Arbolia/app/src/store/useAppStore.ts"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # The interface AppState starts with "export interface AppState {" and ends before "import { createAuthSlice } from './slices/authSlice';"
    
    app_state_code = """export interface AppState {
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
"""
    content = re.sub(r'export interface AppState \{.*?(?=import \{ createAuthSlice)', app_state_code, content, flags=re.DOTALL)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def fix_service_log():
    path = "c:/Users/rafae/Documents/Projetos/Arbolia/app/src/pages/ServiceLog.tsx"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    content = content.replace("tree_ids", "treeIds")
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def fix_auth_slice():
    path = "c:/Users/rafae/Documents/Projetos/Arbolia/app/src/store/slices/authSlice.ts"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    content = content.replace("...profileData,", "...profileData")
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def fix_data_slice():
    path = "c:/Users/rafae/Documents/Projetos/Arbolia/app/src/store/slices/dataSlice.ts"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    content = content.replace("payload: tree as Record<string, unknown>", "payload: tree as unknown as Record<string, unknown>")
    content = content.replace("payload: tree as unknown as Record<string, unknown>", "payload: tree as unknown as Record<string, unknown>") # Idempotent

    # Add missing keys to DataSliceType
    content = content.replace("'createService' | 'updateService' | 'completeService' |", "'createService' | 'updateService' | 'completeService' | 'deleteService' | 'deactivateTrees' |")
    content = content.replace("'addServiceAttachment' | 'deleteAttachment' | 'renameAttachment'", "'addServiceAttachment' | 'deleteAttachment' | 'renameAttachment' | 'saveLaudo'")

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def fix_ui_slice():
    path = "c:/Users/rafae/Documents/Projetos/Arbolia/app/src/store/slices/uiSlice.ts"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    content = content.replace("'closeHistoryModal' |", "'openHistoryModal' | 'closeHistoryModal' |")
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def fix_service_acervo_modal():
    path = "c:/Users/rafae/Documents/Projetos/Arbolia/app/src/components/services/ServiceAcervoModal.tsx"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    content = content.replace("import React from 'react';\n", "")
    content = content.replace("import { Attachment } from", "import type { ServiceAttachment } from")
    content = content.replace("Attachment[]", "ServiceAttachment[]")
    content = content.replace("Attachment", "ServiceAttachment")
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def fix_clients():
    path = "c:/Users/rafae/Documents/Projetos/Arbolia/app/src/pages/Clients.tsx"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    content = content.replace("Attachment,", "")
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def fix_employees():
    path = "c:/Users/rafae/Documents/Projetos/Arbolia/app/src/pages/Employees.tsx"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    content = content.replace("await updateEmployee(editingEmployee.id, submitData);", "await updateEmployee(editingEmployee.id, submitData as Partial<UserProfile>);")
    content = content.replace("await createEmployee(submitData);", "await createEmployee(submitData as Partial<UserProfile> & { id: string; password?: string });")
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

fix_use_app_store()
fix_service_log()
fix_auth_slice()
fix_data_slice()
fix_ui_slice()
fix_service_acervo_modal()
fix_clients()
fix_employees()
print("All fixed!")
