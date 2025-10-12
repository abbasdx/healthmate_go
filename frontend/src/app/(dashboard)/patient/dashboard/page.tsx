import Loader from '@/components/Loader'
import PatientAppointmentContent from '@/components/patient/PatientAppointmentContent'
import React, { Suspense } from 'react'

const page = () => {
  return (
    <Suspense fallback={<Loader/>}>
    <PatientAppointmentContent />
  </Suspense>
  )
}

export default page