"use client"

import { Mail, Users, ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"

interface StaffMember {
  id: string
  name: string
  title: string
  email: string
  officeHours: string
  avatar?: string
}

interface HorizontalTeachingStaffProps {
  staff: StaffMember[]
}

export function HorizontalTeachingStaff({ staff }: HorizontalTeachingStaffProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleToggleExpanded = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  return (
    <div className="space-y-4">
      {/* Header with Toggle */}
      <button
        onClick={handleToggleExpanded}
        className="w-full flex items-center justify-between cursor-pointer"
        type="button"
      >
        <div className="flex items-center space-x-3 space-x-reverse">
          <Users className="w-8 h-8 text-slate-600" />
          <h3 className="text-lg font-medium text-slate-900">צוות הקורס</h3>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-slate-600" />
        ) : (
          <ChevronUp className="w-4 h-4 text-slate-600" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="space-y-3">
          {staff.map((member) => (
            <div
              key={member.id}
              className="bg-slate-50/50 rounded-lg p-4 border border-slate-200/50 hover:bg-blue-50/30 transition-colors duration-200"
            >
              {/* Member Info */}
              <div className="space-y-3">
                {/* Name and Email */}
                <div className="flex items-center justify-between">
                  <div className="text-right">
                    <h3 className="font-semibold text-slate-900 text-sm">{member.name}</h3>
                    <div className="flex items-center space-x-2 space-x-reverse text-xs text-slate-600">
                      <span>{member.title}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse text-xs text-slate-500">
                    <Mail className="w-3 h-3" />
                    <span>{member.email}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
