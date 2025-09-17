'use client';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  Bell,
  Calendar,
  CalendarDays,
  ClipboardList,
  CreditCard,
  GraduationCap,
  LogOut,
  Mail,
  Settings,
  Shield,
  UserCircle2,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { ContainerScroll } from './container-scroll-animation';



export function HeroScrollDemo() {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // Demo data for dashboard preview - organized by categories
  const dashboardSections = [
    {
      title: 'מטלות ומיילים',
      cards: [
        {
          title: 'מיילים לא נקראו',
          icon: Mail,
          iconColor: 'text-sky-600',
          value: '12',
          subtitle: 'מיילים לא נקראו',
        },
        {
          title: 'מטלות פתוחות',
          icon: ClipboardList,
          iconColor: 'text-orange-600',
          value: '5',
          subtitle: 'מטלות פתוחות',
        },
      ],
    },
    {
      title: 'ציונים ומבחנים',
      cards: [
        {
          title: 'ציונים שפורסמו',
          icon: BarChart3,
          iconColor: 'text-emerald-600',
          items: [
            { label: 'יסודות האלגוריתמים', value: '87' },
            { label: 'מבוא לסטטיסטיקה', value: '92' },
          ],
        },
        {
          title: 'מבחנים ובחינות קרובים',
          icon: Calendar,
          iconColor: 'text-indigo-600',
          items: [
            { label: 'בחינת אמצע - אלגוריתמים', value: '30/04/2025' },
            { label: 'בוחן - סטטיסטיקה', value: '05/05/2025' },
          ],
        },
      ],
    },
    {
      title: 'אירועים ותשלומים',
      cards: [
        {
          title: 'אירועים וסדנאות',
          icon: Calendar,
          iconColor: 'text-rose-600',
          items: [
            { label: 'סדנת ניהול זמן', value: '25/04/2025' },
            { label: 'כנס יזמות אוניברסיטאי', value: '01/05/2025' },
          ],
        },
        {
          title: 'שכר לימודי',
          icon: CreditCard,
          iconColor: 'text-amber-600',
          items: [
            { label: 'יתרה לתשלום', value: '₪4,250', urgent: true },
            { label: 'לתשלום עד', value: '30/04/2025' },
          ],
        },
      ],
    },
    {
      title: 'מילואים ופרופיל',
      cards: [
        {
          title: 'ימי מילואים',
          icon: Shield,
          iconColor: 'text-slate-600',
          items: [
            { label: 'מס׳ ימים מתחילת שנה', value: '12' },
            { label: 'קבוצה', value: '5' },
          ],
        },
        {
          title: 'פרופיל סטודנט',
          icon: UserCircle2,
          iconColor: 'text-blue-600',
          items: [
            { label: 'שנה', value: 'שנה ב׳' },
            { label: 'מחלקה', value: 'מדעי המחשב' },
          ],
        },
      ],
    },
  ];

  const notifications = [
    {
      id: 1,
      type: 'assignment',
      title: 'תרגיל בית 3 - אלגוריתמים',
      message: 'דדליין חדש: 25/04/2025',
      time: 'לפני 2 שעות',
      urgent: true,
    },
    {
      id: 2,
      type: 'grade',
      title: 'ציון חדש - מבוא לסטטיסטיקה',
      message: 'ציון: 92/100',
      time: 'לפני 4 שעות',
      urgent: false,
    },
    {
      id: 3,
      type: 'exam',
      title: 'בחינת אמצע - אלגוריתמים',
      message: 'תאריך: 30/04/2025, שעה: 10:00',
      time: 'לפני 6 שעות',
      urgent: true,
    },
    {
      id: 4,
      type: 'email',
      title: 'הודעה מהמרצה - ד"ר כהן',
      message: 'עדכון לגבי מועד הבחינה',
      time: 'לפני 8 שעות',
      urgent: false,
    },
  ];

  const tabs = [
    { name: 'בית', icon: <Calendar className='h-6 w-6' /> },
    { name: 'קורסים', icon: <GraduationCap className='h-6 w-6' /> },
    { name: 'מטלות', icon: <ClipboardList className='h-6 w-6' /> },
    { name: 'מערכת שעות', icon: <Calendar className='h-6 w-6' /> },
    { name: 'מייל', icon: <Mail className='h-6 w-6' /> },
    { name: 'אירועים', icon: <CalendarDays className='h-6 w-6' /> },
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
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut' as const,
      },
    },
  };

  const cardVariants = {
    enter: { opacity: 0, x: 50 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  };

  return (
    <div
      className='-pt-16 flex flex-col overflow-hidden pb-[50px]'
      style={{ position: 'relative' }}
    >
      <ContainerScroll titleComponent={null}>
        {/* Dashboard Interface */}
        <motion.div
          className='m-0 flex h-full w-full overflow-hidden rounded-2xl border border-white/20 bg-white/95 shadow-2xl backdrop-blur-sm'
          variants={containerVariants}
          initial='hidden'
          animate='visible'
        >
          {/* Left Sidebar */}
          <motion.div
            className='flex w-16 flex-col items-center space-y-8 border-l border-gray-200/50 bg-white/90 py-6 backdrop-blur-sm'
            variants={itemVariants}
          >
            {/* Logo */}
            <div className='flex flex-col items-center'>
              <div className='rounded-lg border border-blue-200/50 bg-blue-50/80 p-2 shadow-sm'>
                <Zap
                  className='h-5 w-5 fill-current font-bold text-blue-600 drop-shadow-sm'
                  strokeWidth={0}
                />
              </div>
            </div>

            {/* Navigation tabs */}
            <div className='flex flex-col space-y-4'>
              {tabs.map((tab, index) => (
                <motion.button
                  key={tab.name}
                  className={`rounded-lg p-2 transition-all duration-200 ${
                    index === 0
                      ? 'border border-blue-200/50 bg-blue-50/80 text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-800'
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
            <div className='mt-auto flex flex-col space-y-4'>
              <motion.button
                className='rounded-lg p-2 text-gray-600 transition-all duration-200 hover:bg-gray-100/80 hover:text-gray-800'
                title='הגדרות'
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Settings className='h-6 w-6' />
              </motion.button>
              <motion.button
                className='rounded-lg p-2 text-gray-600 transition-all duration-200 hover:bg-gray-100/80 hover:text-gray-800'
                title='התנתקות'
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <LogOut className='h-6 w-6' />
              </motion.button>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div className='flex-1 overflow-hidden p-4' variants={itemVariants}>
            {/* Welcome Section */}
            <motion.div
              className='mb-8'
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h1 className='mb-2 text-3xl font-bold text-gray-900'>שלום! 👋</h1>
              <p className='text-base text-gray-600'>
                הנה כל הדברים החשובים שמחכים לך השבוע, במקום אחד מסודר.
              </p>
            </motion.div>

            {/* Dashboard Content */}
            <div className='space-y-6 overflow-hidden'>
              {/* Main Layout: Left (Notifications) + Right (Animated Cards) */}
              <div className='grid grid-cols-1 gap-6 overflow-hidden lg:grid-cols-5'>
                {/* Left Side - Notifications */}
                <motion.div
                  className='max-h-full lg:col-span-2'
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <div className='h-full rounded-xl border border-gray-200/50 bg-white/90 p-4 shadow-lg backdrop-blur-sm'>
                    <div className='mb-6 flex items-center justify-between'>
                      <h3 className='text-lg font-semibold text-gray-900'>הודעות אחרונות</h3>
                      <Bell className='h-5 w-5 text-gray-500' />
                    </div>
                    <div className='max-h-[400px] space-y-4 overflow-y-auto'>
                      {notifications.map((notification, index) => (
                        <motion.div
                          key={notification.id}
                          className={`rounded-lg border p-4 ${
                            notification.urgent
                              ? 'border-red-200/50 bg-red-50/80'
                              : 'border-gray-200/50 bg-gray-50/80'
                          }`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                        >
                          <div className='flex items-start justify-between'>
                            <div className='flex-1'>
                              <h4 className='mb-1 text-sm font-medium text-gray-900'>
                                {notification.title}
                              </h4>
                              <p className='mb-2 text-sm text-gray-600'>{notification.message}</p>
                              <span className='text-xs text-gray-500'>{notification.time}</span>
                            </div>
                            {notification.urgent && (
                              <div className='ml-2 h-2 w-2 animate-pulse rounded-full bg-red-500'></div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Right Side - Animated Cards */}
                <motion.div
                  className='max-h-full lg:col-span-3'
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
                    className='mb-4'
                  >
                    <h3 className='text-center text-lg font-semibold text-gray-700'>
                      {dashboardSections[currentCardIndex].title}
                    </h3>
                  </motion.div>

                  {/* Animated Cards Grid */}
                  <div className='grid max-h-full grid-cols-1 gap-6 md:grid-cols-2'>
                    <AnimatePresence>
                      {dashboardSections[currentCardIndex].cards.map((card, index) => (
                        <motion.div
                          key={`${currentCardIndex}-${index}`}
                          className='max-h-[300px] min-h-[200px] overflow-hidden rounded-xl border border-gray-200/50 bg-white/90 p-4 shadow-lg backdrop-blur-sm'
                          variants={cardVariants}
                          initial='enter'
                          animate='center'
                          exit='exit'
                          transition={{ duration: 0.6, delay: index * 0.2 }}
                          whileHover={{ scale: 1.02 }}
                        >
                          {/* Header with Icon */}
                          <div className='mb-4 flex items-center space-x-3 space-x-reverse'>
                            <div className='rounded-lg bg-gray-50/80 p-2'>
                              <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                            </div>
                            <h3 className='text-sm font-medium text-gray-900'>{card.title}</h3>
                          </div>

                          {/* Content */}
                          {'value' in card ? (
                            /* Large Number Display */
                            <div className='mb-4 overflow-hidden text-center'>
                              <div className='mb-1 text-4xl font-bold text-slate-900'>
                                {'value' in card ? card.value : ''}
                              </div>
                              <p className='text-sm font-medium text-slate-600'>
                                {'subtitle' in card ? card.subtitle : ''}
                              </p>
                            </div>
                          ) : (
                            /* Items List */
                            <div>
                              <p className='mb-4 text-xs text-gray-500'>עדכונים אחרונים</p>
                              <div className='mb-6 max-h-[150px] space-y-3 overflow-hidden overflow-y-auto'>
                                {'items' in card &&
                                  card.items?.map((item: any, itemIndex: number) => (
                                    <motion.div
                                      key={itemIndex}
                                      className='flex items-center justify-between rounded-lg bg-gray-50/80 px-3 py-2'
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ duration: 0.3, delay: 0.8 + itemIndex * 0.1 }}
                                    >
                                      <span className='text-sm text-gray-600'>{item.label}</span>
                                      <div className='flex items-center space-x-2 space-x-reverse'>
                                        <span className='text-base font-semibold text-slate-900'>
                                          {item.value}
                                        </span>
                                        {item.urgent && (
                                          <div className='h-2 w-2 animate-pulse rounded-full bg-red-500'></div>
                                        )}
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
                  <div className='mt-4 flex justify-center space-x-2 space-x-reverse'>
                    {dashboardSections.map((_, index) => (
                      <motion.button
                        key={index}
                        className={`h-2 w-2 rounded-full transition-all duration-300 ${
                          index === currentCardIndex
                            ? 'scale-125 bg-blue-600'
                            : 'bg-gray-300 hover:bg-gray-400'
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
