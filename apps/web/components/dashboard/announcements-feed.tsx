"use client"

import { useState } from "react"
import { MessageSquare, ChevronDown, ChevronUp } from "lucide-react"

interface Announcement {
  id: string
  title: string
  content: string
  instructor: string
  date: string
  isNew?: boolean
}

interface AnnouncementsFeedProps {
  announcements: Announcement[]
}

export function AnnouncementsFeed({ announcements }: AnnouncementsFeedProps) {
  const [expandedAnnouncements, setExpandedAnnouncements] = useState<Set<string>>(new Set())

  const toggleAnnouncement = (id: string) => {
    const newExpanded = new Set(expandedAnnouncements)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedAnnouncements(newExpanded)
  }

  const truncateText = (text: string, maxLength = 150) => {
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text
  }

  return (
    <div className="card-3d-effect rounded-xl p-6">
      <div className="flex items-center space-x-2 space-x-reverse mb-6">
        <div className="p-2 bg-blue-100/80 rounded-lg border border-blue-200/30">
          <MessageSquare className="w-5 h-5 text-[#387ADF]" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">לוח הודעות</h2>
        {announcements.some((a) => a.isNew) && (
          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            {announcements.filter((a) => a.isNew).length} חדש
          </span>
        )}
      </div>

      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>אין הודעות חדשות</p>
          </div>
        ) : (
          announcements.map((announcement, index) => (
            <div
              key={announcement.id}
              className={`border-b border-slate-200/50 pb-4 ${index === announcements.length - 1 ? "border-b-0 pb-0" : ""}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 space-x-reverse mb-1">
                    <h3 className="font-semibold text-slate-900 text-sm">{announcement.title}</h3>
                    {announcement.isNew && (
                      <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">חדש</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mb-2">
                    {announcement.instructor} • {announcement.date}
                  </p>
                </div>
              </div>

              <div className="text-sm text-slate-700 leading-relaxed">
                {expandedAnnouncements.has(announcement.id) ? (
                  <div>
                    <p className="mb-3">{announcement.content}</p>
                    <button
                      onClick={() => toggleAnnouncement(announcement.id)}
                      className="flex items-center space-x-1 space-x-reverse text-[#387ADF] hover:text-[#387ADF]/80 text-xs font-medium"
                    >
                      <ChevronDown className="w-3 h-3" />
                      <span>הצג פחות</span>
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="mb-3">{truncateText(announcement.content)}</p>
                    {announcement.content.length > 150 && (
                      <button
                        onClick={() => toggleAnnouncement(announcement.id)}
                        className="flex items-center space-x-1 space-x-reverse text-[#387ADF] hover:text-[#387ADF]/80 text-xs font-medium"
                      >
                        <ChevronUp className="w-3 h-3" />
                        <span>קרא עוד</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
