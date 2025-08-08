"use client"

import { motion } from "framer-motion"
import { SpikeLogo, SpikeFavicon, SpikeHeaderLogo, SpikeLoadingLogo, SpikeLogoMark } from "./spike-logo"

export function LogoShowcase() {
  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-8 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Main Logo */}
      <div className="flex flex-col items-center space-y-4 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Main Logo</h3>
        <SpikeLogo size="lg" animated={true} />
        <SpikeLogo size="lg" showText={true} animated={true} />
      </div>

      {/* Header Logo */}
      <div className="flex flex-col items-center space-y-4 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Header Logo</h3>
        <SpikeHeaderLogo animated={true} />
      </div>

      {/* Favicon */}
      <div className="flex flex-col items-center space-y-4 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Favicon</h3>
        <div className="flex space-x-4 space-x-reverse">
          <SpikeFavicon size="sm" />
          <SpikeFavicon size="md" />
          <SpikeFavicon size="lg" />
        </div>
      </div>

      {/* Logo Mark */}
      <div className="flex flex-col items-center space-y-4 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Logo Mark</h3>
        <SpikeLogoMark size="lg" />
      </div>

      {/* Loading Logo */}
      <div className="flex flex-col items-center space-y-4 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Loading State</h3>
        <div className="scale-75">
          <SpikeLoadingLogo />
        </div>
      </div>

      {/* Size Variations */}
      <div className="flex flex-col items-center space-y-4 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Size Variations</h3>
        <div className="flex items-center space-x-4 space-x-reverse">
          <SpikeLogo size="sm" />
          <SpikeLogo size="md" />
          <SpikeLogo size="lg" />
          <SpikeLogo size="xl" />
        </div>
      </div>
    </motion.div>
  )
}
