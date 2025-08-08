"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  BookOpen,
  Calendar,
  Users,
  FileText,
  Video,
  Download,
  Share,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Bookmark,
  Zap,
  Home,
  ArrowLeft,
  Settings,
  Bell,
  Search,
  Filter,
  SortAsc,
  SortDesc,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface CourseMaterial {
  id: string
  title: string
  type: 'document' | 'video' | 'assignment' | 'quiz' | 'link'
  description: string
  size?: string
  duration?: string
  dueDate?: string
  status: 'available' | 'submitted' | 'overdue' | 'upcoming'
  url?: string
  isDownloaded?: boolean
  isBookmarked?: boolean
}

interface CourseAnnouncement {
  id: string
  title: string
  content: string
  author: string
  date: string
  isImportant: boolean
  isRead: boolean
}

interface CourseGrade {
  assignment: string
  grade: number
  maxGrade: number
  percentage: number
  feedback?: string
  submittedAt: string
}

export default function CoursePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [activeTab, setActiveTab] = useState("חומרי לימוד")
  const [showCompleted, setShowCompleted] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([])

  // Mock data
  const [courseMaterials] = useState<CourseMaterial[]>([
    {
      id: "1",
      title: "מבוא לקורס - מצגת",
      type: "document",
      description: "מצגת פתיחה לקורס עם סקירה כללית של הנושאים",
      size: "2.3 MB",
      status: "available",
      url: "#"
    },
    {
      id: "2",
      title: "הרצאה 1 - יסודות האלגוריתמים",
      type: "video",
      description: "הרצאה מקוונת על יסודות האלגוריתמים והסיבוכיות",
      duration: "45:30",
      status: "available",
      url: "#"
    },
    {
      id: "3",
      title: "תרגיל 1 - אלגוריתמי מיון",
      type: "assignment",
      description: "תרגיל בית על אלגוריתמי מיון שונים",
      dueDate: "2024-01-15",
      status: "upcoming",
      url: "#"
    },
    {
      id: "4",
      title: "מבחן אמצע - חלק א'",
      type: "quiz",
      description: "מבחן אמצע על החומר שנלמד עד כה",
      dueDate: "2024-01-20",
      status: "upcoming",
      url: "#"
    },
    {
      id: "5",
      title: "קישור למשאבים נוספים",
      type: "link",
      description: "קישורים למאמרים וסרטונים נוספים",
      status: "available",
      url: "#"
    }
  ])

  const [announcements] = useState<CourseAnnouncement[]>([
    {
      id: "1",
      title: "שינוי מועד המבחן",
      content: "המבחן האמצעי נדחה ליום רביעי, 22 בינואר 2024",
      author: "ד\"ר כהן",
      date: "2024-01-10",
      isImportant: true,
      isRead: false
    },
    {
      id: "2",
      title: "תרגיל נוסף זמין",
      content: "תרגיל 2 על אלגוריתמי חיפוש זמין כעת",
      author: "ד\"ר כהן",
      date: "2024-01-08",
      isImportant: false,
      isRead: true
    }
  ])

  const [grades] = useState<CourseGrade[]>([
    {
      assignment: "תרגיל 1",
      grade: 85,
      maxGrade: 100,
      percentage: 85,
      feedback: "עבודה טובה, שימו לב לפרטים",
      submittedAt: "2024-01-05"
    },
    {
      assignment: "מבחן קצר 1",
      grade: 92,
      maxGrade: 100,
      percentage: 92,
      submittedAt: "2024-01-03"
    }
  ])

  // Redirect if not authenticated
  if (status === "unauthenticated") {
    router.push("/auth/signin")
    return null
  }

  const tabs = [
    { name: "חומרי לימוד", icon: <BookOpen className="w-5 h-5" /> },
    { name: "הודעות", icon: <MessageSquare className="w-5 h-5" /> },
    { name: "ציונים", icon: <Star className="w-5 h-5" /> },
    { name: "לוח זמנים", icon: <Calendar className="w-5 h-5" /> },
  ]

  const getMaterialIcon = (type: CourseMaterial['type']) => {
    switch (type) {
      case 'document': return <FileText className="w-6 h-6" />
      case 'video': return <Video className="w-6 h-6" />
      case 'assignment': return <Edit className="w-6 h-6" />
      case 'quiz': return <AlertCircle className="w-6 h-6" />
      case 'link': return <Share className="w-6 h-6" />
      default: return <FileText className="w-6 h-6" />
    }
  }

  const getStatusColor = (status: CourseMaterial['status']) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'submitted': return 'bg-blue-100 text-blue-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      case 'upcoming': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: CourseMaterial['status']) => {
    switch (status) {
      case 'available': return 'זמין'
      case 'submitted': return 'הוגש'
      case 'overdue': return 'פג תוקף'
      case 'upcoming': return 'קרוב'
      default: return 'לא ידוע'
    }
  }

  const filteredMaterials = courseMaterials.filter(material => {
    const matchesSearch = material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = showCompleted || material.status !== 'submitted'
    return matchesSearch && matchesStatus
  })

  const sortedMaterials = [...filteredMaterials].sort((a, b) => {
    if (sortBy === 'date') {
      return sortOrder === 'asc' ? 1 : -1
    }
    if (sortBy === 'title') {
      return sortOrder === 'asc' 
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title)
    }
    return 0
  })

  const handleMaterialAction = (material: CourseMaterial, action: string) => {
    switch (action) {
      case 'download':
        // Simulate download
        const link = document.createElement('a')
        link.href = material.url || '#'
        link.download = material.title
        link.click()
        break
      case 'view':
        window.open(material.url, '_blank')
        break
      case 'bookmark':
        // Toggle bookmark
        break
      default:
        break
    }
  }

  const toggleMaterialSelection = (materialId: string) => {
    setSelectedMaterials(prev => 
      prev.includes(materialId) 
        ? prev.filter(id => id !== materialId)
        : [...prev, materialId]
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" dir="rtl" style={{ fontFamily: "Assistant, sans-serif" }}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                className="flex items-center gap-2 text-gray-600 hover:text-[#0066CC]"
                onClick={() => router.push("/dashboard")}
              >
                <ArrowLeft className="w-4 h-4" />
                חזרה לדשבורד
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-poppins text-gray-900">spike</span>
                <div className="w-8 h-8">
                    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
                      <defs>
                        <linearGradient id="lightningGradientCourse" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#3B82F6" />
                          <stop offset="100%" stopColor="#6366F1" />
                        </linearGradient>
                      </defs>
                      <path 
                        d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" 
                        fill="url(#lightningGradientCourse)"
                        stroke="url(#lightningGradientCourse)"
                        strokeWidth="0"
                      />
                    </svg>
                  </div>
                </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" className="p-2">
                <Search className="w-5 h-5" />
              </Button>
              <Button variant="ghost" className="p-2">
                <Bell className="w-5 h-5" />
              </Button>
              <Button variant="ghost" className="p-2">
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Course Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">יסודות האלגוריתמים והסיבוכיות</h1>
              <p className="text-gray-600">סמסטר א' 2024 - ד\"ר כהן</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <Badge variant="secondary" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              120 סטודנטים
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              ימי ב', ד' 10:00-12:00
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              ממוצע ציונים: 85
            </Badge>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="flex border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.name
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.icon}
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {activeTab === "חומרי לימוד" && (
            <div>
              {/* Controls */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="חיפוש בחומרי לימוד..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="date">תאריך</option>
                      <option value="title">שם</option>
                    </select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    >
                      {sortOrder === "asc" ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                    </Button>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={showCompleted}
                        onChange={(e) => setShowCompleted(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-600">הצג שהוגשו</span>
                    </label>
                    {selectedMaterials.length > 0 && (
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        הורד נבחרים ({selectedMaterials.length})
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Materials Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedMaterials.map((material) => (
                  <motion.div
                    key={material.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              {getMaterialIcon(material.type)}
                            </div>
                            <div>
                              <CardTitle className="text-lg">{material.title}</CardTitle>
                              <Badge className={getStatusColor(material.status)}>
                                {getStatusText(material.status)}
                              </Badge>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={selectedMaterials.includes(material.id)}
                            onChange={() => toggleMaterialSelection(material.id)}
                            className="rounded"
                          />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 text-sm mb-4">{material.description}</p>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                          {material.size && <span>{material.size}</span>}
                          {material.duration && <span>{material.duration}</span>}
                          {material.dueDate && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {material.dueDate}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMaterialAction(material, 'view')}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMaterialAction(material, 'download')}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMaterialAction(material, 'bookmark')}
                            >
                              <Bookmark className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "הודעות" && (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <motion.div
                  key={announcement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {announcement.title}
                        {announcement.isImportant && (
                          <Badge className="mr-2 bg-red-100 text-red-800">חשוב</Badge>
                        )}
                      </h3>
                      <p className="text-gray-600 mb-2">{announcement.content}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>מאת: {announcement.author}</span>
                        <span>{announcement.date}</span>
                      </div>
                    </div>
                    {!announcement.isRead && (
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === "ציונים" && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">סיכום ציונים</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">88.5</div>
                    <div className="text-sm text-gray-600">ממוצע כללי</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">2</div>
                    <div className="text-sm text-gray-600">מטלות שהוגשו</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">3</div>
                    <div className="text-sm text-gray-600">מטלות שנותרו</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {grades.map((grade) => (
                  <motion.div
                    key={grade.assignment}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">{grade.assignment}</h4>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {grade.grade}/{grade.maxGrade}
                        </div>
                        <div className="text-sm text-gray-500">{grade.percentage}%</div>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${grade.percentage}%` }}
                      ></div>
                    </div>

                    {grade.feedback && (
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm text-blue-800">{grade.feedback}</p>
                      </div>
                    )}

                    <div className="text-sm text-gray-500 mt-2">
                      הוגש ב: {grade.submittedAt}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "לוח זמנים" && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">לוח זמנים הקורס</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <h4 className="font-semibold text-gray-900">מבחן אמצע</h4>
                    <p className="text-sm text-gray-600">מבחן על החומר שנלמד עד כה</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">22 בינואר</div>
                    <div className="text-sm text-gray-500">10:00-12:00</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                  <div>
                    <h4 className="font-semibold text-gray-900">תרגיל 2</h4>
                    <p className="text-sm text-gray-600">תרגיל על אלגוריתמי חיפוש</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">15 בינואר</div>
                    <div className="text-sm text-gray-500">דדליין הגשה</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div>
                    <h4 className="font-semibold text-gray-900">הרצאה 5</h4>
                    <p className="text-sm text-gray-600">אלגוריתמי גרפים</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">17 בינואר</div>
                    <div className="text-sm text-gray-500">10:00-12:00</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 