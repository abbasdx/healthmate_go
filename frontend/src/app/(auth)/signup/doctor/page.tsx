import { AuthForm } from '@/components/auth/AuthForm';

export const metadata = {
  title: 'Join HealthMate as Healthcare Provider',
  description: 'Register as a healthcare provider on HealthMate to offer online consultations.',
};

export default function DoctorSignupPage() {
  return <AuthForm type="signup" userRole="doctor" />;
}
