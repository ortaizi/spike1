"use client"

import React, { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  Upload,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Trash2,
  Eye,
  Download,
  Share,
  Zap,
  Home,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url?: string
  status: 'uploading' | 'success' | 'error'
  progress: number
  error?: string
}

export default function TestUploadPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Redirect if not authenticated
  if (status === "unauthenticated") {
    router.push("/auth/signin")
    return null
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-6 h-6" />
    if (type.startsWith('video/')) return <Video className="w-6 h-6" />
    if (type.startsWith('audio/')) return <Music className="w-6 h-6" />
    if (type.includes('zip') || type.includes('rar')) return <Archive className="w-6 h-6" />
    return <FileText className="w-6 h-6" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleFileSelect = (files: FileList) => {
    const newFiles: UploadedFile[] = Array.from(files).map((file, index) => ({
      id: `file-${Date.now()}-${index}`,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading' as const,
      progress: 0
    }))

    setUploadedFiles(prev => [...prev, ...newFiles])
    setIsUploading(true)

    // Simulate upload progress
    newFiles.forEach((file, index) => {
      const interval = setInterval(() => {
        setUploadedFiles(prev => prev.map(f => {
          if (f.id === file.id) {
            const newProgress = f.progress + Math.random() * 20
            if (newProgress >= 100) {
              clearInterval(interval)
              return { ...f, progress: 100, status: 'success' as const }
            }
            return { ...f, progress: newProgress }
          }
          return f
        }))
      }, 200)

      // Simulate upload completion
      setTimeout(() => {
        setUploadedFiles(prev => prev.map(f => {
          if (f.id === file.id && f.status === 'uploading') {
            return { ...f, status: 'success' as const, progress: 100 }
          }
          return f
        }))
        clearInterval(interval)
      }, 3000 + Math.random() * 2000)
    })

    setTimeout(() => setIsUploading(false), 5000)
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
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files)
    }
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const downloadFile = (file: UploadedFile) => {
    // Simulate download
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob(['Simulated file content']))
    link.download = file.name
    link.click()
  }

  const shareFile = (file: UploadedFile) => {
    // Simulate share functionality
    if (navigator.share) {
      navigator.share({
        title: file.name,
        text: `Sharing ${file.name}`,
        url: file.url || '#'
      })
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(file.url || '#')
      alert('Link copied to clipboard!')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" dir="rtl" style={{ fontFamily: "Assistant, sans-serif" }}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-poppins text-gray-900">spike</span>
              <div className="w-8 h-8">
                  <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
                    <defs>
                      <linearGradient id="lightningGradientTest" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#6366F1" />
                      </linearGradient>
                    </defs>
                    <path 
                      d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" 
                      fill="url(#lightningGradientTest)"
                      stroke="url(#lightningGradientTest)"
                      strokeWidth="0"
                    />
                  </svg>
                </div>
            </div>
            <Button 
              variant="ghost" 
              className="flex items-center gap-2 text-gray-600 hover:text-[#0066CC]"
              onClick={() => router.push("/")}
            >
              <Home className="w-4 h-4" />
              חזרה לדף הבית
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">בדיקת העלאת קבצים</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            בדוק את פונקציונליות העלאת הקבצים של המערכת. גרור קבצים לכאן או לחץ לבחירה.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Area */}
          <Card className="relative">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                העלאת קבצים
              </CardTitle>
              <CardDescription>
                גרור קבצים לכאן או לחץ לבחירה
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
                  isDragging 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {isDragging ? 'שחרר לכאן' : 'גרור קבצים לכאן'}
                </h3>
                <p className="text-gray-600 mb-4">
                  או לחץ לבחירת קבצים מהמחשב
                </p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-[#0066CC] hover:bg-[#0052A3]"
                >
                  בחר קבצים
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileInputChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Upload Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Loader2 className="w-5 h-5" />
                התקדמות העלאה
              </CardTitle>
              <CardDescription>
                מעקב אחר קבצים מועלים
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {uploadedFiles.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>אין קבצים מועלים עדיין</p>
                  </div>
                ) : (
                  uploadedFiles.map((file) => (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gray-50 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {getFileIcon(file.type)}
                          <div>
                            <p className="font-medium text-gray-900">{file.name}</p>
                            <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {file.status === 'success' && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => downloadFile(file)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => shareFile(file)}
                              >
                                <Share className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFile(file.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <motion.div
                          className={`h-2 rounded-full ${
                            file.status === 'success' 
                              ? 'bg-green-500' 
                              : file.status === 'error'
                              ? 'bg-red-500'
                              : 'bg-blue-500'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${file.progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>

                      {/* Status */}
                      <div className="flex items-center gap-2">
                        {file.status === 'uploading' && (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                            <span className="text-sm text-blue-600">מעלה...</span>
                          </>
                        )}
                        {file.status === 'success' && (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-green-600">הועלה בהצלחה</span>
                          </>
                        )}
                        {file.status === 'error' && (
                          <>
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            <span className="text-sm text-red-600">{file.error || 'שגיאה בהעלאה'}</span>
                          </>
                        )}
                        <span className="text-sm text-gray-500">
                          {Math.round(file.progress)}%
                        </span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* File Statistics */}
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <Card>
              <CardHeader>
                <CardTitle>סטטיסטיקות קבצים</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{uploadedFiles.length}</div>
                    <div className="text-sm text-gray-600">סה"כ קבצים</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {uploadedFiles.filter(f => f.status === 'success').length}
                    </div>
                    <div className="text-sm text-gray-600">הועלו בהצלחה</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {uploadedFiles.filter(f => f.status === 'uploading').length}
                    </div>
                    <div className="text-sm text-gray-600">בתהליך העלאה</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {uploadedFiles.filter(f => f.status === 'error').length}
                    </div>
                    <div className="text-sm text-gray-600">שגיאות</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  )
} 