"use client"

import { ArrowRight, Paperclip, Reply, Star, Trash2 } from "lucide-react"
import type { EmailData } from "./email-card"

interface EmailViewProps {
  email: EmailData | null
  onClose: () => void
}

export function EmailView({ email, onClose }: EmailViewProps) {
  if (!email) return null

  const handleReply = () => {
    console.log("Reply to:", email.id)
    // Implement reply functionality
  }

  const handleDelete = () => {
    console.log("Delete email:", email.id)
    // Implement delete functionality
  }

  const handleStar = () => {
    console.log("Star email:", email.id)
    // Implement star functionality
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onClose}
          className="flex items-center space-x-2 space-x-reverse text-slate-600 hover:text-[#387ADF] transition-colors duration-200"
        >
          <ArrowRight className="w-4 h-4" suppressHydrationWarning />
          <span>חזרה לרשימה</span>
        </button>

        <div className="flex items-center space-x-2 space-x-reverse">
          <button
            onClick={handleStar}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-yellow-500 transition-colors duration-200"
          >
            <Star className="w-4 h-4" suppressHydrationWarning />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-red-500 transition-colors duration-200"
          >
            <Trash2 className="w-4 h-4" suppressHydrationWarning />
          </button>
          <button
            onClick={handleReply}
            className="bg-[#387ADF] hover:bg-[#387ADF]/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2 space-x-reverse"
          >
            <Reply className="w-4 h-4" suppressHydrationWarning />
            <span>השב</span>
          </button>
        </div>
      </div>

      {/* Email Content */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-4">{email.subject}</h2>

        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="font-medium text-slate-900">{email.sender.name}</div>
            <div className="text-sm text-slate-500">{email.sender.email}</div>
          </div>
          <div className="text-sm text-slate-500">{email.timestamp}</div>
        </div>

        <div className="prose prose-slate max-w-none mb-6">
          <p>
            שלום לכולם,
            <br />
            <br />
            {email.preview}
            <br />
            <br />
            ברצוני לעדכן כי מועד בחינת האמצע נדחה בשבוע אחד קדימה. הבחינה תתקיים ביום רביעי 22/03 בשעה 10:00 באולם 101.
            אנא הכינו את עצמכם בהתאם. הבחינה תכלול את כל החומר שנלמד עד השיעור מיום 15/03.
            <br />
            <br />
            בהצלחה לכולם!
            <br />
            <br />
            בברכה,
            <br />
            {email.sender.name}
          </p>
        </div>

        {email.hasAttachments && (
          <div className="border-t border-slate-200 pt-4">
            <h3 className="text-sm font-medium text-slate-900 mb-2 flex items-center">
              <Paperclip className="w-4 h-4 ml-1" suppressHydrationWarning />
              קבצים מצורפים
            </h3>
            <div className="flex space-x-3 space-x-reverse">
              <div className="bg-slate-100 border border-slate-200 rounded-lg p-3 flex items-center space-x-3 space-x-reverse">
                <div className="bg-blue-100 p-2 rounded">
                  <Paperclip className="w-4 h-4 text-blue-600" suppressHydrationWarning />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-900">מועד-בחינה-מעודכן.pdf</div>
                  <div className="text-xs text-slate-500">PDF, 245KB</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
