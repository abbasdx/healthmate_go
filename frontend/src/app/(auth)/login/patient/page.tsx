import { AuthForm } from '@/components/auth/AuthForm';

export const metadata = {
  title: 'Patient Login - HealthMate',
  description: 'Sign in to your HealthMate account to access healthcare consultations.',
};

export default function PatientLoginPage() {
  return <AuthForm type="login" userRole="patient" />;
}
