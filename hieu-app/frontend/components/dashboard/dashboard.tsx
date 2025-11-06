"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Header from "./header"
import PropertyForm from "./property-form"
import ValuationDashboard from "./valuation-dashboard"

type Page = "upload" | "valuation"

export default function Dashboard() {
  const [currentPage, setCurrentPage] = useState<Page>("upload")
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const [valuationData, setValuationData] = useState<any>(null) // Keep existing state

  useEffect(() => {
    const validateAuth = async () => {
      const token = localStorage.getItem("access_token")
      
      if (!token) {
        // Redirect to auth frontend
        const authUrl = process.env.NEXT_PUBLIC_AUTH_GUI_URL || "https://auth.vpbank.workers.dev"
        window.location.href = authUrl
        return
      }
      
      // Validate token with auth service
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_AUTH_API_URL || 'https://auth.vpbank.workers.dev/api'}/auth/validate`,
          {
            headers: { 
              'Authorization': `Bearer ${token}` 
            }
          }
        )
        
        if (!response.ok) {
          throw new Error('Invalid token')
        }
        
        const data = await response.json()
        setUser(data)
        setIsLoading(false)
      } catch (error) {
        console.error('Auth validation failed:', error)
        localStorage.removeItem("access_token")
        localStorage.removeItem("user")
        
        const authUrl = process.env.NEXT_PUBLIC_AUTH_GUI_URL || "https://auth.vpbank.workers.dev"
        window.location.href = authUrl
      }
    }
    
    validateAuth()
  }, []) // Empty dependency array to run only once on mount

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("user")
    // Redirect to auth GUI after logout
    const authUrl = process.env.NEXT_PUBLIC_AUTH_GUI_URL || "https://auth.vpbank.workers.dev"
    window.location.href = authUrl
  }

  const handleValuationComplete = (data: any) => {
    setValuationData(data)
    setCurrentPage("valuation")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 mx-auto mb-4 animate-pulse"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Rest of your existing Dashboard component code...
  return (
    <div className="min-h-screen bg-neutral-50">
      <Header user={user} onLogout={handleLogout} />

      {/* Navigation */}
      <div className="bg-white border-b border-neutral-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex gap-4">
            <button
              onClick={() => setCurrentPage("upload")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                currentPage === "upload"
                  ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span>📤</span>
              Tải lên & Xác nhận
            </button>
            <button
              onClick={() => setCurrentPage("valuation")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                currentPage === "valuation"
                  ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              disabled={!valuationData}
            >
              <span>📊</span>
              Định giá
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {currentPage === "upload" && <PropertyForm onValuationComplete={handleValuationComplete} />}
        {currentPage === "valuation" && valuationData && (
          <ValuationDashboard data={valuationData} onNewValuation={() => setCurrentPage("upload")} />
        )}
      </main>
    </div>
  )
}
