"use client"

import { FileText, Download, Eye, Calendar } from "lucide-react"

interface QuickFile {
  id: string
  name: string
  type: "syllabus" | "formulas" | "lectures" | "other"
  lastUpdated: string
  size?: string
}

interface QuickFilesProps {
  files: QuickFile[]
}

export function QuickFiles({ files }: QuickFilesProps) {
  const getFileIcon = (type: string) => {
    switch (type) {
      case "syllabus":
        return <FileText className="w-6 h-6" />
      case "formulas":
        return <FileText className="w-6 h-6" />
      case "lectures":
        return <FileText className="w-6 h-6" />
      default:
        return <FileText className="w-6 h-6" />
    }
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
    <div className="card-3d-effect rounded-xl p-6">
      <h2 className="text-xl font-semibold text-slate-900 mb-6">קבצים מהירים</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {files.map((file) => (
          <div
            key={file.id}
            className="bg-slate-50/50 rounded-lg p-4 border border-slate-200/50 hover:bg-blue-50/30 transition-all duration-200 group"
          >
            {/* File Icon and Type */}
            <div className="flex items-center space-x-2 space-x-reverse mb-3">
              <div className="p-2 bg-blue-100/80 rounded-lg border border-blue-200/30 group-hover:bg-blue-200/80 transition-colors">
                {getFileIcon(file.type)}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 text-sm">{getFileTypeLabel(file.type)}</h3>
                <p className="text-xs text-slate-600">{file.name}</p>
              </div>
            </div>

            {/* File Info */}
            <div className="flex items-center space-x-2 space-x-reverse text-xs text-slate-500 mb-4">
              <Calendar className="w-3 h-3" />
              <span>עודכן: {file.lastUpdated}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2 space-x-reverse">
              <button
                onClick={() => handleFileAction(file, "view")}
                className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 py-2 px-3 rounded-lg text-xs font-medium transition-colors duration-200 flex items-center justify-center space-x-1 space-x-reverse"
              >
                <Eye className="w-3 h-3" />
                <span>צפה</span>
              </button>
              <button
                onClick={() => handleFileAction(file, "download")}
                className="flex-1 bg-[#387ADF] hover:bg-[#387ADF]/90 text-white py-2 px-3 rounded-lg text-xs font-medium transition-colors duration-200 flex items-center justify-center space-x-1 space-x-reverse"
              >
                <Download className="w-3 h-3" />
                <span>הורד</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
