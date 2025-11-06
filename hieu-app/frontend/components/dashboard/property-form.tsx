"use client"

import { useState } from "react"
import { X, Eye, Loader2, AlertCircle } from "lucide-react"
import ImageUpload from "./image-upload"
import PropertyReview from "./property-review"
import { Alert, AlertDescription } from "@/components/ui/alert"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface PropertyFormProps {
  onValuationComplete: (data: any) => void
}

export default function PropertyForm({ onValuationComplete }: PropertyFormProps) {
  const [step, setStep] = useState<"upload" | "review">("upload")
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [formData, setFormData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFilesSelected = (files: File[]) => {
    setError(null)

    // Validate file count
    if (uploadedFiles.length + files.length > 20) {
      setError("Tối đa 20 ảnh được phép. Vui lòng giảm số lượng ảnh.")
      return
    }

    const fileObjects = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
    }))
    setUploadedFiles((prev) => [...prev, ...fileObjects])
  }

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => {
      const newFiles = prev.filter((_, i) => i !== index)
      // Revoke the object URL to free memory
      URL.revokeObjectURL(prev[index].preview)
      return newFiles
    })
  }

  const analyzeImages = async () => {
    if (uploadedFiles.length === 0) {
      setError("Vui lòng chọn ít nhất một ảnh")
      return
    }

    setError(null)
    setIsAnalyzing(true)

    try {
      const formDataObj = new FormData()
      uploadedFiles.forEach(({ file }) => {
        formDataObj.append("files", file)
      })

      const token = localStorage.getItem("access_token")
      const response = await fetch(`${API_BASE_URL}/api/analysis/upload-and-analyze`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formDataObj,
      })
      
      // Check for 401 and redirect to login
      if (response.status === 401) {
        localStorage.removeItem("access_token")
        localStorage.removeItem("user")
        const authUrl = process.env.NEXT_PUBLIC_AUTH_GUI_URL || "https://auth.vpbank.workers.dev"
        window.location.href = authUrl
        return
      }

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.detail || "Phân tích thất bại")
      }

      console.log("📊 API Response:", result)

      // ✅ FIXED: Map uploaded files with S3 URLs
      setUploadedFiles((prev) =>
        prev.map((file, idx) => ({
          ...file,
          s3Url: result.images[idx]?.url || "",
          s3Key: result.images[idx]?.key || "",
        })),
      )

      // ✅ FIXED: Use result.data for raw AI response (for PropertyReview to display)
      setAnalysisResult(result.data)

      // ✅ CRITICAL FIX: Transform API data to match form field names
      // API returns: property_info.furniture_status, usable_area_m2, land_area_m2
      // Form expects: furniture, usable_area, land_area
      const transformedData = {
        property_info: {
          address: result.data?.property_info?.address || null,
          property_type: result.data?.property_info?.property_type || null,
          land_area_m2: result.data?.property_info?.land_area_m2 || null, // Keep original key
          land_area: result.data?.property_info?.land_area_m2 || null, // Also add mapped key
          usable_area_m2: result.data?.property_info?.usable_area_m2 || null, // Keep original key
          usable_area: result.data?.property_info?.usable_area_m2 || null, // Add mapped key
          bedrooms: result.data?.property_info?.bedrooms || null,
          bathrooms: result.data?.property_info?.bathrooms || null,
          floors: result.data?.property_info?.floors || null,
          direction: result.data?.property_info?.direction || null,
          balcony_direction: result.data?.property_info?.balcony_direction || null,
          legal_status: result.data?.property_info?.legal_status || null,
          furniture_status: result.data?.property_info?.furniture_status || null, // Keep original
          furniture: result.data?.property_info?.furniture_status || null, // Add mapped key
          width_m: result.data?.property_info?.width_m || null,
          width: result.data?.property_info?.width_m || null,
          length_m: result.data?.property_info?.length_m || null,
          length: result.data?.property_info?.length_m || null,
          price_per_m2_vnd: result.data?.property_info?.price_per_m2_vnd || null,
        },
        condition_assessment: {
          overall_condition: result.data?.condition_assessment?.overall_condition || null,
          cleanliness: result.data?.condition_assessment?.cleanliness || null,
          maintenance_status: result.data?.condition_assessment?.maintenance_status || null,
          major_issues: result.data?.condition_assessment?.major_issues || [],
          overall_description: result.data?.condition_assessment?.overall_description || null,
        },
      }

      console.log("✅ Transformed data:", transformedData)
      setFormData(transformedData)
      setStep("review")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Có lỗi xảy ra"
      console.error("❌ Analysis error:", errorMessage)
      setError(errorMessage)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleReviewComplete = async (updatedData: any) => {
    try {
      setError(null)
      const token = localStorage.getItem("access_token")

      const images = uploadedFiles.map((f) => ({
        filename: f.name,
        url: f.s3Url || "",
        key: f.s3Key || "",
      }))

      // ✅ Map form fields to API schema
      const payload = {
        address: updatedData.property_info?.address || "",
        property_type: updatedData.property_info?.property_type || "",
        land_area: updatedData.property_info?.land_area || null,
        usable_area: updatedData.property_info?.usable_area || 0,
        bedrooms: updatedData.property_info?.bedrooms || 0,
        bathrooms: updatedData.property_info?.bathrooms || 0,
        floors: updatedData.property_info?.floors || 1,
        direction: updatedData.property_info?.direction || "",
        legal_status: updatedData.property_info?.legal_status || "",
        furniture: updatedData.property_info?.furniture || "", // ← Map from furniture field
        width: updatedData.property_info?.width || null,
        length: updatedData.property_info?.length || null,
        overall_condition: updatedData.condition_assessment?.overall_condition || "",
        cleanliness: updatedData.condition_assessment?.cleanliness || "",
        maintenance_status: updatedData.condition_assessment?.maintenance_status || "",
        major_issues: updatedData.condition_assessment?.major_issues || [],
        overall_description: updatedData.condition_assessment?.overall_description || "",
        images: images,
        ai_analysis_raw: analysisResult, // ← Use raw AI response
      }

      console.log("📤 Sending payload:", payload)

      const response = await fetch(`${API_BASE_URL}/api/reports`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      // Check for 401 and redirect to login
      if (response.status === 401) {
        localStorage.removeItem("access_token")
        localStorage.removeItem("user")
        const authUrl = process.env.NEXT_PUBLIC_AUTH_GUI_URL || "https://auth.vpbank.workers.dev"
        window.location.href = authUrl
        return
      }

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.detail || "Lưu báo cáo thất bại")
      }

      console.log("✅ Report saved:", result)
      onValuationComplete(updatedData)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Có lỗi xảy ra"
      console.error("❌ Save error:", errorMessage)
      setError(errorMessage)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {step === "upload" && (
        <div className="card-elevated p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Tải lên ảnh bất động sản</h2>
            <p className="text-gray-600">
              Tải lên tất cả ảnh (bao gồm ảnh thông tin text + ảnh thực tế tình trạng nhà). Tối đa 20 ảnh.
            </p>
          </div>

          <ImageUpload onFilesSelected={handleFilesSelected} />

          {uploadedFiles.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Đã chọn {uploadedFiles.length} ảnh</h3>
                {uploadedFiles.length > 0 && (
                  <button
                    onClick={() => {
                      uploadedFiles.forEach((f) => URL.revokeObjectURL(f.preview))
                      setUploadedFiles([])
                    }}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={file.preview || "/placeholder.svg"}
                      alt={file.name}
                      className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 group-hover:border-blue-400 transition-colors"
                    />
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      title="Xóa ảnh"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <p className="text-xs text-gray-600 mt-2 truncate">{file.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={analyzeImages}
            disabled={uploadedFiles.length === 0 || isAnalyzing}
            className="w-full mt-8 h-14 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang phân tích...
              </>
            ) : (
              <>
                <Eye className="w-5 h-5" />
                Phân tích tất cả ảnh
              </>
            )}
          </button>
        </div>
      )}

      {step === "review" && formData && (
        <PropertyReview
          formData={formData}
          uploadedFiles={uploadedFiles}
          onComplete={handleReviewComplete}
          onBack={() => setStep("upload")}
        />
      )}
    </div>
  )
}