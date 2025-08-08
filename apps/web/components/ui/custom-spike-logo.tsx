"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface CustomSpikeLogoProps {
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

export function CustomSpikeLogo({ className, size = "md", animated = false, showText = false }: CustomSpikeLogoProps) {
  const LogoSVG = () => (
    <svg viewBox="0 0 1024 1024" className={cn("w-full h-full", className)}>
      <g transform="translate(0,1024) scale(0.1,-0.1)">
        <path
          d="M5085 7974 c-184 -29 -377 -89 -530 -167 -120 -60 -206 -113 -198 -122 5 -4 3 -5 -4 -1 -16 9 -125 -53 -116 -67 4 -6 0 -8 -8 -5 -17 7 -172 -75 -164 -85 3 -4 2 -5 -2 -2 -7 5 -68 -28 -363 -195 -113 -64 -277 -158 -365 -208 -88 -50 -247 -140 -352 -200 -106 -60 -189 -113 -185 -117 4 -5 2 -5 -5 -1 -6 3 -105 -47 -220 -112 -114 -66 -301 -172 -415 -237 -115 -65 -208 -122 -208 -127 0 -5 -4 -7 -8 -4 -9 6 -284 -148 -277 -155 2 -3 -4 -5 -13 -6 -38 -3 -232 -136 -218 -150 2 -3 -5 -14 -16 -25 -11 -11 -17 -26 -14 -34 3 -9 1 -12 -4 -9 -10 6 -14 -30 -11 -85 3 -36 22 -81 32 -74 5 3 6 -1 3 -9 -7 -18 94 -110 113 -103 8 3 12 2 9 -2 -4 -7 113 -77 507 -301 l168 -96 -4 -515 c-4 -543 -8 -595 -58 -810 -97 -410 -99 -438 -98 -1065 1 -280 5 -499 9 -485 7 22 8 20 9 -15 0 -29 -2 -36 -9 -25 -8 13 -10 12 -10 -2 0 -17 22 -18 316 -18 l316 0 -5 558 c-5 631 -5 631 -87 972 -70 286 -80 398 -80 867 l0 382 -32 24 c-64 46 -238 138 -250 131 -7 -4 -8 -3 -4 4 4 7 2 12 -3 12 -8 0 -11 109 -11 345 l0 345 1725 0 1725 0 0 -150 0 -150 -1575 0 -1575 0 2 -277 3 -278 231 -135 c127 -74 289 -169 360 -209 71 -41 219 -127 329 -191 954 -555 1002 -580 1232 -656 512 -169 1023 -142 1528 81 100 44 295 158 288 168 -3 6 -1 7 5 3 7 -4 180 89 389 210 208 119 551 316 763 437 212 121 438 250 502 287 65 37 114 71 110 75 -4 5 -2 5 5 2 11 -7 794 434 883 497 94 67 132 178 92 270 -12 25 -26 46 -31 46 -6 0 -10 5 -8 11 3 16 -82 81 -96 72 -7 -3 -8 -2 -4 2 9 10 -103 76 -115 69 -4 -3 -8 -1 -8 5 0 15 -299 183 -312 175 -6 -4 -8 -3 -5 3 7 11 -211 137 -236 135 -9 0 -15 3 -12 8 7 12 -143 92 -158 84 -7 -4 -9 -4 -5 1 10 11 3 16 -202 131 -96 54 -183 97 -193 97 -9 -1 -15 2 -12 7 7 12 -70 52 -80 42 -5 -4 -5 -2 -2 4 3 6 -10 18 -29 28 -20 9 -32 11 -28 5 4 -7 1 -10 -7 -7 -8 3 -14 10 -14 17 0 16 -244 153 -258 144 -5 -3 -7 -1 -4 4 8 13 -20 26 -35 16 -6 -3 -8 -1 -5 5 9 13 -241 154 -257 145 -6 -3 -7 -2 -3 2 9 11 -103 76 -116 68 -6 -3 -7 -1 -4 4 8 13 -20 26 -35 16 -6 -3 -8 -2 -5 4 8 12 -89 67 -103 58 -6 -4 -9 -1 -8 7 2 7 -5 12 -15 11 -10 0 -16 2 -13 5 9 8 -236 142 -248 135 -6 -3 -8 -2 -3 2 9 11 -72 57 -86 48 -5 -3 -7 -1 -3 5 6 11 -29 28 -51 24 -6 -2 -15 3 -19 9 -4 8 -3 9 4 5 7 -4 12 -5 12 -2 0 10 -171 97 -180 91 -6 -4 -9 -1 -8 5 4 17 -233 141 -256 134 -11 -4 -16 -2 -12 4 8 13 -19 23 -41 15 -10 -4 -14 -2 -10 5 9 13 -94 53 -144 55 -21 1 -35 5 -33 8 5 8 -130 36 -236 49 -115 14 -315 11 -425 -6z m-3008 -5331 c-3 -10 -5 -2 -5 17 0 19 2 27 5 18 2 -10 2 -26 0 -35z m0 -85 c-2 -13 -4 -3 -4 22 0 25 2 35 4 23 2 -13 2 -33 0 -45z"
          fill="#3B82F6"
        />
        <path
          d="M3322 4022 c3 -12 3 -22 -1 -24 -5 -2 -18 -73 -30 -158 -43 -300 -92 -534 -157 -747 -14 -46 -22 -88 -18 -95 4 -6 3 -8 -2 -5 -6 3 -25 -39 -43 -94 -57 -169 -46 -176 291 -180 130 -2 234 -7 232 -10 -2 -4 18 -10 44 -14 82 -12 256 -73 365 -129 191 -97 459 -286 766 -540 73 -61 137 -110 142 -108 5 1 8 -2 7 -6 -2 -5 35 -41 82 -81 93 -78 191 -133 246 -136 19 -1 38 -5 41 -9 12 -11 108 -6 168 9 86 23 135 53 290 181 564 466 724 584 925 684 126 64 203 93 329 126 82 22 127 27 306 33 228 8 255 14 276 63 10 24 8 38 -10 91 -13 34 -39 111 -60 170 -20 59 -41 104 -46 100 -4 -4 -5 -2 -1 5 4 7 4 26 1 44 -6 23 -9 27 -17 17 -7 -10 -8 -8 -3 8 3 12 -3 57 -14 100 -32 125 -78 375 -103 551 -21 155 -32 186 -54 150 -5 -8 -2 -9 10 -5 10 4 15 3 11 -3 -3 -5 -16 -9 -28 -8 -28 2 -278 -142 -270 -155 3 -6 1 -7 -5 -3 -15 9 -282 -145 -275 -158 4 -5 1 -6 -4 -3 -6 4 -51 -16 -99 -45 -346 -200 -675 -312 -1023 -349 -162 -17 -504 -7 -656 20 -279 48 -547 139 -781 267 -44 24 -84 42 -87 39 -4 -3 -5 -2 -2 2 8 10 -115 74 -128 67 -7 -4 -9 -3 -4 1 9 11 -134 96 -151 90 -7 -3 -11 -1 -8 3 7 12 -104 73 -116 65 -6 -3 -9 -2 -5 3 3 5 -67 50 -155 99 -192 107 -182 103 -176 77z"
          fill="#2563EB"
        />
      </g>
    </svg>
  )

  if (showText) {
    return (
      <motion.div
        className="flex items-center space-x-2 space-x-reverse"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <div className={cn(sizeClasses[size], "transition-all duration-200")}>
          <LogoSVG />
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
    <div className={cn(sizeClasses[size], "transition-all duration-200", className)}>
      <LogoSVG />
    </div>
  )
}

// Header Logo Component
export function CustomSpikeHeaderLogo({
  className,
  animated = false,
}: {
  className?: string
  animated?: boolean
}) {
  return (
    <motion.div
      className={cn("flex items-center space-x-2", className)}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div className="w-10 h-10 relative" whileHover={{ rotate: 2 }} transition={{ duration: 0.3 }}>
        <CustomSpikeLogo size="lg" animated={animated} />
        {/* Subtle glow effect */}
        <motion.div
          className="absolute inset-0 bg-blue-500/20 rounded-full blur-md -z-10"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        />
      </motion.div>

      <motion.span
        className="text-2xl font-poppins text-black dark:text-white transition-colors duration-200"
        initial={animated ? { opacity: 0, x: -10 } : undefined}
        animate={animated ? { opacity: 1, x: 0 } : undefined}
        transition={animated ? { duration: 0.6, delay: 0.3 } : undefined}
      >
        spike
      </motion.span>
    </motion.div>
  )
}
