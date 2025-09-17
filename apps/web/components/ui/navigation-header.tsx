'use client';

import { motion } from 'framer-motion';
import { ChevronDown, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useIsClient } from '../../hooks/use-is-client';
import { LoginPopup } from '../auth/login-popup';
import { Button } from './button';

export function NavigationHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginPopupOpen, setIsLoginPopupOpen] = useState(false);
  const isClient = useIsClient();

  const navigationItems = [
    {
      name: 'למה אנחנו',
      href: '#features',
      hasDropdown: true,
    },
    {
      name: 'צור קשר',
      href: '#contact',
      hasDropdown: false,
      isContact: true,
    },
  ];

  const scrollToSection = (sectionId: string) => {
    if (!isClient) return; // Prevent DOM access during SSR

    const element = document.getElementById(sectionId);
    if (element) {
      // Calculate offset for header height
      const headerHeight = 64; // h-16 = 64px
      const elementPosition = element.offsetTop - headerHeight - 20; // Extra 20px padding

      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth',
      });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <header className='fixed left-0 right-0 top-0 z-50 border-b border-gray-200/50 bg-white'>
      {/* Background with gradients matching the page */}
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

      {/* Grid Pattern */}
      <div className='absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px] opacity-20' />

      {/* Content */}
      <div className='relative z-10'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex h-16 items-center justify-between'>
            {/* Logo */}
            <motion.div
              className='flex items-center gap-2'
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className='font-poppins text-2xl text-gray-900'>spike</span>
              <div className='h-8 w-8'>
                <svg className='h-full w-full' viewBox='0 0 24 24' fill='none'>
                  <defs>
                    <linearGradient id='lightningGradient' x1='0%' y1='0%' x2='100%' y2='100%'>
                      <stop offset='0%' stopColor='#3B82F6' />
                      <stop offset='100%' stopColor='#6366F1' />
                    </linearGradient>
                  </defs>
                  <path
                    d='M13 2L3 14h9l-1 8 10-12h-9l1-8z'
                    fill='url(#lightningGradient)'
                    stroke='url(#lightningGradient)'
                    strokeWidth='0'
                  />
                </svg>
              </div>
            </motion.div>

            {/* Desktop Navigation */}
            <nav className='hidden items-center space-x-8 space-x-reverse md:flex'>
              {navigationItems.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <button
                    onClick={() => scrollToSection(item.href.replace('#', ''))}
                    className='flex items-center gap-1 font-medium text-gray-700 transition-colors duration-200 hover:text-blue-600'
                  >
                    {item.name}
                    {item.hasDropdown && <ChevronDown className='h-4 w-4' />}
                  </button>
                </motion.div>
              ))}
            </nav>

            {/* Desktop Actions */}
            <motion.div
              className='hidden items-center gap-4 md:flex'
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Button
                size='sm'
                className='bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:from-blue-700 hover:to-indigo-700'
                onClick={() => setIsLoginPopupOpen(true)}
              >
                התחברות
              </Button>
            </motion.div>

            {/* Mobile Menu Button */}
            <motion.button
              className='p-2 text-gray-700 transition-colors duration-200 hover:text-blue-600 md:hidden'
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {isMobileMenuOpen ? <X className='h-6 w-6' /> : <Menu className='h-6 w-6' />}
            </motion.button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <motion.div
              className='border-t border-gray-200/50 bg-white/95 backdrop-blur-md md:hidden'
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className='space-y-4 px-4 py-6'>
                {navigationItems.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => scrollToSection(item.href.replace('#', ''))}
                    className='flex w-full items-center justify-between py-2 text-right font-medium text-gray-700 transition-colors duration-200 hover:text-blue-600'
                  >
                    {item.name}
                    {item.hasDropdown && <ChevronDown className='h-4 w-4' />}
                  </button>
                ))}
                <div className='border-t border-gray-200/50 pt-4'>
                  <Button
                    size='sm'
                    className='w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg hover:from-blue-700 hover:to-indigo-700'
                    onClick={() => {
                      setIsLoginPopupOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    התחברות
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Login Popup */}
      <LoginPopup isOpen={isLoginPopupOpen} onClose={() => setIsLoginPopupOpen(false)} />
    </header>
  );
}
