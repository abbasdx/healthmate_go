import { AuthForm } from '@/components/auth/AuthForm';

export const metadata = {
  title: 'Doctor Login - HealthMate',
  description: 'Healthcare provider sign in to HealthMate platform. Manage your practice and consultations.',
};

export default function DoctorLoginPage() {
  return <AuthForm type="login" userRole="doctor" />;
}
