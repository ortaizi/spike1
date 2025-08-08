"use client"

import { FileText, Download, Eye, ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"

interface QuickFile {
  id: string
  name: string
  type: "syllabus" | "formulas" | "lectures" | "other"
  lastUpdated: string
  size?: string
}

interface CompactQuickFilesProps {
  files: QuickFile[]
}

export function CompactQuickFiles({ files }: CompactQuickFilesProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleToggleExpanded = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  const getFileTypeLabel = (type: string) => {
    switch (type) {
      case "syllabus":
        return "סילבוס"
      case "formulas":
        return "דף נוסחאות"
      case "lectures":
        return "מערכי שיעורים"
      default:
        return "קובץ"
    }
  }

  const handleFileAction = (file: QuickFile, action: "view" | "download") => {
    console.log(`${action} file:`, file.name)
    // Implement file viewing/downloading logic
  }

  return (
    <div className="space-y-4">
      {/* Header with Toggle */}
      <button
        onClick={handleToggleExpanded}
        className="w-full flex items-center justify-between cursor-pointer"
        type="button"
      >
        <div className="flex items-center space-x-3 space-x-reverse">
          <FileText className="w-8 h-8 text-slate-600" />
          <h3 className="text-lg font-medium text-slate-900">קבצים מהירים</h3>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-slate-600" />
        ) : (
          <ChevronUp className="w-4 h-4 text-slate-600" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="space-y-3">
          {files.length === 0 ? (
            <div className="text-center py-6 text-slate-500">
              <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">אין קבצים זמינים</p>
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="bg-slate-50/50 rounded-lg p-3 border border-slate-200/50 hover:bg-blue-50/30 transition-colors duration-200"
                >
                  {/* Simple File Info */}
                  <div className="flex items-center justify-between">
                    <div className="text-right">
                      <h4 className="font-medium text-slate-900 text-sm">{getFileTypeLabel(file.type)}</h4>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {/* View Button */}
                      <button
                        onClick={() => handleFileAction(file, "view")}
                        className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 py-1.5 px-3 rounded-lg text-xs font-medium transition-colors duration-200 flex items-center space-x-1 space-x-reverse"
                      >
                        <Eye className="w-3 h-3" />
                        <span>צפה</span>
                      </button>
                      
                      {/* Download Button */}
                      <button
                        onClick={() => handleFileAction(file, "download")}
                        className="bg-[#387ADF] hover:bg-[#387ADF]/90 text-white py-1.5 px-3 rounded-lg text-xs font-medium transition-colors duration-200 flex items-center space-x-1 space-x-reverse"
                      >
                        <Download className="w-3 h-3" />
                        <span>הורד</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
