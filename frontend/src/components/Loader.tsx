"use client"

import { Loader2 } from "lucide-react"

export default function Loader() {
  return (
    <div className="flex items-center justify-center w-full h-full p-4">
      <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
    </div>
  )
}
