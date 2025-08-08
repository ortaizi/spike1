"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
  animated?: boolean
  showText?: boolean
}

const sizeClasses = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-10 h-10",
  xl: "w-12 h-12",
}

const textSizeClasses = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
  xl: "text-3xl",
}

// Main Spike Logo Component
export function SpikeLogo({ className, size = "md", animated = false, showText = false }: LogoProps) {
  const LogoIcon = () => (
    <motion.svg
      viewBox="0 0 100 100"
      className={cn("w-full h-full", className)}
      initial={animated ? { scale: 0, rotate: -180 } : undefined}
      animate={animated ? { scale: 1, rotate: 0 } : undefined}
      transition={animated ? { duration: 0.8, ease: "easeOut" } : undefined}
    >
      {/* Graduation cap base - diamond/square rotated */}
      <motion.path
        d="M50 25 L75 40 L50 55 L25 40 Z"
        fill="#3B82F6"
        className="graduation-cap-base"
        initial={animated ? { opacity: 0, scale: 0.8 } : undefined}
        animate={animated ? { opacity: 1, scale: 1 } : undefined}
        transition={animated ? { duration: 0.6, delay: 0.2 } : undefined}
      />

      {/* Graduation cap top square - darker shade for depth */}
      <motion.path
        d="M45 20 L75 35 L70 40 L40 25 Z"
        fill="#2563EB"
        className="graduation-cap-top"
        initial={animated ? { opacity: 0, y: -10 } : undefined}
        animate={animated ? { opacity: 1, y: 0 } : undefined}
        transition={animated ? { duration: 0.6, delay: 0.4 } : undefined}
      />

      {/* Tassel string */}
      <motion.line
        x1="75"
        y1="40"
        x2="75"
        y2="65"
        stroke="#3B82F6"
        strokeWidth="2"
        className="tassel-string"
        initial={animated ? { pathLength: 0 } : undefined}
        animate={animated ? { pathLength: 1 } : undefined}
        transition={animated ? { duration: 0.4, delay: 0.6 } : undefined}
      />

      {/* Tassel end */}
      <motion.circle
        cx="75"
        cy="65"
        r="3"
        fill="#2563EB"
        className="tassel-end"
        initial={animated ? { scale: 0 } : undefined}
        animate={animated ? { scale: 1 } : undefined}
        transition={animated ? { duration: 0.3, delay: 0.8 } : undefined}
      />

      {/* Subtle highlight for modern look */}
      <motion.path
        d="M35 30 L60 20 L65 25 L40 35 Z"
        fill="#60A5FA"
        opacity="0.3"
        className="highlight"
        initial={animated ? { opacity: 0 } : undefined}
        animate={animated ? { opacity: 0.3 } : undefined}
        transition={animated ? { duration: 0.4, delay: 1 } : undefined}
      />
    </motion.svg>
  )

  if (showText) {
    return (
      <motion.div
        className="flex items-center space-x-2 space-x-reverse"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <div className={cn(sizeClasses[size], "logo-hover transition-all duration-200")}>
          <LogoIcon />
        </div>
        <motion.span
          className={cn(
            textSizeClasses[size],
            "font-poppins text-blue-600 dark:text-blue-400 transition-colors duration-200",
          )}
          initial={animated ? { opacity: 0, x: -20 } : undefined}
          animate={animated ? { opacity: 1, x: 0 } : undefined}
          transition={animated ? { duration: 0.6, delay: 0.5 } : undefined}
        >
          spike
        </motion.span>
      </motion.div>
    )
  }

  return (
    <div className={cn(sizeClasses[size], "logo-hover transition-all duration-200", className)}>
      <LogoIcon />
    </div>
  )
}

// Favicon Version - Simple and Clean
export function SpikeFavicon({ className, size = "md" }: Omit<LogoProps, "showText" | "animated">) {
  return (
    <motion.div
      className={cn(sizeClasses[size], "bg-blue-500 rounded-lg flex items-center justify-center shadow-sm", className)}
      whileHover={{ scale: 1.1, rotate: 5 }}
      transition={{ duration: 0.2 }}
    >
      <span className="text-white font-bold text-sm">S</span>
      {/* Tiny graduation cap indicator */}
      <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-600 rounded-full opacity-80" />
    </motion.div>
  )
}

// Header Logo with Brand Consistency
export function SpikeHeaderLogo({ className, animated = false }: Omit<LogoProps, "size" | "showText">) {
  return (
    <motion.div
      className={cn("flex items-center space-x-2 space-x-reverse", className)}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div className="w-8 h-8 relative" whileHover={{ rotate: 5 }} transition={{ duration: 0.3 }}>
        <SpikeLogo size="md" animated={animated} />
        {/* Rotating sparkle effect */}
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-blue-400">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </motion.div>
      </motion.div>

      <div className="flex flex-col">
        <motion.span
          className="text-xl font-poppins text-blue-600 dark:text-blue-400 transition-colors duration-200"
          initial={animated ? { opacity: 0, x: -10 } : undefined}
          animate={animated ? { opacity: 1, x: 0 } : undefined}
          transition={animated ? { duration: 0.6, delay: 0.3 } : undefined}
        >
          spike
        </motion.span>
        <motion.span
          className="text-xs text-blue-500/70 dark:text-blue-400/70 font-medium"
          initial={animated ? { opacity: 0, x: -10 } : undefined}
          animate={animated ? { opacity: 1, x: 0 } : undefined}
          transition={animated ? { duration: 0.6, delay: 0.5 } : undefined}
        >
          🎓 לסטודנטים
        </motion.span>
      </div>
    </motion.div>
  )
}

// Loading Logo with Animation
export function SpikeLoadingLogo({ className }: { className?: string }) {
  return (
    <motion.div
      className={cn("flex flex-col items-center space-y-4", className)}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        className="relative"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
      >
        <SpikeLogo size="xl" />
        <motion.div
          className="absolute inset-0 border-2 border-blue-500/30 rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
        />
      </motion.div>
      <motion.div
        className="text-blue-600 font-semibold"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
      >
        טוען...
      </motion.div>
    </motion.div>
  )
}

// Logo Mark for Social Media
export function SpikeLogoMark({ className, size = "lg" }: Omit<LogoProps, "showText" | "animated">) {
  return (
    <motion.div
      className={cn(
        sizeClasses[size],
        "bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-2 shadow-lg",
        className,
      )}
      whileHover={{ scale: 1.05, rotate: 2 }}
      transition={{ duration: 0.2 }}
    >
      <SpikeLogo size={size} className="text-white" />
    </motion.div>
  )
}
