"use client"

import React, { useState, useEffect } from "react"
import { ProtectedRoute } from "../../components/auth/protected-route"
import { HomeContent } from "../../components/dashboard/home-content"
import { Settings, UserCircle2, Calendar, GraduationCap, ClipboardList, Mail, CalendarDays, Bell, FileText, Clock, LogOut, Zap, User, Home, X, ChevronDown } from "lucide-react"
import { AssignmentsContent } from "../../components/dashboard/assignments-content"
import { CoursesContent } from "../../components/dashboard/courses-content"
import { EmailContent } from "../../components/dashboard/email-content"
import { ScheduleContent } from "../../components/dashboard/schedule-content"
import { EventsContent } from "../../components/dashboard/events-content"
import { Notifications } from "../../components/dashboard/notifications"
import { UserCoursesDisplay } from "../../components/dashboard/user-courses-display"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { motion } from "framer-motion"
import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function Dashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("בית")
  const [isMounted, setIsMounted] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [userSession, setUserSession] = useState<any>(null)
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    duration: number;
    delay: number;
  }>>([])

  useEffect(() => {
    console.log('🔍 HYDRATION DEBUG - Dashboard mounting', {
      isServer: typeof window === 'undefined',
      timestamp: Date.now(),
      activeTab
    })
    setIsMounted(true)
    
    // Generate particles for visual interest
    const generatedParticles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 5,
    }));
    setParticles(generatedParticles);
    
    // קבלת פרטי המשתמש מהסשן
    const getUserInfo = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const session = await response.json();
          setUserSession(session);
        }
      } catch (error) {
        console.error('שגיאה בקבלת פרטי משתמש:', error);
      }
    };
    
    getUserInfo();
  }, [])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (showNotifications && !target.closest('.notifications-dropdown')) {
        setShowNotifications(false)
      }
      if (showProfileDropdown && !target.closest('.profile-dropdown')) {
        setShowProfileDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showNotifications, showProfileDropdown])

  const tabs = [
    { name: "בית", icon: <Home className="w-5 h-5" /> },
    { name: "קורסים", icon: <GraduationCap className="w-5 h-5" /> },
    { name: "מטלות", icon: <ClipboardList className="w-5 h-5" /> },
    { name: "מערכת שעות", icon: <Calendar className="w-5 h-5" /> },
    { name: "מייל", icon: <Mail className="w-5 h-5" /> },
    { name: "אירועים", icon: <CalendarDays className="w-5 h-5" /> },
  ]

  const handleNavigateToTab = (tab: string) => {
    setActiveTab(tab)
  }

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false })
      router.push('/')
    } catch (error) {
      console.error('שגיאה בהתנתקות:', error)
    }
  }

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!userSession?.user?.name) return "משתמש"
    const names = userSession.user.name.split(' ')
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`
    }
    return names[0][0] || "משתמש"
  }

  // Get display name for development mode
  const getDisplayName = () => {
    if (process.env.NODE_ENV === 'development' && !userSession?.user?.name) {
      return "אור (דמו)"
    }
    return userSession?.user?.name || "משתמש"
  }

  // Get display email for development mode
  const getDisplayEmail = () => {
    if (process.env.NODE_ENV === 'development' && !userSession?.user?.email) {
      return "demo@bgu.ac.il"
    }
    return userSession?.user?.email || "משתמש@example.com"
  }

  // Show loading during hydration
  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען דשבורד...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50" dir="rtl" style={{ fontFamily: "Assistant, sans-serif", position: 'relative' }}>
      {/* New Page Background - Light and gentle gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50"></div>
      
      {/* Animated Light Accents */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-blue-200/20 via-indigo-200/10 to-purple-200/20"
        animate={{
          background: [
            "linear-gradient(45deg, rgba(191, 219, 254, 0.2) 0%, rgba(199, 210, 254, 0.1) 50%, rgba(196, 181, 253, 0.2) 100%)",
            "linear-gradient(45deg, rgba(196, 181, 253, 0.2) 0%, rgba(191, 219, 254, 0.1) 50%, rgba(199, 210, 254, 0.2) 100%)",
            "linear-gradient(45deg, rgba(199, 210, 254, 0.2) 0%, rgba(196, 181, 253, 0.1) 50%, rgba(191, 219, 254, 0.2) 100%)",
          ],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Light Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(191,219,254,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(191,219,254,0.1)_1px,transparent_1px)] bg-[size:50px_50px] opacity-40" />

      {/* Light Geometric Shapes */}
      <motion.div
        className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-200/30 to-indigo-200/30 rounded-full blur-xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute bottom-20 right-10 w-24 h-24 bg-gradient-to-br from-indigo-200/30 to-blue-200/30 rounded-full blur-xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.35, 0.55, 0.35],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />

      {/* Light Floating Particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-gradient-to-r from-blue-200/40 to-indigo-200/40 backdrop-blur-sm"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 10, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut",
          }}
        />
      ))}

      <div className="relative z-10 flex items-center justify-center min-h-screen p-1">
        {/* Main Card Container with Original Dashboard Background */}
        <div className="w-full max-w-[98vw] h-[98vh] bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden relative">
          {/* Original Dashboard Background Inside Card */}
          <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50/30 to-white"></div>
          
          {/* Animated Blue Accents Inside Card */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-blue-600/3 via-indigo-600/2 to-blue-800/3"
            animate={{
              background: [
                "linear-gradient(45deg, rgba(59, 130, 246, 0.03) 0%, rgba(99, 102, 241, 0.02) 50%, rgba(37, 99, 235, 0.03) 100%)",
                "linear-gradient(45deg, rgba(37, 99, 235, 0.03) 0%, rgba(59, 130, 246, 0.02) 50%, rgba(99, 102, 241, 0.03) 100%)",
                "linear-gradient(45deg, rgba(99, 102, 241, 0.03) 0%, rgba(37, 99, 235, 0.02) 50%, rgba(59, 130, 246, 0.03) 100%)",
              ],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          {/* Grid Pattern Inside Card */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px] opacity-20" />

          {/* Geometric Shapes Inside Card */}
          <motion.div
            className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-400/8 to-indigo-400/8 rounded-full blur-xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <motion.div
            className="absolute bottom-20 right-10 w-24 h-24 bg-gradient-to-br from-indigo-400/8 to-blue-400/8 rounded-full blur-xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.15, 0.25, 0.15],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
          />

          {/* Floating Particles Inside Card */}
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute rounded-full bg-gradient-to-r from-blue-400/5 to-indigo-400/5 backdrop-blur-sm"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
              }}
              animate={{
                y: [0, -30, 0],
                x: [0, 10, 0],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: particle.duration,
                repeat: Infinity,
                delay: particle.delay,
                ease: "easeInOut",
              }}
            />
          ))}

          {/* Card Content */}
          <div className="relative z-10">
            {/* Integrated Navigation Bar - Unified with card */}
            <div className="border-b border-gray-200/20 px-6 py-3">
              <div className="flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center space-x-2 space-x-reverse">
                  <span className="text-xl font-poppins text-gray-900">spike</span>
                  <div className="w-8 h-8 drop-shadow-sm">
                    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
                      <defs>
                        <linearGradient id="lightningGradientDashboard" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#3B82F6" />
                          <stop offset="100%" stopColor="#6366F1" />
                        </linearGradient>
                      </defs>
                      <path 
                        d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" 
                        fill="url(#lightningGradientDashboard)"
                        stroke="url(#lightningGradientDashboard)"
                        strokeWidth="0"
                      />
                    </svg>
                  </div>
                </div>

                {/* Main Navigation */}
                <nav className="flex items-center bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 p-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.name}
                      onClick={() => setActiveTab(tab.name)}
                      className={`flex items-center space-x-3 space-x-reverse px-4 py-2 rounded-lg transition-all duration-200 ${
                        activeTab === tab.name 
                          ? "text-white bg-gray-800 shadow-sm" 
                          : "text-gray-700 hover:text-gray-900"
                      }`}
                    >
                      {React.cloneElement(tab.icon, {
                        className: "w-6 h-6",
                        style: activeTab === tab.name 
                          ? { 
                              color: 'white'
                            }
                          : {}
                      })}
                      <span className="font-semibold text-base">{tab.name}</span>
                    </button>
                  ))}
                </nav>

                {/* Right Side Actions */}
                <div className="flex items-center space-x-4 space-x-reverse">
                  {/* Notification Bell with White Background */}
                  <div className="relative">
                    <button 
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="notifications-dropdown p-2.5 text-gray-700 hover:text-blue-600 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200/50 transition-all duration-200 relative hover:shadow-md" 
                      title="התראות"
                    >
                      <Bell className="w-5 h-5" />
                      {/* Notification badge */}
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
                        3
                      </div>
                    </button>

                    {/* Notifications Dropdown */}
                    {showNotifications && (
                      <div className="notifications-dropdown absolute top-12 left-0 z-50 w-64 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 max-h-[calc(98vh-200px)] overflow-hidden">
                        <div className="p-4 border-b border-gray-200/30">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">התראות</h3>
                            <button
                              onClick={() => setShowNotifications(false)}
                              className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          <Notifications />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Professional User Avatar with Dropdown */}
                  <div className="relative profile-dropdown">
                    <button 
                      onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                      className="flex items-center space-x-3 space-x-reverse p-2 text-gray-700 hover:text-blue-600 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200/50 transition-all duration-200" 
                      title="פרופיל"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showProfileDropdown ? 'rotate-0' : 'rotate-180'}`} />
                      <span className="font-semibold text-gray-900">
                        {getDisplayName()}
                      </span>
                      <Avatar className="w-8 h-8 border-2 border-gray-200 hover:border-blue-300 transition-all duration-200">
                        <AvatarImage 
                          src={userSession?.user?.image} 
                          alt={userSession?.user?.name || "משתמש"}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold text-sm">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </button>

                    {/* Profile Dropdown */}
                    {showProfileDropdown && (
                      <div className="absolute top-12 left-0 z-50 w-48 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 overflow-hidden max-h-[calc(98vh-200px)] overflow-y-auto">
                        <div className="p-3 border-b border-gray-200/30">
                          <div className="flex items-center space-x-3 space-x-reverse">
                            <Avatar className="w-8 h-8 border-2 border-gray-200">
                              <AvatarImage 
                                src={userSession?.user?.image} 
                                alt={userSession?.user?.name || "משתמש"}
                              />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                                {getUserInitials()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {getDisplayName()}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {getDisplayEmail()}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="p-2">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center space-x-3 space-x-reverse px-2 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors duration-200"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>התנתקות</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="p-8 max-h-[calc(98vh-120px)] overflow-y-auto">
              {/* Welcome Section - Only show on Home tab */}
              {activeTab === "בית" && (
                <div className="mb-8">
                  <div className="mb-2">
                    <h1 className="text-3xl font-bold text-black text-right">שלום אור 👋</h1>
                  </div>
                  <p className="text-gray-600 text-right">הנה כל הדברים החשובים שמחכים לך השבוע, במקום אחד מסודר.</p>
                </div>
              )}

              {/* Content */}
              <div className="overflow-y-auto">
                {activeTab === "בית" && <HomeContent onNavigateToTab={handleNavigateToTab} />}
                {activeTab === "קורסים" && <CoursesContent />}
                {activeTab === "מטלות" && <AssignmentsContent />}
                {activeTab === "מערכת שעות" && <ScheduleContent />}
                {activeTab === "מייל" && <EmailContent />}
                {activeTab === "אירועים" && <EventsContent />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </ProtectedRoute>
  )
}
