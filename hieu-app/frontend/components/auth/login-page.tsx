"use client"

import { useEffect } from "react"

export default function LoginPage() {
  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem("access_token")
    
    if (!token) {
      // Redirect to auth service
      const authUrl = process.env.NEXT_PUBLIC_AUTH_GUI_URL || "https://auth.vpbank.workers.dev"
      const returnUrl = window.location.origin
      window.location.href = `${authUrl}?returnUrl=${encodeURIComponent(returnUrl)}`
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 mx-auto mb-4 animate-pulse"></div>
        <p className="text-gray-600 font-medium">Redirecting to login...</p>
      </div>
    </div>
  )
}
