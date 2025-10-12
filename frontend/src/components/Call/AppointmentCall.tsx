'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { Appointment } from '@/stores/appointmentStore';

interface AppointmentCallProps {
  appointment: Appointment;
  currentUser: {
    id: string;
    name: string;
    role: 'doctor' | 'patient';
  };
  onCallEnd: () => void;
  joinConsultation: (appointmentId: string) => Promise<any>;
}

const AppointmentCall: React.FC<AppointmentCallProps> = ({
  appointment,
  currentUser,
  onCallEnd,
  joinConsultation,
}) => {
  const zpRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const initializationRef = useRef(false);
  const isComponentMountedRef = useRef(true);

  const memoizedJoinConsultation = useCallback(async (appointmentId: string) => {
    await joinConsultation(appointmentId);
  }, [joinConsultation]);

  const initializeCall = useCallback(async (container: HTMLDivElement) => {
    if (initializationRef.current || zpRef.current || !isComponentMountedRef.current) {
      return;
    }

    if (!container || !container.isConnected) {
      return;
    }

    try {
      initializationRef.current = true;
      
      const appID = process.env.NEXT_PUBLIC_ZEGOCLOUD_APP_ID;
      const serverSecret = process.env.NEXT_PUBLIC_ZEGOCLOUD_SERVER_SECRET;

      if (!appID || !serverSecret) {
        throw new Error('ZegoCloud credentials not configured');
      }

      const numericAppID = Number.parseInt(appID);
      if (isNaN(numericAppID)) {
        throw new Error('Invalid ZegoCloud App ID');
      }

      try {
        await memoizedJoinConsultation(appointment._id);
      } catch (joinError) {
        console.warn('Failed to update appointment status:', joinError);
      }

      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        numericAppID,
        serverSecret,
        appointment.zegoRoomId,
        currentUser.id,
        currentUser.name
      );

      const zp = ZegoUIKitPrebuilt.create(kitToken);
      zpRef.current = zp;

      const isVideoCall = appointment.consultationType === 'Video Consultation';

      zp.joinRoom({
        container,
        scenario: {
          mode: ZegoUIKitPrebuilt.OneONoneCall,
        },
        turnOnMicrophoneWhenJoining: true,
        showMyMicrophoneToggleButton: true,
        turnOnCameraWhenJoining: isVideoCall,
        showMyCameraToggleButton: isVideoCall,
        showScreenSharingButton: true,
        showTextChat: true,
        showUserList: false,
        showRemoveUserButton: true,
        showPinButton: false,
        showAudioVideoSettingsButton: true,
        showTurnOffRemoteCameraButton: true,
        showTurnOffRemoteMicrophoneButton: true,
        maxUsers: 2,
        layout: 'Auto',
        showLayoutButton: false,
        onJoinRoom: () => {
          if (isComponentMountedRef.current) {
            console.log(`Joined ${appointment.consultationType}: ${appointment.zegoRoomId}`);
          }
        },
        onLeaveRoom: () => {
          if (isComponentMountedRef.current) {
            console.log('User left room');
            // Turn off camera and microphone when leaving room
            if (zpRef.current) {
              try {
                zpRef.current.mutePublishStreamAudio(true);
                zpRef.current.mutePublishStreamVideo(true);
              } catch (error) {
                console.warn('Error turning off camera/microphone:', error);
              }
            }
          }
        },
        onUserJoin: (users: any[]) => {
          if (isComponentMountedRef.current) {
            console.log('Users joined:', users);
          }
        },
        onUserLeave: (users: any[]) => {
          if (isComponentMountedRef.current) {
            console.log('Users left:', users);
          }
        },
        // Show the leaving view popup
        showLeavingView: true,
        // Handle return to home screen button click
        onReturnToHomeScreenClicked: () => {
          console.log('Return to home screen clicked');
          // Turn off camera and microphone before navigating
          if (zpRef.current) {
            try {
              zpRef.current.mutePublishStreamAudio(true);
              zpRef.current.mutePublishStreamVideo(true);
            } catch (error) {
              console.warn('Error turning off camera/microphone:', error);
            }
          }
          onCallEnd();
        },
      });
    } catch (error) {
      console.error('Call initialization failed:', error);
      initializationRef.current = false;
      if (isComponentMountedRef.current) {
        zpRef.current = null;
        onCallEnd();
      }
    }
  }, [appointment._id, appointment.zegoRoomId, appointment.consultationType, currentUser.id, currentUser.name, memoizedJoinConsultation, onCallEnd]);

  useEffect(() => {
    if (containerRef.current && !initializationRef.current && currentUser.id && currentUser.name && isComponentMountedRef.current) {
      initializeCall(containerRef.current);
    }

    return () => {
      if (zpRef.current) {
        try {
          zpRef.current.destroy();
        } catch (error) {
          console.warn('Error during cleanup:', error);
        } finally {
          zpRef.current = null;
        }
      }
    };
  }, [currentUser.id, currentUser.name, initializeCall]);


  const isVideoCall = appointment.consultationType === 'Video Consultation';

  return (
    <div className="h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
            <div className="bg-white border-b p-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            {isVideoCall ? 'Video Consultation' : 'Voice Consultation'}
          </h1>
          <p className="text-sm text-gray-600">
            {currentUser.role === 'doctor'
              ? `Patient: ${appointment.patientId?.name}`
              : `Dr. ${appointment.doctorId?.name}`}
          </p>
        </div>
      </div>
      <div className="flex-1">
        <div
          ref={containerRef}
          id="appointment-call-container"
          className="w-full h-full bg-gray-900"
          style={{ height: '100%' }}
        />
      </div>
    </div>
  );
};

export default AppointmentCall;