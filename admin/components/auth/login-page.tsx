"use client"

import { useEffect, useState } from "react"

export default function LoginPage() {
  const [shouldRedirect, setShouldRedirect] = useState(false)

  useEffect(() => {
    // Check if user just came back from auth with token
    const token = localStorage.getItem("access_token")
    
    if (token) {
      console.log('✅ Token found on login page, user is already authenticated')
      // Token exists, don't redirect - let the parent component handle it
      return
    }
    
    console.log('❌ No token found, redirecting to auth service')
    setShouldRedirect(true)
  }, [])

  useEffect(() => {
    if (shouldRedirect) {
      // Redirect to auth service
      const authUrl = process.env.AUTH_GUI_URL || "https://auth.vpbank.workers.dev"
      const returnUrl = window.location.origin
      console.log('🔄 Redirecting to:', `${authUrl}?returnUrl=${encodeURIComponent(returnUrl)}`)
      window.location.href = `${authUrl}?returnUrl=${encodeURIComponent(returnUrl)}`
    }
  }, [shouldRedirect])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 mx-auto mb-4 animate-pulse"></div>
        <p className="text-gray-600 font-medium">
          {shouldRedirect ? 'Redirecting to login...' : 'Checking authentication...'}
        </p>
      </div>
    </div>
  )
}