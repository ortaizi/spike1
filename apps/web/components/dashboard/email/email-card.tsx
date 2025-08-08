"use client"

import type React from "react"

import { Paperclip } from "lucide-react"
import { useState } from "react"

export interface EmailData {
  id: string
  sender: {
    name: string
    role: "מרצה" | "מתרגל" | "מנהלה" | "אחר"
    email: string
  }
  subject: string
  preview: string
  timestamp: string
  hasAttachments: boolean
  isUnread: boolean
  courseId: string
}

interface EmailCardProps {
  email: EmailData
  onClick: (emailId: string) => void
}

export function EmailCard({ email, onClick }: EmailCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const getRoleColor = (role: string) => {
    switch (role) {
      case "מרצה":
        return "bg-blue-100 text-blue-800"
      case "מתרגל":
        return "bg-green-100 text-green-800"
      case "מנהלה":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-slate-100 text-slate-800"
    }
  }

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation()
    console.log("Mark as read:", email.id)
    // Implement mark as read functionality
  }

  const handleQuickReply = (e: React.MouseEvent) => {
    e.stopPropagation()
    console.log("Quick reply to:", email.id)
    // Implement quick reply functionality
  }

  return (
    <div
      className={`p-3 rounded-lg mb-2 cursor-pointer transition-all duration-200 ${
        email.isUnread
          ? "bg-white border-r-4 border border-[#387ADF] shadow-sm"
          : "bg-white border border-slate-100 hover:border-slate-200"
      } ${isHovered ? "bg-blue-50/30" : ""}`}
      onClick={() => onClick(email.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex justify-between items-start mb-1">
        <div className="flex items-center space-x-2 space-x-reverse">
          <span className="font-semibold text-slate-900">{email.sender.name}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleColor(email.sender.role)}`}>
            {email.sender.role}
          </span>
        </div>
        <span className="text-xs text-slate-500">{email.timestamp}</span>
      </div>

      <h4 className={`text-sm ${email.isUnread ? "font-medium text-[#387ADF]" : "font-normal text-slate-800"} mb-1`}>
        {email.subject}
      </h4>

      <div className="flex justify-between items-center">
        <p className="text-xs text-slate-500 truncate max-w-[70%]">{email.preview}</p>
        <div className="flex items-center space-x-1 space-x-reverse">
          {email.hasAttachments && <Paperclip className="w-3 h-3 text-slate-400" />}
          {isHovered && (
            <div className="flex space-x-1 space-x-reverse">
              {email.isUnread ? (
                <button
                  onClick={handleMarkAsRead}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded transition-colors duration-200"
                >
                  סמן כנקרא
                </button>
              ) : (
                <button
                  onClick={handleQuickReply}
                  className="text-xs bg-[#387ADF] hover:bg-[#387ADF]/90 text-white px-2 py-0.5 rounded transition-colors duration-200"
                >
                  השב
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
