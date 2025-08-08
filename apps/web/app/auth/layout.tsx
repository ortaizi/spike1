import React from "react"
import type { Metadata } from "next"
import "./globals-auth.css"

export const metadata: Metadata = {
  title: "spike - התחברות למערכת",
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="auth-layout">
      {children}
    </div>
  )
} 