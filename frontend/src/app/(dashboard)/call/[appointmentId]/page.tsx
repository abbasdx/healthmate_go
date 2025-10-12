// src/app/(dashboard)/call/[appointmentId]/page.tsx
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppointmentStore } from '@/stores/appointmentStore';
import { useAuthStore } from '@/stores/authStore';
import AppointmentCall from '@/components/Call/AppointmentCall';

const CallPage = () => {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.appointmentId as string;
  
  const { currentAppointment, fetchAppointmentById, joinConsultation } = useAppointmentStore();
  const { user } = useAuthStore();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    if (appointmentId) {
      fetchAppointmentById(appointmentId);
    }
  }, [appointmentId, fetchAppointmentById]);

  const handleCallEnd = useCallback(async () => {
    if (isNavigating) return;
    
    try {
      setIsNavigating(true);

      // Immediate navigation without delay
      if (user?.type === 'doctor') {
        router.push(`/doctor/dashboard?completedCall=${appointmentId}`);
      } else {
        router.push('/patient/dashboard');
      }
    } catch (error) {
      console.error('Failed to end call:', error);
      router.push('/');
    } finally {
      setIsNavigating(false);
    }
  }, [user?.type, router, appointmentId, isNavigating]);

  if (!currentAppointment || !user) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading call room...</p>
        </div>
      </div>
    );
  }

  const currentUserData = {
    id: user.id,
    name: user.name,
    role: user.type as 'doctor' | 'patient'
  };

  return (
    <AppointmentCall
      appointment={currentAppointment}
      currentUser={currentUserData}
      onCallEnd={handleCallEnd}
      joinConsultation={joinConsultation}
    />
  );
};

export default CallPage;