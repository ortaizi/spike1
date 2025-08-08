"use client"

import React, { useState, useEffect, Suspense } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { signIn, useSession } from "next-auth/react"
import {
  Eye,
  EyeOff,
  User,
  Lock,
  GraduationCap,
  Home,
  CheckCircle,
  AlertCircle,
  Loader2,
  Zap,
  X,
  ExternalLink,
  Shield,
  Clock,
  Mail,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Error Boundary for Auth Page
class AuthErrorBoundary extends React.Component<any, { hasError: boolean; error: Error | null }> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Auth page error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">שגיאה בטעינת דף ההתחברות</h1>
            <p className="text-gray-600 mb-4">אירעה שגיאה בטעינת דף ההתחברות</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              נסה שוב
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Loading Component for Auth
const AuthLoading = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">טוען דף התחברות...</p>
    </div>
  </div>
)

export default function AuthPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect if already authenticated
  useEffect(() => {
    if (status === "authenticated" && session) {
      console.log('User is authenticated, redirecting to dashboard');
      router.push("/dashboard")
    }
  }, [session, status, router])

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const result = await signIn("google", { 
        callbackUrl: "/dashboard",
        redirect: false 
      })

      if (result?.error) {
        setError("שגיאה בהתחברות עם Google")
      } else if (result?.ok) {
        setShowSuccess(true)
        // Redirect will be handled by useEffect
      }
    } catch (error) {
      console.error('Google sign in error:', error)
      setError("שגיאה בהתחברות עם Google")
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading during session check
  if (status === "loading") {
    return <AuthLoading />
  }

  // Don't show auth page if already authenticated
  if (status === "authenticated") {
    return <AuthLoading />
  }

  return (
    <Suspense fallback={<AuthLoading />}>
      <AuthErrorBoundary>
        <div className="min-h-screen bg-[#F8F9FA]" dir="rtl" style={{ fontFamily: "Assistant, sans-serif" }} suppressHydrationWarning>
          {/* Header */}
          <header className="bg-white shadow-sm border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-poppins text-gray-900">spike</span>
                  <Zap className="w-8 h-8 text-[#0066CC] font-bold fill-current" strokeWidth={0} />
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

          <div className="flex min-h-[calc(100vh-4rem)]">
            {/* Form Section - Left (60%) */}
            <div className="flex-[0.6] flex items-center justify-center p-8 bg-white">
              <div className="w-full max-w-md">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="relative"
                >
                  {/* Overlays */}
                  <AnimatePresence>
                    {showSuccess && (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg"
                      >
                        <div className="text-center">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                          >
                            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                          </motion.div>
                          <motion.h3
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-xl font-semibold text-gray-900 mb-2"
                          >
                            התחברת בהצלחה!
                          </motion.h3>
                          <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="text-gray-600"
                          >
                            מעביר אותך למערכת...
                          </motion.p>
                        </div>
                      </motion.div>
                    )}
                    {isLoading && (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-white/80 backdrop-blur-[3px] flex items-center justify-center z-40 rounded-lg"
                      >
                        <div className="text-center">
                          <Loader2 className="w-8 h-8 animate-spin text-[#0066CC] mx-auto mb-4" />
                          <p className="text-[#0066CC] font-medium">מתחבר עם Google...</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Form Header */}
                  <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-3">אנחנו מתחברים – אתה מתפנה ללמוד</h1>
                    <p className="text-gray-600 leading-relaxed">
                      תן לנו רגע לזהות אותך – ונחבר אותך בקליק לכל מערכות הלימוד שלך
                    </p>
                  </div>

                  {/* Google Sign In Button */}
                  <div className="space-y-6">
                    <Button
                      onClick={handleGoogleSignIn}
                      disabled={isLoading}
                      className="w-full bg-white hover:bg-gray-50 text-gray-900 py-3.5 rounded-lg font-medium transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl border border-gray-300 flex items-center justify-center gap-3"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          מתחבר...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          התחבר עם Google
                        </>
                      )}
                    </Button>

                    {/* Error Message */}
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 border border-red-200 rounded-lg p-4"
                      >
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-red-500" />
                          <p className="text-red-700 text-sm">{error}</p>
                        </div>
                      </motion.div>
                    )}

                    {/* Info Section */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="font-medium text-blue-900 mb-2">איך זה עובד?</h3>
                      <div className="space-y-2 text-sm text-blue-800">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>התחבר עם Google שלך</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>הגדר פרטי מוסד לימוד (פעם אחת בלבד)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>קבל גישה לכל מערכות הלימוד שלך</span>
                        </div>
                      </div>
                    </div>

                    {/* Security Notice */}
                    <div className="text-center text-sm text-gray-500">
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <Shield className="w-4 h-4" />
                        <span>אבטחה ברמה הבנקאית</span>
                      </div>
                      <p>הפרטים שלך מוצפנים ונשמרים בצורה מאובטחת</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Visual Section - Right (40%) */}
            <div className="flex-[0.4] relative overflow-hidden hidden lg:flex flex-col items-center justify-center">
              {/* Enhanced Background Gradients */}
              <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50/30 to-white"></div>
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

              {/* Grid Pattern */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px] opacity-20" />

              {/* Geometric Shapes */}
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

              {/* Floating Particles */}
              <motion.div
                animate={{
                  x: [0, 20, 0],
                  y: [0, -15, 0],
                }}
                transition={{
                  duration: 6,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
                className="absolute top-1/4 left-8 w-6 h-6 bg-gradient-to-r from-blue-400/5 to-indigo-400/5 backdrop-blur-sm rounded-full"
              />

              <motion.div
                animate={{
                  x: [0, -25, 0],
                  y: [0, 20, 0],
                }}
                transition={{
                  duration: 5,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                  delay: 1,
                }}
                className="absolute bottom-1/4 right-12 w-4 h-4 bg-gradient-to-r from-indigo-400/5 to-blue-400/5 backdrop-blur-sm rounded-full"
              />

              <motion.div
                animate={{
                  x: [0, 15, 0],
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                  delay: 2,
                }}
                className="absolute top-3/4 left-1/4 w-3 h-3 bg-gradient-to-r from-blue-400/5 to-indigo-400/5 backdrop-blur-sm rounded-full"
              />

              {/* Main Content */}
              <div className="relative z-10 text-center max-w-sm">
                <motion.div
                  animate={{
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                  className="mb-8"
                >
                  <div className="w-40 h-40 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-2xl mx-auto">
                    <Mail className="w-20 h-20 text-white" />
                  </div>
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-gray-900 mb-4"
                >
                  התחברות מהירה ובטוחה
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-gray-600 leading-relaxed mb-8"
                >
                  השתמש בחשבון Google שלך להתחברות מהירה ומאובטחת למערכת
                </motion.p>

                {/* Enhanced Trust Badges */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-300">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Shield className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-sm text-gray-700 font-medium">מאובטח</p>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-300">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-sm text-gray-700 font-medium">מאומת</p>
                  </div>
                </motion.div>

                {/* Additional Features */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="mt-8 space-y-3"
                >
                  <div className="flex items-center justify-center space-x-2 space-x-reverse text-sm text-gray-600">
                    <Zap className="w-4 h-4 text-blue-600" />
                    <span>התחברות מהירה עם Google</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2 space-x-reverse text-sm text-gray-600">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span>אבטחה ברמה הבנקאית</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2 space-x-reverse text-sm text-gray-600">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>חיסכון משמעותי בזמן</span>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Mobile Responsive Styles */}
          <style jsx global>{`
            @media (max-width: 1024px) {
              .flex-\\[0\\.4\\] {
                display: none !important;
              }
              .flex-\\[0\\.6\\] {
                flex: 1 !important;
              }
            }
            
            @media (max-width: 640px) {
              .min-h-\\[calc\$$100vh-4rem\$$\\] .flex-\\[0\\.6\\] {
                padding: 1rem !important;
              }
            }
          `}</style>
        </div>
      </AuthErrorBoundary>
    </Suspense>
  )
}
