'use client';

import { motion } from 'framer-motion';
import { MoveRight, PhoneCall } from 'lucide-react';
import { Button } from './button';

interface HeroProps {
  onLoginClick?: () => void;
}

function Hero({ onLoginClick }: HeroProps) {
  return (
    <div className='relative w-full overflow-hidden'>
      {/* Content */}
      <div className='relative z-10 w-full'>
        <div className='flex flex-col items-center justify-center gap-12 py-16 lg:py-24'>
          <motion.div
            className='flex flex-col gap-6'
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className='font-regular w-full text-center text-5xl leading-tight tracking-tighter text-gray-900 md:text-7xl'>
              הפלטפורמה שסטודנטים
              <br />
              <span className='bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'>
                באמת צריכים.
              </span>
            </h1>
            <motion.p
              className='w-full text-center text-lg leading-relaxed tracking-tight text-gray-700 md:text-xl'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              Spike מחברת את כל המערכות האקדמיות שלך – מודל, מנהל תלמידים, פורטל הסטודנטים
              <br />
              ומרכזת הכל במקום אחד, בעיצוב מודרני ופשוט.
            </motion.p>
          </motion.div>
          <motion.div
            className='flex flex-row gap-4'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size='lg'
                className='gap-4 border border-white/30 bg-white/90 text-gray-700 shadow-lg backdrop-blur-sm hover:bg-white/95'
                onClick={onLoginClick}
              >
                צפה בדמו <PhoneCall className='h-4 w-4' />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size='lg'
                className='gap-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:from-blue-700 hover:to-indigo-700'
                onClick={onLoginClick}
              >
                התחבר עכשיו <MoveRight className='h-4 w-4' />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export { Hero };
