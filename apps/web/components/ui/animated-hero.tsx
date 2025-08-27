"use client";

import { motion } from "framer-motion";
import { MoveRight, PhoneCall } from "lucide-react";
import { Button } from "./button";

interface HeroProps {
  onLoginClick?: () => void;
}

function Hero({ onLoginClick }: HeroProps) {
  
  return (
    <div className="w-full relative overflow-hidden">
      {/* Content */}
      <div className="w-full relative z-10">
        <div className="flex gap-12 py-16 lg:py-24 items-center justify-center flex-col">
          <motion.div
            className="flex gap-6 flex-col"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="text-5xl md:text-7xl w-full tracking-tighter text-center font-regular text-gray-900 leading-tight">
              הפלטפורמה שסטודנטים<br /><span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">באמת צריכים.</span>
            </h1>
            <motion.p
              className="text-lg md:text-xl leading-relaxed tracking-tight text-gray-700 w-full text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              Spike מחברת את כל המערכות האקדמיות שלך – מודל, מנהל תלמידים, פורטל הסטודנטים<br />ומרכזת הכל במקום אחד, בעיצוב מודרני ופשוט.
            </motion.p>
          </motion.div>
          <motion.div
            className="flex flex-row gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                size="lg" 
                className="gap-4 bg-white/90 backdrop-blur-sm border border-white/30 text-gray-700 hover:bg-white/95 shadow-lg"
                onClick={onLoginClick}
              >
                צפה בדמו <PhoneCall className="w-4 h-4" />
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                size="lg" 
                className="gap-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                onClick={onLoginClick}
              >
                התחבר עכשיו <MoveRight className="w-4 h-4" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export { Hero };
