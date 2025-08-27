"use client"

import { Hero } from "../components/ui/animated-hero"
import { HeroScrollDemo } from "../components/ui/hero-scroll-demo"
import { NavigationHeader } from "../components/ui/navigation-header"
import { Button } from "../components/ui/button"
import { MoveRight } from "lucide-react"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LoginPopup } from "../components/auth/login-popup"
import { 
  Zap, 
  Shield, 
  Clock, 
  Users, 
  BarChart3, 
  Calendar,
  CheckCircle,
  Star,
  Linkedin,
  Facebook,
  Twitter,
  Mail,
  MapPin
} from "lucide-react"

export default function HomePage() {
  const router = useRouter();
  const [titleNumber, setTitleNumber] = useState(0);
  const [isLoginPopupOpen, setIsLoginPopupOpen] = useState(false);
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    duration: number;
    delay: number;
  }>>([]);

  // Generate particles only on client side to prevent hydration mismatch
  useEffect(() => {
    const generatedParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 5,
    }));
    setParticles(generatedParticles);
  }, []);

  // Animate title words
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === 5) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber]);

  const handleCTAClick = () => {
    // Open login popup
    setIsLoginPopupOpen(true)
  }

  const handleDemoClick = () => {
    // Open login popup for demo
    setIsLoginPopupOpen(true)
  }

  const features = [
    {
      icon: Zap,
      title: "אינטגרציה חכמה",
      description: "חיבור אוטומטי לכל מערכות הלימוד שלך - Moodle, מערכת שעות, מייל אוניברסיטאי ועוד",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      icon: Shield,
      title: "אבטחה מתקדמת",
      description: "הגנה על המידע שלך עם אבטחה ברמה הבנקאית וציות לתקנות הפרטיות",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      icon: Clock,
      title: "חיסכון בזמן",
      description: "חסוך שעות של ניהול ידני - הכל מאורגן אוטומטית במקום אחד",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      icon: Users,
      title: "תקשורת משופרת",
      description: "גישה מהירה לעמיתים לספסל הלימודים וצוות המחלקה",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      icon: BarChart3,
      title: "ניתוח ביצועים",
      description: "מעקב מתקדם אחר הציונים, התקדמות וזיהוי מוקדם של בעיות",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      icon: Calendar,
      title: "תזמון חכם",
      description: "לוח זמנים דינמי שמתעדכן אוטומטית עם כל שינוי במערכת",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    }
  ];

  const benefits = [
    {
      icon: CheckCircle,
      title: "הפחתת לחץ",
      description: "אל תפספס עוד דדליין או אירוע חשוב"
    },
    {
      icon: Star,
      title: "שיפור ציונים",
      description: "מעקב שיטתי מוביל לביצועים טובים יותר"
    },
    {
      icon: Zap,
      title: "יעילות מקסימלית",
      description: "חסוך זמן יקר לפעילויות חשובות יותר"
    }
  ];

  return (
    <div className="min-h-screen bg-white" dir="rtl" style={{ position: 'relative' }}>
      {/* Navigation Header */}
      <NavigationHeader />

      {/* Subtle Blue Accents */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50/30 to-white"></div>

      {/* Animated Blue Accents */}
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

      {/* Floating Particles */}
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

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px] opacity-20" />

      {/* Content */}
      <div className="relative z-10 pt-16">
        {/* Hero Section */}
        <section className="relative">
          <Hero onLoginClick={() => setIsLoginPopupOpen(true)} />
        </section>

        {/* Hero Scroll Demo - Right after Hero */}
        <section className="py-0 bg-transparent -mt-24">
          <HeroScrollDemo />
        </section>

        {/* Main Heading Section */}
        <section className="py-32 px-4 relative overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50/30 to-white"></div>
          <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px] opacity-20"></div>
          

          
          <div className="w-full relative z-10">
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="relative">
                {/* Enhanced background gradient effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-blue-800/10 rounded-3xl blur-3xl"></div>
                
                {/* Main heading with enhanced styling */}
                <motion.h1 
                  className="relative text-5xl md:text-7xl max-w-5xl tracking-tighter text-center font-regular mx-auto bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, ease: "easeOut" }}
                >
                  <span className="text-gray-900">כל ה</span>
                  <span className="relative inline-block mx-2 min-w-[250px] text-center">
                    {["מטלות", "ציונים", "מבחנים", "מסמכים", "מיילים", "קורסים"].map((title, index) => (
                      <motion.span
                        key={index}
                        className="absolute left-0 right-0 font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
                        initial={{ y: 50, opacity: 0, scale: 0.8 }}
                        animate={
                          titleNumber === index
                            ? {
                                y: 0,
                                opacity: 1,
                                scale: 1,
                              }
                            : {
                                y: titleNumber > index ? -50 : 50,
                                opacity: 0,
                                scale: 0.8,
                              }
                        }
                        transition={{ 
                          type: "spring", 
                          stiffness: 200,
                          damping: 20,
                          duration: 0.6
                        }}
                      >
                        {title}
                      </motion.span>
                    ))}
                    {/* Placeholder to maintain height */}
                    <span className="invisible">מטלות</span>
                  </span>
                  <span className="text-gray-900">במקום אחד.</span>
                </motion.h1>
                
                {/* Enhanced decorative elements */}
                <motion.div
                  className="absolute -top-4 -left-4 w-8 h-8 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full opacity-60"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.6, 0.8, 0.6],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <motion.div
                  className="absolute -bottom-4 -right-4 w-6 h-6 bg-gradient-to-r from-indigo-400 to-blue-400 rounded-full opacity-60"
                  animate={{
                    scale: [1.2, 1, 1.2],
                    opacity: [0.6, 0.8, 0.6],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1,
                  }}
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-4">
          <div className="w-full">
            {/* Section Header */}
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                למה <span className="text-blue-600">spike</span>?
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                הפלטפורמה החכמה שמחברת את כל מערכות הלימוד שלך במקום אחד, 
                ומביאה לך את העתיד של ניהול לימודים
              </p>
            </motion.div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="group relative"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <feature.icon className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Students for Students Section */}
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="rounded-3xl p-12">
                <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  נבנה על ידי <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">סטודנטים</span>, 
                  בשביל <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">סטודנטים</span>
                </h3>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                  אנחנו יודעים בדיוק מה אתם צריכים כי אנחנו היינו שם. 
                  spike נוצר מהניסיון האישי שלנו כסטודנטים, 
                  כדי לתת לכם את הכלים הטובים ביותר להצלחה אקדמית
                </p>
              </div>
            </motion.div>

            {/* Benefits Section */}
            <motion.div 
              className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-3xl p-12 border border-blue-200/30"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="text-center mb-12">
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  התוצאות שתקבל
                </h3>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  סטודנטים שמשתמשים ב-spike מדווחים על שיפור משמעותי בחוויית הלימודים
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                  >
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <benefit.icon className="w-8 h-8 text-blue-600" />
                    </div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-3">{benefit.title}</h4>
                    <p className="text-gray-600">{benefit.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* CTA Section */}
            <motion.div 
              className="text-center mt-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h3 className="text-3xl font-bold text-gray-900 mb-6">
                מוכן להתחיל?
              </h3>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                הצטרף לאלפי סטודנטים שכבר משתמשים ב-spike ומשפרים את חוויית הלימודים שלהם
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="gap-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                  onClick={handleCTAClick}
                >
                  התחבר עכשיו <MoveRight className="w-4 h-4" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="gap-4 border-2 border-blue-600 text-blue-600 hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-600 hover:text-white transition-all duration-300"
                  onClick={() => router.push('/test-login')}
                >
                  🧪 טסט המערכת <MoveRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-16 px-4 bg-gray-50/50">
          <div className="w-full">
            <div className="flex flex-col gap-8 items-center">
              {/* Contact Title */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="text-center"
              >
                <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                  צור <span className="text-blue-600">קשר</span>
                </h2>
                <p className="text-lg lg:text-xl text-gray-600 leading-relaxed max-w-md mx-auto">
                  יש לך שאלות או הצעות? אנחנו כאן לעזור!
                </p>
              </motion.div>

              {/* Contact Form */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="w-full max-w-2xl"
              >
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 lg:p-8 border border-gray-200/50 shadow-xl">
                  <form className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 text-right">שם מלא</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-right"
                        placeholder="הכנס את שמך המלא"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 text-right">אימייל</label>
                      <input
                        type="email"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-right"
                        placeholder="הכנס את האימייל שלך"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 text-right">הודעה</label>
                      <textarea
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-right resize-none"
                        placeholder="כתוב את ההודעה שלך כאן..."
                      />
                    </div>
                    <Button 
                      size="lg"
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg mt-2"
                    >
                      שלח הודעה
                    </Button>
                  </form>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-50/50 border-t border-gray-200/50 mt-20">
          <div className="w-full px-4 py-12">
            <div className="flex flex-col md:flex-row justify-between items-center">
              {/* Logo and Description */}
              <div className="flex flex-col items-center md:items-start mb-8 md:mb-0">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl font-poppins text-gray-900">spike</span>
                  <div className="w-6 h-6">
                    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
                      <defs>
                        <linearGradient id="lightningGradientLanding" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#3B82F6" />
                          <stop offset="100%" stopColor="#6366F1" />
                        </linearGradient>
                      </defs>
                      <path 
                        d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" 
                        fill="url(#lightningGradientLanding)"
                        stroke="url(#lightningGradientLanding)"
                        strokeWidth="0"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-600 text-center md:text-right max-w-md">
                  הפלטפורמה החכמה לניהול לימודים - חיבור כל המערכות במקום אחד
                </p>
              </div>

              {/* Social Links */}
              <div className="flex gap-4">
                <motion.a
                  href="#"
                  className="w-12 h-12 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 flex items-center justify-center hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-200 transition-all duration-300 group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Linkedin className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-all duration-300" />
                </motion.a>
                <motion.a
                  href="#"
                  className="w-12 h-12 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 flex items-center justify-center hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-200 transition-all duration-300 group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Facebook className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-all duration-300" />
                </motion.a>
                <motion.a
                  href="#"
                  className="w-12 h-12 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 flex items-center justify-center hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-200 transition-all duration-300 group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Twitter className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-all duration-300" />
                </motion.a>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="border-t border-gray-200/50 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-500 text-sm text-center md:text-right mb-4 md:mb-0">
                © 2024 spike. כל הזכויות שמורות.
              </p>
              <div className="flex gap-6 text-sm">
                <a href="#" className="text-gray-500 hover:text-gray-700 transition-colors duration-300">
                  תנאי שימוש
                </a>
                <a href="#" className="text-gray-500 hover:text-gray-700 transition-colors duration-300">
                  מדיניות פרטיות
                </a>
                <a href="#" className="text-gray-500 hover:text-gray-700 transition-colors duration-300">
                  צור קשר
                </a>
              </div>
            </div>
          </div>
        </footer>

        {/* Login Popup */}
        <LoginPopup 
          isOpen={isLoginPopupOpen} 
          onClose={() => setIsLoginPopupOpen(false)} 
        />
      </div>
    </div>
  )
} 