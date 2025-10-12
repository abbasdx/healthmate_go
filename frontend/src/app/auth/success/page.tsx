import SuccessPage from '@/components/auth/SuccessPage'
import Loader from '@/components/Loader'
import React, { Suspense } from 'react'

const page = () => {
  return (
    <Suspense fallback={<Loader/>}>
    <SuccessPage />
  </Suspense>
  )
}

export default page