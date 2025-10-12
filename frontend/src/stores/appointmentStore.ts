import { create } from 'zustand';
import { getWithAuth, postWithAuth, putWithAuth } from '../services/httpService';

export interface Appointment {
  _id: string;
  doctorId: any;
  patientId: any;
  date: string;
  slotStartIso: string;
  slotEndIso: string;
  consultationType: 'Video Consultation' | 'Voice Call' ;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'In Progress';
  symptoms: string;
  zegoRoomId: string;
  fees: number;
  prescription?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface AppointmentFilters {
  status?: string | string[];
  from?: string;
  to?: string;
  date?: string;
  sortBy?: 'date' | 'createdAt' | 'status';
  sortOrder?: 'asc' | 'desc';
}

interface BookingData {
  doctorId: string;
  slotStartIso: string;
  slotEndIso: string;
  consultationType?: string;
  symptoms: string;
  date: string;
  consultationFees: number;
  platformFees: number;
  totalAmount: number;
}

interface AppointmentState {
  appointments: Appointment[];
  currentAppointment: Appointment | null;
  loading: boolean;
  error: string | null;

  // Actions
  clearError: () => void;
  setCurrentAppointment: (appointment: Appointment) => void;


    bookedSlots: string[];
  fetchBookedSlots: (doctorId: string, date: string) => Promise<void>;
  
  // API Actions
  fetchAppointments: (role: 'doctor' | 'patient', tab?: string, filters?: AppointmentFilters) => Promise<void>;
  fetchAppointmentById: (appointmentId: string) => Promise<Appointment | null>;
  bookAppointment: (data: BookingData) => Promise<any>;
  joinConsultation: (appointmentId: string) => Promise<any>;
  endConsultation: (appointmentId: string, prescription?: string, notes?: string) => Promise<void>;
  updateAppointmentStatus: (appointmentId: string, status: string) => Promise<void>;
}

export const useAppointmentStore = create<AppointmentState>((set, get) => ({
  appointments: [],
    bookedSlots: [],
  currentAppointment: null,
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  setCurrentAppointment: (appointment) => set({ currentAppointment: appointment }),

  fetchAppointments: async (role, tab = '', filters = {}) => {
    set({ loading: true, error: null });
    try {
      const endpoint = role === 'doctor' ? '/appointment/doctor' : '/appointment/patient';
      
      const queryParams = new URLSearchParams();

       if (tab === 'upcoming') {
        if (role === 'doctor') {
          queryParams.append('status', 'Scheduled');
          queryParams.append('status', 'In Progress');
        } else {
          queryParams.append('status', 'Scheduled');
          queryParams.append('status', 'In Progress');
        }
      } else if (tab === 'past') {
        queryParams.append('status', 'Completed');
        queryParams.append('status', 'Cancelled');
      }

      // Add additional filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && key !== 'status') {
          if (Array.isArray(value)) {
            value.forEach(v => queryParams.append(key, v.toString()));
          } else {
            queryParams.append(key, value.toString());
          }
        }
      });

      const response = await getWithAuth(`${endpoint}?${queryParams.toString()}`);
      set({ appointments: response.data || [] });
    } catch (error: any) {
      set({ error: error.message, appointments: [] });
    } finally {
      set({ loading: false });
    }
  },

  fetchAppointmentById: async (appointmentId) => {
    set({ loading: true, error: null });
    try {
      const response = await getWithAuth(`/appointment/${appointmentId}`);
      set({ currentAppointment: response?.data?.appointment });
      return response?.data?.appointment;
    } catch (error: any) {
      set({ error: error.message, currentAppointment: null });
      return null;
    } finally {
      set({ loading: false });
    }
  },

    fetchBookedSlots: async (doctorId: string, date: string) => {
    try {
      const response = await getWithAuth(`/appointment/booked-slots/${doctorId}/${date}`);
      set({ bookedSlots: response.data });
    } catch (error: any) {
      console.error('Failed to fetch booked slots:', error);
    }
  },

  bookAppointment: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await postWithAuth('/appointment/book', data);      
      // Add new appointment to the list
      set(state => ({
        appointments: [response.data, ...state.appointments]
      }));
      
      return response.data;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  joinConsultation: async (appointmentId) => {
    set({ loading: true, error: null });
    try {
      const response = await getWithAuth(`/appointment/join/${appointmentId}`);
      
      // Update appointment status to 'In Progress'
      set(state => ({
        appointments: state.appointments.map(apt => 
          apt._id === appointmentId 
            ? { ...apt, status: 'In Progress' as const }
            : apt
        ),
        currentAppointment: state.currentAppointment?._id === appointmentId
          ? { ...state.currentAppointment, status: 'In Progress' as const }
          : state.currentAppointment
      }));
      
      return response.data;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  endConsultation: async (appointmentId, prescription, notes) => {
    set({ loading: true, error: null });
    try {
      const response = await putWithAuth(`/appointment/end/${appointmentId}`, {
        prescription,
        notes
      });
      
      // Update appointment status to 'Completed'
      set(state => ({
        appointments: state.appointments.map(apt => 
          apt._id === appointmentId 
            ? { ...apt, status: 'Completed' as const, prescription, notes }
            : apt
        ),
        currentAppointment: state.currentAppointment?._id === appointmentId
          ? { ...state.currentAppointment, status: 'Completed' as const, prescription, notes }
          : state.currentAppointment
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateAppointmentStatus: async (appointmentId, status) => {
    set({ loading: true, error: null });
    try {
      await putWithAuth(`/appointment/status/${appointmentId}`, { status });
      
      // Update appointment status locally
      set(state => ({
        appointments: state.appointments.map(apt => 
          apt._id === appointmentId 
            ? { ...apt, status: status as any }
            : apt
        ),
        currentAppointment: state.currentAppointment?._id === appointmentId
          ? { ...state.currentAppointment, status: status as any }
          : state.currentAppointment
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  }
}));