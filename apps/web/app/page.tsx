'use client';

import { motion } from 'framer-motion';
import {
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  Facebook,
  Linkedin,
  MoveRight,
  Shield,
  Star,
  Twitter,
  Users,
  Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LoginPopup } from '../components/auth/login-popup';
import { Hero } from '../components/ui/animated-hero';
import { Button } from '../components/ui/button';
import { HeroScrollDemo } from '../components/ui/hero-scroll-demo';
import { NavigationHeader } from '../components/ui/navigation-header';

export default function HomePage() {
  const router = useRouter();
  const [titleNumber, setTitleNumber] = useState(0);
  const [isLoginPopupOpen, setIsLoginPopupOpen] = useState(false);
  const [particles, setParticles] = useState<
    Array<{
      id: number;
      x: number;
      y: number;
      size: number;
      duration: number;
      delay: number;
    }>
  >([]);

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
    setIsLoginPopupOpen(true);
  };

  // const handleDemoClick = () => {
  //   // Open login popup for demo
  //   setIsLoginPopupOpen(true);
  // }; // Reserved for future use

  const features = [
    {
      icon: Zap,
      title: 'אינטגרציה חכמה',
      description:
        'חיבור אוטומטי לכל מערכות הלימוד שלך - Moodle, מערכת שעות, מייל אוניברסיטאי ועוד',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: Shield,
      title: 'אבטחה מתקדמת',
      description: 'הגנה על המידע שלך עם אבטחה ברמה הבנקאית וציות לתקנות הפרטיות',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: Clock,
      title: 'חיסכון בזמן',
      description: 'חסוך שעות של ניהול ידני - הכל מאורגן אוטומטית במקום אחד',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: Users,
      title: 'תקשורת משופרת',
      description: 'גישה מהירה לעמיתים לספסל הלימודים וצוות המחלקה',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: BarChart3,
      title: 'ניתוח ביצועים',
      description: 'מעקב מתקדם אחר הציונים, התקדמות וזיהוי מוקדם של בעיות',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: Calendar,
      title: 'תזמון חכם',
      description: 'לוח זמנים דינמי שמתעדכן אוטומטית עם כל שינוי במערכת',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
  ];

  const benefits = [
    {
      icon: CheckCircle,
      title: 'הפחתת לחץ',
      description: 'אל תפספס עוד דדליין או אירוע חשוב',
    },
    {
      icon: Star,
      title: 'שיפור ציונים',
      description: 'מעקב שיטתי מוביל לביצועים טובים יותר',
    },
    {
      icon: Zap,
      title: 'יעילות מקסימלית',
      description: 'חסוך זמן יקר לפעילויות חשובות יותר',
    },
  ];

  return (
    <div className='min-h-screen bg-white' dir='rtl' style={{ position: 'relative' }}>
      {/* Navigation Header */}
      <NavigationHeader />

      {/* Subtle Blue Accents */}
      <div className='absolute inset-0 bg-gradient-to-br from-white via-blue-50/30 to-white'></div>

      {/* Animated Blue Accents */}
      <motion.div
        className='from-blue-600/3 via-indigo-600/2 to-blue-800/3 absolute inset-0 bg-gradient-to-r'
        animate={{
          background: [
            'linear-gradient(45deg, rgba(59, 130, 246, 0.03) 0%, rgba(99, 102, 241, 0.02) 50%, rgba(37, 99, 235, 0.03) 100%)',
            'linear-gradient(45deg, rgba(37, 99, 235, 0.03) 0%, rgba(59, 130, 246, 0.02) 50%, rgba(99, 102, 241, 0.03) 100%)',
            'linear-gradient(45deg, rgba(99, 102, 241, 0.03) 0%, rgba(37, 99, 235, 0.02) 50%, rgba(59, 130, 246, 0.03) 100%)',
          ],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Floating Particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className='absolute rounded-full bg-gradient-to-r from-blue-400/5 to-indigo-400/5 backdrop-blur-sm'
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
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Geometric Shapes */}
      <motion.div
        className='from-blue-400/8 to-indigo-400/8 absolute left-10 top-20 h-32 w-32 rounded-full bg-gradient-to-br blur-xl'
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className='from-indigo-400/8 to-blue-400/8 absolute bottom-20 right-10 h-24 w-24 rounded-full bg-gradient-to-br blur-xl'
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
      />

      {/* Grid Pattern */}
      <div className='absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px] opacity-20' />

      {/* Content */}
      <div className='relative z-10 pt-16'>
        {/* Hero Section */}
        <section className='relative'>
          <Hero onLoginClick={() => setIsLoginPopupOpen(true)} />
        </section>

        {/* Hero Scroll Demo - Right after Hero */}
        <section className='-mt-24 bg-transparent py-0'>
          <HeroScrollDemo />
        </section>

        {/* Main Heading Section */}
        <section className='relative overflow-hidden px-4 py-32'>
          {/* Background Elements */}
          <div className='absolute inset-0 bg-gradient-to-br from-white via-blue-50/30 to-white'></div>
          <div className='absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px] opacity-20'></div>

          <div className='relative z-10 w-full'>
            <motion.div
              className='text-center'
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className='relative'>
                {/* Enhanced background gradient effect */}
                <div className='absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-blue-800/10 blur-3xl'></div>

                {/* Main heading with enhanced styling */}
                <motion.h1
                  className='font-regular relative mx-auto max-w-5xl bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-center text-5xl tracking-tighter text-transparent md:text-7xl'
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                >
                  <span className='text-gray-900'>כל ה</span>
                  <span className='relative mx-2 inline-block min-w-[250px] text-center'>
                    {['מטלות', 'ציונים', 'מבחנים', 'מסמכים', 'מיילים', 'קורסים'].map(
                      (title, index) => (
                        <motion.span
                          key={index}
                          className='absolute left-0 right-0 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text font-semibold text-transparent'
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
                            type: 'spring',
                            stiffness: 200,
                            damping: 20,
                            duration: 0.6,
                          }}
                        >
                          {title}
                        </motion.span>
                      )
                    )}
                    {/* Placeholder to maintain height */}
                    <span className='invisible'>מטלות</span>
                  </span>
                  <span className='text-gray-900'>במקום אחד.</span>
                </motion.h1>

                {/* Enhanced decorative elements */}
                <motion.div
                  className='absolute -left-4 -top-4 h-8 w-8 rounded-full bg-gradient-to-r from-blue-400 to-indigo-400 opacity-60'
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.6, 0.8, 0.6],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
                <motion.div
                  className='absolute -bottom-4 -right-4 h-6 w-6 rounded-full bg-gradient-to-r from-indigo-400 to-blue-400 opacity-60'
                  animate={{
                    scale: [1.2, 1, 1.2],
                    opacity: [0.6, 0.8, 0.6],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 1,
                  }}
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id='features' className='px-4 py-20'>
          <div className='w-full'>
            {/* Section Header */}
            <motion.div
              className='mb-16 text-center'
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className='mb-6 text-4xl font-bold text-gray-900 md:text-5xl'>
                למה <span className='text-blue-600'>spike</span>?
              </h2>
              <p className='mx-auto max-w-3xl text-xl leading-relaxed text-gray-600'>
                הפלטפורמה החכמה שמחברת את כל מערכות הלימוד שלך במקום אחד, ומביאה לך את העתיד של
                ניהול לימודים
              </p>
            </motion.div>

            {/* Features Grid */}
            <div className='mb-20 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3'>
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className='group relative'
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <div className='rounded-2xl border border-gray-200/50 bg-white/80 p-8 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl group-hover:scale-105'>
                    <div className='mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 transition-transform duration-300 group-hover:scale-110'>
                      <feature.icon className='h-8 w-8 text-blue-600' />
                    </div>
                    <h3 className='mb-4 text-xl font-semibold text-gray-900'>{feature.title}</h3>
                    <p className='leading-relaxed text-gray-600'>{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Students for Students Section */}
            <motion.div
              className='mb-16 text-center'
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className='rounded-3xl p-12'>
                <h3 className='mb-4 text-3xl font-bold text-gray-900 md:text-4xl'>
                  נבנה על ידי{' '}
                  <span className='bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'>
                    סטודנטים
                  </span>
                  , בשביל{' '}
                  <span className='bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'>
                    סטודנטים
                  </span>
                </h3>
                <p className='mx-auto max-w-2xl text-lg leading-relaxed text-gray-600'>
                  אנחנו יודעים בדיוק מה אתם צריכים כי אנחנו היינו שם. spike נוצר מהניסיון האישי שלנו
                  כסטודנטים, כדי לתת לכם את הכלים הטובים ביותר להצלחה אקדמית
                </p>
              </div>
            </motion.div>

            {/* Benefits Section */}
            <motion.div
              className='rounded-3xl border border-blue-200/30 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 p-12'
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className='mb-12 text-center'>
                <h3 className='mb-4 text-3xl font-bold text-gray-900'>התוצאות שתקבל</h3>
                <p className='mx-auto max-w-2xl text-lg text-gray-600'>
                  סטודנטים שמשתמשים ב-spike מדווחים על שיפור משמעותי בחוויית הלימודים
                </p>
              </div>

              <div className='grid grid-cols-1 gap-8 md:grid-cols-3'>
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    className='text-center'
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                  >
                    <div className='mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-50 to-indigo-50'>
                      <benefit.icon className='h-8 w-8 text-blue-600' />
                    </div>
                    <h4 className='mb-3 text-xl font-semibold text-gray-900'>{benefit.title}</h4>
                    <p className='text-gray-600'>{benefit.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* CTA Section */}
            <motion.div
              className='mt-16 text-center'
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h3 className='mb-6 text-3xl font-bold text-gray-900'>מוכן להתחיל?</h3>
              <p className='mx-auto mb-8 max-w-2xl text-lg text-gray-600'>
                הצטרף לאלפי סטודנטים שכבר משתמשים ב-spike ומשפרים את חוויית הלימודים שלהם
              </p>
              <div className='flex flex-col justify-center gap-4 sm:flex-row'>
                <Button
                  size='lg'
                  className='gap-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:from-blue-700 hover:to-indigo-700'
                  onClick={handleCTAClick}
                >
                  התחבר עכשיו <MoveRight className='h-4 w-4' />
                </Button>
                <Button
                  size='lg'
                  variant='outline'
                  className='gap-4 border-2 border-blue-600 text-blue-600 transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-600 hover:text-white'
                  onClick={() => router.push('/test-login')}
                >
                  🧪 טסט המערכת <MoveRight className='h-4 w-4' />
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Contact Section */}
        <section id='contact' className='bg-gray-50/50 px-4 py-16'>
          <div className='w-full'>
            <div className='flex flex-col items-center gap-8'>
              {/* Contact Title */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className='text-center'
              >
                <h2 className='mb-4 text-4xl font-bold text-gray-900 lg:text-5xl'>
                  צור <span className='text-blue-600'>קשר</span>
                </h2>
                <p className='mx-auto max-w-md text-lg leading-relaxed text-gray-600 lg:text-xl'>
                  יש לך שאלות או הצעות? אנחנו כאן לעזור!
                </p>
              </motion.div>

              {/* Contact Form */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className='w-full max-w-2xl'
              >
                <div className='rounded-2xl border border-gray-200/50 bg-white/90 p-6 shadow-xl backdrop-blur-sm lg:p-8'>
                  <form className='space-y-4'>
                    <div>
                      <label className='mb-2 block text-right text-sm font-medium text-gray-700'>
                        שם מלא
                      </label>
                      <input
                        type='text'
                        className='w-full rounded-lg border border-gray-300 px-4 py-3 text-right transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500'
                        placeholder='הכנס את שמך המלא'
                      />
                    </div>
                    <div>
                      <label className='mb-2 block text-right text-sm font-medium text-gray-700'>
                        אימייל
                      </label>
                      <input
                        type='email'
                        className='w-full rounded-lg border border-gray-300 px-4 py-3 text-right transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500'
                        placeholder='הכנס את האימייל שלך'
                      />
                    </div>
                    <div>
                      <label className='mb-2 block text-right text-sm font-medium text-gray-700'>
                        הודעה
                      </label>
                      <textarea
                        rows={4}
                        className='w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-right transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500'
                        placeholder='כתוב את ההודעה שלך כאן...'
                      />
                    </div>
                    <Button
                      size='lg'
                      className='mt-2 w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:from-blue-700 hover:to-indigo-700'
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
        <footer className='mt-20 border-t border-gray-200/50 bg-gray-50/50'>
          <div className='w-full px-4 py-12'>
            <div className='flex flex-col items-center justify-between md:flex-row'>
              {/* Logo and Description */}
              <div className='mb-8 flex flex-col items-center md:mb-0 md:items-start'>
                <div className='mb-4 flex items-center gap-2'>
                  <span className='font-poppins text-2xl text-gray-900'>spike</span>
                  <div className='h-6 w-6'>
                    <svg className='h-full w-full' viewBox='0 0 24 24' fill='none'>
                      <defs>
                        <linearGradient
                          id='lightningGradientLanding'
                          x1='0%'
                          y1='0%'
                          x2='100%'
                          y2='100%'
                        >
                          <stop offset='0%' stopColor='#3B82F6' />
                          <stop offset='100%' stopColor='#6366F1' />
                        </linearGradient>
                      </defs>
                      <path
                        d='M13 2L3 14h9l-1 8 10-12h-9l1-8z'
                        fill='url(#lightningGradientLanding)'
                        stroke='url(#lightningGradientLanding)'
                        strokeWidth='0'
                      />
                    </svg>
                  </div>
                </div>
                <p className='max-w-md text-center text-gray-600 md:text-right'>
                  הפלטפורמה החכמה לניהול לימודים - חיבור כל המערכות במקום אחד
                </p>
              </div>

              {/* Social Links */}
              <div className='flex gap-4'>
                <motion.a
                  href='#'
                  className='group flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200/50 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:border-blue-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50'
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Linkedin className='h-5 w-5 text-gray-600 transition-all duration-300 group-hover:text-blue-600' />
                </motion.a>
                <motion.a
                  href='#'
                  className='group flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200/50 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:border-blue-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50'
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Facebook className='h-5 w-5 text-gray-600 transition-all duration-300 group-hover:text-blue-600' />
                </motion.a>
                <motion.a
                  href='#'
                  className='group flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200/50 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:border-blue-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50'
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Twitter className='h-5 w-5 text-gray-600 transition-all duration-300 group-hover:text-blue-600' />
                </motion.a>
              </div>
            </div>

            {/* Bottom Section */}
            <div className='mt-8 flex flex-col items-center justify-between border-t border-gray-200/50 pt-8 md:flex-row'>
              <p className='mb-4 text-center text-sm text-gray-500 md:mb-0 md:text-right'>
                © 2024 spike. כל הזכויות שמורות.
              </p>
              <div className='flex gap-6 text-sm'>
                <a
                  href='#'
                  className='text-gray-500 transition-colors duration-300 hover:text-gray-700'
                >
                  תנאי שימוש
                </a>
                <a
                  href='#'
                  className='text-gray-500 transition-colors duration-300 hover:text-gray-700'
                >
                  מדיניות פרטיות
                </a>
                <a
                  href='#'
                  className='text-gray-500 transition-colors duration-300 hover:text-gray-700'
                >
                  צור קשר
                </a>
              </div>
            </div>
          </div>
        </footer>

        {/* Login Popup */}
        <LoginPopup isOpen={isLoginPopupOpen} onClose={() => setIsLoginPopupOpen(false)} />
      </div>
    </div>
  );
}
