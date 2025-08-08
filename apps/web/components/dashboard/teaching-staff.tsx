"use client"

import { Mail, Clock } from "lucide-react"

interface StaffMember {
  id: string
  name: string
  title: string
  email: string
  officeHours: string
  avatar?: string
}

interface TeachingStaffProps {
  staff: StaffMember[]
}

export function TeachingStaff({ staff }: TeachingStaffProps) {
  const handleSendEmail = (email: string) => {
    window.location.href = `mailto:${email}`
  }

  return (
    <div className="card-3d-effect rounded-xl p-6">
      <h2 className="text-xl font-semibold text-slate-900 mb-6">צוות הקורס</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staff.map((member) => (
          <div
            key={member.id}
            className="bg-slate-50/50 rounded-lg p-4 border border-slate-200/50 hover:bg-blue-50/30 transition-colors duration-200"
          >
            {/* Avatar */}
            <div className="flex items-center space-x-3 space-x-reverse mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#387ADF] to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                {member.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 text-sm">{member.name}</h3>
                <p className="text-xs text-slate-600">{member.title}</p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center space-x-2 space-x-reverse text-xs text-slate-600">
                <Mail className="w-3 h-3" />
                <span>{member.email}</span>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse text-xs text-slate-600">
                <Clock className="w-3 h-3" />
                <span>{member.officeHours}</span>
              </div>
            </div>

            {/* Email Button */}
            <button
              onClick={() => handleSendEmail(member.email)}
              className="w-full bg-[#387ADF] hover:bg-[#387ADF]/90 text-white py-2 px-3 rounded-lg text-xs font-medium transition-colors duration-200"
            >
              שלח מייל
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
