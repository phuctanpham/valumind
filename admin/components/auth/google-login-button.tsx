"use client"

import { useEffect } from "react"

declare global {
  interface Window {
    google: any
  }
}

const API_BASE_URL = process.env.WARP_URL || process.env.NEXT_PUBLIC_LOCALHOST

export default function GoogleLoginButton() {
  useEffect(() => {
    // Initialize Google Sign-In
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
        callback: handleCredentialResponse,
      })

      window.google.accounts.id.renderButton(document.getElementById("google-signin-button"), {
        theme: "outline",
        size: "large",
        width: "100%",
        text: "signin_with",
      })
    }
  }, [])

  const handleCredentialResponse = async (response: any) => {
    try {
      // Send token to backend for verification
      const res = await fetch(`${API_BASE_URL}/api/auth/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: response.credential }),
      })

      const data = await res.json()

      if (res.ok) {
        localStorage.setItem("access_token", data.access_token)
        localStorage.setItem("user", JSON.stringify(data.user))
        window.location.reload()
      } else {
        alert("Đăng nhập Google thất bại: " + (data.detail || "Unknown error"))
      }
    } catch (error) {
      console.error("Google login error:", error)
      alert("Có lỗi xảy ra khi đăng nhập")
    }
  }

  return <div id="google-signin-button" className="w-full"></div>
}
