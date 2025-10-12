'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const SuccessPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, fetchProfile } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleAuthSuccess = async () => {
      try {
        setIsProcessing(true);
        
        const token = searchParams.get('token');
        const type = searchParams.get('type');
        const userStr = searchParams.get('user');
        
        if (!token || !type || !userStr) {
          throw new Error('Missing authentication data');
        }

        const decodedUserStr = decodeURIComponent(userStr);
        const userData = JSON.parse(decodedUserStr);
        
        const userWithType = {
          ...userData,
          type: type as 'doctor' | 'patient',
          email: userData.email || ''
        };

        // Set user and token
        setUser(userWithType, token);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userWithType));

        // Fetch and check profile completeness
        try {
          const profile = await fetchProfile();
          
          if (!profile) {
            throw new Error('Failed to fetch profile');
          }

          let isIncomplete = false;

          if (type === 'patient') {
            const dob = profile?.dob ?? '';
            const gender = profile?.gender ?? '';
            const bloodGroup = profile?.bloodGroup ?? '';
            
            isIncomplete = !dob || !gender || !bloodGroup;
          } else if (type === 'doctor') {
            const category = profile?.category ?? [];
            const specialization = profile?.specialization ?? '';
            const qualification = profile?.qualification ?? '';
            const fees = profile?.fees ?? 0;
            
            isIncomplete = !category.length || !specialization || !qualification || !fees;
          }

          // Navigate based on profile completeness
          if (isIncomplete) {
            router.replace(`/onboarding/${type}`);
          } else {
            router.replace(`/${type}/dashboard`);
          }
        } catch (profileError) {
          console.error('Profile fetch failed:', profileError);
          router.replace(`/${type}/login`);
        }
      } catch (error) {
        console.error('Auth success error:', error);
        router.replace('/');
      } finally {
        setIsProcessing(false);
      }
    };

    handleAuthSuccess();
  }, [searchParams, router, setUser, fetchProfile]);

  // Show loader while processing
  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Setting up your account...
            </h2>
            <p className="text-gray-600">
              Please wait while we complete your login and check your profile.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null; // This will rarely be reached as navigation happens in useEffect
};

export default SuccessPage;