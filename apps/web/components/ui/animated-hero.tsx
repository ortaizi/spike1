"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { MoveRight, PhoneCall } from "lucide-react";
import { Button } from "./button";
import { useRouter } from "next/navigation";

function Hero() {
  const router = useRouter();
  
  return (
    <div className="w-full relative overflow-hidden">
      {/* Content */}
      <div className="container mx-auto relative z-10">
        <div className="flex gap-8 py-20 lg:py-32 items-center justify-center flex-col">
          <motion.div
            className="flex gap-4 flex-col"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="text-5xl md:text-7xl max-w-4xl tracking-tighter text-center font-regular mx-auto text-gray-900">
              הפלטפורמה שסטודנטים<br /><span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">באמת צריכים.</span>
            </h1>
            <motion.p
              className="text-lg md:text-xl leading-relaxed tracking-tight text-gray-700 max-w-3xl text-center mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              גם לכם נמאס ממערכות מסורבלות? spike מחברת את כל מה שסטודנט צריך – לקורסים, דדליינים, ציונים, מיילים ומערכת שעות – בפלטפורמה אחת פשוטה ומדויקת.
            </motion.p>
          </motion.div>
          <motion.div
            className="flex flex-row gap-3"
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
                onClick={() => router.push("/auth/signin")}
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
                onClick={() => router.push("/auth/signin")}
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
