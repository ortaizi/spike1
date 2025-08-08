"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ContainerScroll } from "./container-scroll-animation";
import { 
  Settings, 
  UserCircle2, 
  Calendar, 
  GraduationCap, 
  ClipboardList, 
  Mail, 
  CalendarDays, 
  Bell, 
  FileText, 
  Clock, 
  LogOut, 
  Zap,
  BarChart3,
  Shield,
  CreditCard
} from "lucide-react";

export function HeroScrollDemo() {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  
  // Demo data for dashboard preview - organized by categories
  const dashboardSections = [
    {
      title: "מטלות ומיילים",
      cards: [
        {
          title: "מיילים לא נקראו",
          icon: Mail,
          iconColor: "text-sky-600",
          value: "12",
          subtitle: "מיילים לא נקראו",
        },
        {
          title: "מטלות פתוחות",
          icon: ClipboardList,
          iconColor: "text-orange-600",
          value: "5",
          subtitle: "מטלות פתוחות",
        },
      ]
    },
    {
      title: "ציונים ומבחנים",
      cards: [
        {
          title: "ציונים שפורסמו",
          icon: BarChart3,
          iconColor: "text-emerald-600",
          items: [
            { label: "יסודות האלגוריתמים", value: "87" },
            { label: "מבוא לסטטיסטיקה", value: "92" },
          ],
        },
        {
          title: "מבחנים ובחינות קרובים",
          icon: Calendar,
          iconColor: "text-indigo-600",
          items: [
            { label: "בחינת אמצע - אלגוריתמים", value: "30/04/2025" },
            { label: "בוחן - סטטיסטיקה", value: "05/05/2025" },
          ],
        },
      ]
    },
    {
      title: "אירועים ותשלומים",
      cards: [
        {
          title: "אירועים וסדנאות",
          icon: Calendar,
          iconColor: "text-rose-600",
          items: [
            { label: "סדנת ניהול זמן", value: "25/04/2025" },
            { label: "כנס יזמות אוניברסיטאי", value: "01/05/2025" },
          ],
        },
        {
          title: "שכר לימודי",
          icon: CreditCard,
          iconColor: "text-amber-600",
          items: [
            { label: "יתרה לתשלום", value: "₪4,250", urgent: true },
            { label: "לתשלום עד", value: "30/04/2025" },
          ],
        },
      ]
    },
    {
      title: "מילואים ופרופיל",
      cards: [
        {
          title: "ימי מילואים",
          icon: Shield,
          iconColor: "text-slate-600",
          items: [
            { label: "מס׳ ימים מתחילת שנה", value: "12" },
            { label: "קבוצה", value: "5" },
          ],
        },
        {
          title: "פרופיל סטודנט",
          icon: UserCircle2,
          iconColor: "text-blue-600",
          items: [
            { label: "שנה", value: "שנה ב׳" },
            { label: "מחלקה", value: "מדעי המחשב" },
          ],
        },
      ]
    }
  ];

  const notifications = [
    {
      id: 1,
      type: "assignment",
      title: "תרגיל בית 3 - אלגוריתמים",
      message: "דדליין חדש: 25/04/2025",
      time: "לפני 2 שעות",
      urgent: true,
    },
    {
      id: 2,
      type: "grade",
      title: "ציון חדש - מבוא לסטטיסטיקה",
      message: "ציון: 92/100",
      time: "לפני 4 שעות",
      urgent: false,
    },
    {
      id: 3,
      type: "exam",
      title: "בחינת אמצע - אלגוריתמים",
      message: "תאריך: 30/04/2025, שעה: 10:00",
      time: "לפני 6 שעות",
      urgent: true,
    },
    {
      id: 4,
      type: "email",
      title: "הודעה מהמרצה - ד\"ר כהן",
      message: "עדכון לגבי מועד הבחינה",
      time: "לפני 8 שעות",
      urgent: false,
    },
  ];

  const tabs = [
    { name: "בית", icon: <Calendar className="w-6 h-6" /> },
    { name: "קורסים", icon: <GraduationCap className="w-6 h-6" /> },
    { name: "מטלות", icon: <ClipboardList className="w-6 h-6" /> },
    { name: "מערכת שעות", icon: <Calendar className="w-6 h-6" /> },
    { name: "מייל", icon: <Mail className="w-6 h-6" /> },
    { name: "אירועים", icon: <CalendarDays className="w-6 h-6" /> },
  ];

  // Auto-rotate through sections
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCardIndex((prev) => (prev + 1) % dashboardSections.length);
    }, 4000); // Change every 4 seconds

    return () => clearInterval(interval);
  }, [dashboardSections.length]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut" as const
      }
    }
  };

  const cardVariants = {
    enter: { opacity: 0, x: 50 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };

  return (
    <div className="flex flex-col overflow-hidden pb-[50px] -pt-16" style={{ position: 'relative' }}>
      <ContainerScroll
        titleComponent={null}
      >
        {/* Dashboard Interface */}
        <motion.div 
          className="flex h-full w-full bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden shadow-2xl border border-white/20 m-0"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Left Sidebar */}
          <motion.div 
            className="w-16 bg-white/90 backdrop-blur-sm border-l border-gray-200/50 flex flex-col items-center py-6 space-y-8"
            variants={itemVariants}
          >
            {/* Logo */}
            <div className="flex flex-col items-center">
              <div className="p-2 bg-blue-50/80 rounded-lg border border-blue-200/50 shadow-sm">
                <Zap className="w-5 h-5 text-blue-600 font-bold drop-shadow-sm fill-current" strokeWidth={0} />
              </div>
            </div>

            {/* Navigation tabs */}
            <div className="flex flex-col space-y-4">
              {tabs.map((tab, index) => (
                <motion.button
                  key={tab.name}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    index === 0 
                      ? "bg-blue-50/80 text-blue-600 shadow-sm border border-blue-200/50" 
                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-100/80"
                  }`}
                  title={tab.name}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {tab.icon}
                </motion.button>
              ))}
            </div>

            {/* Settings and logout */}
            <div className="flex flex-col space-y-4 mt-auto">
              <motion.button 
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100/80 rounded-lg transition-all duration-200" 
                title="הגדרות"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Settings className="w-6 h-6" />
              </motion.button>
              <motion.button 
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100/80 rounded-lg transition-all duration-200" 
                title="התנתקות"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <LogOut className="w-6 h-6" />
              </motion.button>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div 
            className="flex-1 p-4 overflow-hidden"
            variants={itemVariants}
          >
            {/* Welcome Section */}
            <motion.div 
              className="mb-8"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h1 className="text-3xl font-bold text-gray-900 mb-2">שלום! 👋</h1>
              <p className="text-base text-gray-600">הנה כל הדברים החשובים שמחכים לך השבוע, במקום אחד מסודר.</p>
            </motion.div>

            {/* Dashboard Content */}
            <div className="space-y-6 overflow-hidden">
              {/* Main Layout: Left (Notifications) + Right (Animated Cards) */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 overflow-hidden">
                {/* Left Side - Notifications */}
                <motion.div 
                  className="lg:col-span-2 max-h-full"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200/50 p-4 h-full shadow-lg">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">הודעות אחרונות</h3>
                      <Bell className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto">
                      {notifications.map((notification, index) => (
                        <motion.div
                          key={notification.id}
                          className={`p-4 rounded-lg border ${
                            notification.urgent 
                              ? "border-red-200/50 bg-red-50/80" 
                              : "border-gray-200/50 bg-gray-50/80"
                          }`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900 mb-1">{notification.title}</h4>
                              <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                              <span className="text-xs text-gray-500">{notification.time}</span>
                            </div>
                            {notification.urgent && (
                              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse ml-2"></div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Right Side - Animated Cards */}
                <motion.div 
                  className="lg:col-span-3 max-h-full"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  {/* Section Title */}
                  <motion.div
                    key={currentCardIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5 }}
                    className="mb-4"
                  >
                    <h3 className="text-lg font-semibold text-gray-700 text-center">
                      {dashboardSections[currentCardIndex].title}
                    </h3>
                  </motion.div>

                  {/* Animated Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-full">
                    <AnimatePresence>
                      {dashboardSections[currentCardIndex].cards.map((card, index) => (
                        <motion.div 
                          key={`${currentCardIndex}-${index}`}
                          className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200/50 p-4 overflow-hidden min-h-[200px] max-h-[300px] shadow-lg"
                          variants={cardVariants}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          transition={{ duration: 0.6, delay: index * 0.2 }}
                          whileHover={{ scale: 1.02 }}
                        >
                          {/* Header with Icon */}
                          <div className="flex items-center space-x-3 space-x-reverse mb-4">
                            <div className="p-2 bg-gray-50/80 rounded-lg">
                              <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                            </div>
                            <h3 className="text-sm font-medium text-gray-900">{card.title}</h3>
                          </div>

                          {/* Content */}
                          {card.value ? (
                            /* Large Number Display */
                            <div className="text-center mb-4 overflow-hidden">
                              <div className="text-4xl font-bold text-slate-900 mb-1">{card.value}</div>
                              <p className="text-sm font-medium text-slate-600">{card.subtitle}</p>
                            </div>
                          ) : (
                            /* Items List */
                            <div>
                              <p className="text-xs text-gray-500 mb-4">עדכונים אחרונים</p>
                              <div className="space-y-3 mb-6 overflow-hidden overflow-y-auto max-h-[150px]">
                                {card.items?.map((item, itemIndex) => (
                                  <motion.div 
                                    key={itemIndex} 
                                    className="flex justify-between items-center py-2 px-3 bg-gray-50/80 rounded-lg"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: 0.8 + itemIndex * 0.1 }}
                                  >
                                    <span className="text-sm text-gray-600">{item.label}</span>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                      <span className="text-base font-semibold text-slate-900">{item.value}</span>
                                      {item.urgent && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>}
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Progress Indicators */}
                  <div className="flex justify-center mt-4 space-x-2 space-x-reverse">
                    {dashboardSections.map((_, index) => (
                      <motion.button
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          index === currentCardIndex 
                            ? "bg-blue-600 scale-125" 
                            : "bg-gray-300 hover:bg-gray-400"
                        }`}
                        onClick={() => setCurrentCardIndex(index)}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                      />
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </ContainerScroll>
    </div>
  );
} 