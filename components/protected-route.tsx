"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useStore } from "@/lib/store"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const currentUser = useStore((state) => state.currentUser)
  const setCurrentUser = useStore((state) => state.setCurrentUser)

  useEffect(() => {
    if (!currentUser) {
      try {
        const raw = typeof window !== "undefined" ? localStorage.getItem("currentUser") : null
        if (raw) {
          setCurrentUser(JSON.parse(raw))
          return
        }
      } catch {
        // ignore
      }
      router.push("/login")
    }
  }, [currentUser, router, setCurrentUser])

  if (!currentUser) {
    return null
  }

  return <>{children}</>
}
