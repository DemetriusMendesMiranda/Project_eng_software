"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useStore } from "@/lib/store"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const currentUser = useStore((state) => state.currentUser)

  useEffect(() => {
    if (!currentUser) {
      router.push("/login")
    }
  }, [currentUser, router])

  if (!currentUser) {
    return null
  }

  return <>{children}</>
}
