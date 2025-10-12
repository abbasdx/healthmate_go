import { AuthForm } from '@/components/auth/AuthForm';

export const metadata = {
  title: 'Create Patient Account - HealthMate',
  description: 'Join HealthMate to access quality healthcare consultations from certified doctors.',
};

export default function PatientSignupPage() {
  return <AuthForm type="signup" userRole="patient" />;
}
