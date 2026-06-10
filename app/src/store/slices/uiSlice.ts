import type { AppSlice } from './types';
import type { AppState } from '../useAppStore';

export type UISliceType = Pick<AppState,
  'hoveredTreeId' | 'selectedTreeIds' |
  'isEditModalOpen' | 'editingTreeId' |
  'isServiceModalOpen' | 'editingServiceId' |
  'isHistoryModalOpen' | 'viewingHistoryTreeId' |
  'isTreeDetailsModalOpen' | 'viewingTreeDetailsId' |
  'isClientDetailsModalOpen' | 'viewingClientDetailsId' |
  'isReminderModalOpen' | 'activeReminderServiceId' |
  'isSettingsModalOpen' |
  'isPostServiceModalOpen' | 'activePostServiceId' |
  'isClientModalOpen' | 'editingClientId' |
  'isProfileModalOpen' |
  'isLaudoModalOpen' | 'activeLaudoServiceId' |
  'mapBounds' | 'setMapBounds' |
  'isMapPickingMode' | 'pickedCoordinates' |
  'startMapPicking' | 'cancelMapPicking' | 'finishMapPicking' | 'clearPickedCoordinates' |
  'setHoveredTreeId' | 'toggleTreeSelection' | 'clearSelection' |
  'openEditModal' | 'closeEditModal' |
  'openServiceModal' | 'closeServiceModal' |
  'openHistoryModal' | 'openHistoryModal' | 'closeHistoryModal' |
  'openTreeDetailsModal' | 'closeTreeDetailsModal' |
  'openClientDetailsModal' | 'closeClientDetailsModal' |
  'openReminderModal' | 'closeReminderModal' |
  'openClientModal' | 'closeClientModal' |
  'openProfileModal' | 'closeProfileModal' |
  'openSettingsModal' | 'closeSettingsModal' |
  'openPostServiceModal' | 'closePostServiceModal' |
  'openLaudoModal' | 'closeLaudoModal'
>;

export const createUISlice: AppSlice<UISliceType> = (set) => ({
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
  
  openServiceModal: (id) => set({ isServiceModalOpen: true, editingServiceId: id || null }),
  closeServiceModal: () => set({ isServiceModalOpen: false, editingServiceId: null }),

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

  openProfileModal: () => set({ isProfileModalOpen: true }),
  closeProfileModal: () => set({ isProfileModalOpen: false }),

  openSettingsModal: () => set({ isSettingsModalOpen: true }),
  closeSettingsModal: () => set({ isSettingsModalOpen: false }),
});
