"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  X, 
  Upload, 
  FileText, 
  FileImage, 
  FileCode, 
  FileArchive,
  CheckCircle,
  AlertCircle,
  Clock,
  Trash2,
  Download
} from "lucide-react"
import { Button } from "../ui/button"
import { cn } from "../../lib/utils"

interface AssignmentUploadModalProps {
  isOpen: boolean
  onClose: () => void
  assignment: {
    title: string
    course: string
    due_date: string
    days_left: number
  }
}

interface UploadedFile {
  id: string
  name: string
  size: string
  type: string
  status: 'uploading' | 'success' | 'error'
  progress?: number
}

export function AssignmentUploadModal({ isOpen, onClose, assignment }: AssignmentUploadModalProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return

    const newFiles: UploadedFile[] = Array.from(files).map((file, index) => ({
      id: `file-${Date.now()}-${index}`,
      name: file.name,
      size: formatFileSize(file.size),
      type: getFileType(file.name),
      status: 'uploading' as const,
      progress: 0
    }))

    setUploadedFiles(prev => [...prev, ...newFiles])

    // Simulate upload progress
    newFiles.forEach((file, index) => {
      const interval = setInterval(() => {
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === file.id 
              ? { ...f, progress: Math.min((f.progress || 0) + 20, 100) }
              : f
          )
        )
      }, 200)

      setTimeout(() => {
        clearInterval(interval)
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === file.id 
              ? { ...f, status: 'success' as const, progress: 100 }
              : f
          )
        )
      }, 1000 + index * 500)
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileType = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'pdf': return 'PDF'
      case 'doc':
      case 'docx': return 'Word'
      case 'xls':
      case 'xlsx': return 'Excel'
      case 'ppt':
      case 'pptx': return 'PowerPoint'
      case 'jpg':
      case 'jpeg':
      case 'png': return 'Image'
      case 'zip':
      case 'rar': return 'Archive'
      case 'py':
      case 'js':
      case 'ts':
      case 'java': return 'Code'
      default: return 'File'
    }
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'PDF': return <FileText className="w-5 h-5 text-red-500" />
      case 'Word': return <FileText className="w-5 h-5 text-blue-500" />
      case 'Excel': return <FileText className="w-5 h-5 text-green-500" />
      case 'PowerPoint': return <FileText className="w-5 h-5 text-orange-500" />
      case 'Image': return <FileImage className="w-5 h-5 text-purple-500" />
      case 'Archive': return <FileArchive className="w-5 h-5 text-gray-500" />
      case 'Code': return <FileCode className="w-5 h-5 text-indigo-500" />
      default: return <FileText className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'uploading': return <Clock className="w-4 h-4 text-blue-500 animate-spin" />
      default: return null
    }
  }

  const handleUpload = () => {
    // Simulate upload completion
    console.log('Uploading files for assignment:', assignment.title)
    setTimeout(() => {
      onClose()
    }, 2000)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">הגשת מטלה</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {assignment.title} - {assignment.course}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Upload Area */}
              <div
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center transition-all",
                  isDragging
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  בחר קובץ פתרון מהמחשב שלך
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  גרור קבצים לכאן או לחץ לבחירה
                </p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  בחר קובץ
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  accept=".pdf,.doc,.docx,.txt,.zip,.rar,.jpg,.jpeg,.png"
                />
              </div>

              {/* File Restrictions */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 space-x-reverse text-sm text-slate-600 dark:text-slate-400">
                  <AlertCircle className="w-4 h-4" />
                  <span>רק קבצי .pdf, .doc, .docx, .txt, .zip, .rar, .jpg, .jpeg, .png</span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse text-sm text-slate-600 dark:text-slate-400 mt-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>גודל מקסימלי: 20MB לקובץ</span>
                </div>
              </div>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-900 dark:text-white">קבצים שהועלו:</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                      >
                        <div className="flex items-center space-x-3 space-x-reverse">
                          {getFileIcon(file.type)}
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                              {file.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {file.size} • {file.type}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {getStatusIcon(file.status)}
                          {file.status === 'uploading' && file.progress && (
                            <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full transition-all"
                                style={{ width: `${file.progress}%` }}
                              />
                            </div>
                          )}
                          <button
                            onClick={() => removeFile(file.id)}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 space-x-reverse p-6 border-t border-slate-200 dark:border-slate-700">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-slate-300 dark:border-slate-600"
              >
                ביטול
              </Button>
              <Button
                onClick={handleUpload}
                disabled={uploadedFiles.length === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                העלה מטלה
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 