"use client"

import React from 'react'

interface IconWrapperProps {
  children: React.ReactNode
  className?: string
  size?: number
  [key: string]: any
}

export function IconWrapper({ children, className, size = 24, ...props }: IconWrapperProps) {
  return (
    <div 
      className={className}
      style={{ width: size, height: size }}
      suppressHydrationWarning
      {...props}
    >
      {children}
    </div>
  )
} 