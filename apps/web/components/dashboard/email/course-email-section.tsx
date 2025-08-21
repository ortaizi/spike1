"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { EmailCard, type EmailData } from "./email-card"

interface CourseEmailSectionProps {
  courseId: string
  courseName: string
  courseColor: string
  emails: EmailData[]
  lastActivity: string
  onEmailClick: (emailId: string) => void
}

export function CourseEmailSection({
  courseId,
  courseName,
  courseColor,
  emails,
  lastActivity,
  onEmailClick,
}: CourseEmailSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const unreadCount = emails.filter((email) => email.isUnread).length

  return (
    <div className="mb-4">
      {/* Course Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors duration-200"
      >
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className={`w-3 h-3 rounded-full ${courseColor}`}></div>
          <h3 className="text-base font-semibold text-slate-900">
            {courseName}
            {unreadCount > 0 && <span className="me-2 text-sm font-medium text-[#387ADF]">({unreadCount} חדשים)</span>}
          </h3>
        </div>

        <div className="flex items-center space-x-4 space-x-reverse text-sm text-slate-500">
          <span>עדכון אחרון: {lastActivity}</span>
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </div>
      </button>

      {/* Email List */}
      {isExpanded && (
        <div className="mt-2 space-y-1 animate-accordion-down">
          {emails.length > 0 ? (
            emails.map((email) => <EmailCard key={email.id} email={email} onClick={onEmailClick} />)
          ) : (
            <div className="text-center py-6 bg-white rounded-lg border border-slate-100">
              <p className="text-slate-500">אין מיילים חדשים מ{courseName}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
