"use client"

import { Mail } from "lucide-react"

interface StaffMember {
  id: string
  name: string
  title: string
  email: string
  officeHours: string
  avatar?: string
}

interface CompactTeachingStaffProps {
  staff: StaffMember[]
}

export function CompactTeachingStaff({ staff }: CompactTeachingStaffProps) {
  const handleSendEmail = (email: string) => {
    window.location.href = `mailto:${email}`
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium text-slate-900 mb-4">צוות הקורס</h3>

      <div className="space-y-3">
        {staff.map((member) => (
          <div
            key={member.id}
            className="bg-slate-50/50 rounded-lg p-3 border border-slate-200/50 hover:bg-blue-50/30 transition-colors duration-200"
          >
            {/* Avatar and Info */}
            <div className="flex items-center space-x-3 space-x-reverse mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#387ADF] to-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                {member.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-slate-900 text-sm truncate">{member.name}</h4>
                <p className="text-xs text-slate-600">{member.title}</p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-1 mb-3 text-xs text-slate-600">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Mail className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{member.email}</span>
              </div>
              <div className="text-xs text-slate-500">{member.officeHours}</div>
            </div>

            {/* Email Button */}
            <button
              onClick={() => handleSendEmail(member.email)}
              className="w-full bg-[#387ADF] hover:bg-[#387ADF]/90 text-white py-2 px-3 rounded-md text-xs font-medium transition-colors duration-200"
            >
              שלח מייל
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
