"use client"

import { useState } from "react"
import { Check, Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface PropertyReviewProps {
  formData: any
  uploadedFiles: any[]
  onComplete: (data: any) => void
  onBack: () => void
  isSubmitting: boolean
}

export default function PropertyReview({ formData, uploadedFiles, onComplete, onBack, isSubmitting }: PropertyReviewProps) {
  const [data, setData] = useState(formData)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basic: true,
    condition: true,
    issues: true,
  })

  const prop = data.property_info || {}
  const cond = data.condition_assessment || {}

  const updateField = (section: string, field: string, value: any) => {
    setData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }))
  }

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const handleSubmit = async () => {
    await onComplete(data)
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="images" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="images">Ảnh ({uploadedFiles.length})</TabsTrigger>
          <TabsTrigger value="info">Thông tin</TabsTrigger>
          <TabsTrigger value="condition">Tình trạng</TabsTrigger>
        </TabsList>

        {/* Images Tab */}
        <TabsContent value="images" className="card-elevated p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ảnh đã upload</h3>
          {uploadedFiles.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {uploadedFiles.map((file, i) => (
                <div key={i} className="relative group">
                  <img
                    src={file.preview || "/placeholder.svg"}
                    alt={`Upload ${i + 1}`}
                    className="w-full h-40 object-cover rounded-lg border border-gray-200 group-hover:border-blue-400 transition-colors"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all flex items-center justify-center">
                    <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100">{i + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Không có ảnh nào</p>
          )}
        </TabsContent>

        {/* Info Tab */}
        <TabsContent value="info" className="card-elevated p-8">
          <div className="space-y-6">
            <div>
              <button
                onClick={() => toggleSection("basic")}
                className="flex items-center justify-between w-full mb-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-900">Thông tin cơ bản</h3>
                {expandedSections.basic ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>

              {expandedSections.basic && (
                <div className="space-y-4 pl-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ *</label>
                      <input
                        type="text"
                        value={prop.address || ""}
                        onChange={(e) => updateField("property_info", "address", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Loại BĐS *</label>
                      <input
                        type="text"
                        value={prop.property_type || ""}
                        onChange={(e) => updateField("property_info", "property_type", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Diện tích đất (m²)</label>
                      <input
                        type="number"
                        value={prop.land_area || ""}
                        onChange={(e) => {
                          const val = e.target.value ? parseFloat(e.target.value) : null
                          updateField("property_info", "land_area", val)
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Diện tích sử dụng (m²) *
                      </label>
                      <input
                        type="number"
                        value={prop.usable_area || ""}
                        onChange={(e) => {
                          const val = e.target.value ? parseFloat(e.target.value) : 0
                          updateField("property_info", "usable_area", val)
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Số tầng</label>
                      <input
                        type="number"
                        value={prop.floors || 1}
                        onChange={(e) => updateField("property_info", "floors", parseInt(e.target.value) || 1)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phòng ngủ</label>
                      <input
                        type="number"
                        value={prop.bedrooms || ""}
                        onChange={(e) => updateField("property_info", "bedrooms", parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phòng tắm/WC</label>
                      <input
                        type="number"
                        value={prop.bathrooms || ""}
                        onChange={(e) => updateField("property_info", "bathrooms", parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Hướng nhà</label>
                      <input
                        type="text"
                        value={prop.direction || ""}
                        onChange={(e) => updateField("property_info", "direction", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="VD: Đông, Tây, Nam, Bắc"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pháp lý</label>
                      <input
                        type="text"
                        value={prop.legal_status || ""}
                        onChange={(e) => updateField("property_info", "legal_status", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="VD: Sổ đỏ, Sổ hồng"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nội thất</label>
                      <input
                        type="text"
                        value={prop.furniture || ""}
                        onChange={(e) => updateField("property_info", "furniture", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="VD: Đầy đủ, Cơ bản"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mặt tiền (m)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={prop.width || ""}
                        onChange={(e) => {
                          const val = e.target.value ? parseFloat(e.target.value) : null
                          updateField("property_info", "width", val)
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Đường vào/Chiều sâu (m)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={prop.length || ""}
                        onChange={(e) => {
                          const val = e.target.value ? parseFloat(e.target.value) : null
                          updateField("property_info", "length", val)
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Condition Tab */}
        <TabsContent value="condition" className="card-elevated p-8">
          <div className="space-y-6">
            <div>
              <button
                onClick={() => toggleSection("condition")}
                className="flex items-center justify-between w-full mb-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-900">Đánh giá tình trạng</h3>
                {expandedSections.condition ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>

              {expandedSections.condition && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-900 mb-2">Tình trạng tổng thể</p>
                    <p className="text-2xl font-bold text-blue-600">{cond.overall_condition || "N/A"}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-900 mb-2">Độ sạch sẽ</p>
                    <p className="text-2xl font-bold text-green-600">{cond.cleanliness || "N/A"}</p>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-lg border border-amber-200">
                    <p className="text-sm font-medium text-amber-900 mb-2">Tình trạng bảo trì</p>
                    <p className="text-2xl font-bold text-amber-600">{cond.maintenance_status || "N/A"}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Major Issues */}
            {cond.major_issues && cond.major_issues.length > 0 && (
              <div>
                <button
                  onClick={() => toggleSection("issues")}
                  className="flex items-center justify-between w-full mb-4 p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors border border-red-200"
                >
                  <h3 className="text-lg font-semibold text-red-900">
                    Vấn đề chính phát hiện ({cond.major_issues.length})
                  </h3>
                  {expandedSections.issues ? (
                    <ChevronUp className="w-5 h-5 text-red-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-red-600" />
                  )}
                </button>

                {expandedSections.issues && (
                  <ul className="space-y-2 pl-4">
                    {cond.major_issues.map((issue: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <span className="text-red-600 font-bold flex-shrink-0 mt-0.5">•</span>
                        <span className="text-gray-700">{issue}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Overall Description */}
            {cond.overall_description && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Nhận xét tổng quan</h4>
                <p className="text-gray-700 leading-relaxed">{cond.overall_description}</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex gap-3 sticky bottom-0 bg-white p-4 rounded-lg border border-gray-200 shadow-lg">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Đang lưu...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              Xác nhận & Lưu
            </>
          )}
        </button>
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="h-12 px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Quay lại
        </button>
      </div>
    </div>
  )
}