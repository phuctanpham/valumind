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
  const [valuationData, setValuationData] = useState<any>(null)

  useEffect(() => {
    const loadUser = () => {
      try {
        const token = localStorage.getItem("access_token")
        const userStr = localStorage.getItem("user")
        
        console.log('📊 Dashboard loading:', { hasToken: !!token, hasUser: !!userStr })
        
        if (!token || !userStr) {
          console.log('❌ No auth data, redirecting to login')
          // Clear any partial data
          localStorage.removeItem("access_token")
          localStorage.removeItem("user")
          
          // Redirect to auth
          const authUrl = process.env.AUTH_GUI_URL || "https://auth.vpbank.workers.dev"
          const returnUrl = window.location.origin
          window.location.href = `${authUrl}?returnUrl=${encodeURIComponent(returnUrl)}`
          return
        }
        
        const userData = JSON.parse(userStr)
        console.log('✅ User data loaded:', userData.email)
        setUser(userData)
        setIsLoading(false)
      } catch (error) {
        console.error('❌ Error loading user:', error)
        localStorage.removeItem("access_token")
        localStorage.removeItem("user")
        
        const authUrl = process.env.AUTH_GUI_URL || "https://auth.vpbank.workers.dev"
        const returnUrl = window.location.origin
        window.location.href = `${authUrl}?returnUrl=${encodeURIComponent(returnUrl)}`
      }
    }
    
    loadUser()
  }, [])

  const handleLogout = () => {
    console.log('🚪 Logging out')
    localStorage.removeItem("access_token")
    localStorage.removeItem("user")
    
    // Redirect to auth GUI after logout
    const authUrl = process.env.AUTH_GUI_URL || "https://auth.vpbank.workers.dev"
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