// page.tsx
'use client';

import DoctorDashboardContent from '@/components/doctor/DoctorDashboardContent';
import Loader from '@/components/Loader';
import { Suspense } from 'react';

export default function DoctorDashboardPage() {
  return (
    <Suspense fallback={<Loader/>}>
      <DoctorDashboardContent />
    </Suspense>
  );
}
