import DoctorAppointmentContent from '@/components/doctor/DoctorAppointmentContent'
import Loader from '@/components/Loader'
import React, { Suspense } from 'react'

const page = () => {
  return (
    <Suspense fallback={<Loader/>}>
    <DoctorAppointmentContent />
  </Suspense>
  )
}

export default page