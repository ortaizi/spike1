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

interface CompactAnnouncementsProps {
  announcements: Announcement[]
}

export function CompactAnnouncements({ announcements }: CompactAnnouncementsProps) {
  // Use a more specific state name to avoid conflicts
  const [isAnnouncementsExpanded, setIsAnnouncementsExpanded] = useState(false)
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

  const handleToggleExpanded = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsAnnouncementsExpanded(!isAnnouncementsExpanded)
  }

  const truncateText = (text: string, maxLength = 80) => {
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text
  }

  const newAnnouncementsCount = announcements.filter((a) => a.isNew).length

  return (
    <div className="space-y-3">
      {/* Header with Toggle */}
      <button
        onClick={handleToggleExpanded}
        className="w-full flex items-center justify-between cursor-pointer"
        type="button"
      >
        <div className="flex items-center space-x-3 space-x-reverse">
          <MessageSquare className="w-8 h-8 text-slate-600" />
          <h3 className="text-lg font-medium text-slate-900">לוח הודעות</h3>
          {newAnnouncementsCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {newAnnouncementsCount}
            </span>
          )}
        </div>
        {isAnnouncementsExpanded ? (
          <ChevronDown className="w-4 h-4 text-slate-600" />
        ) : (
          <ChevronUp className="w-4 h-4 text-slate-600" />
        )}
      </button>

      {/* Expanded Content */}
      {isAnnouncementsExpanded && (
        <div className="space-y-2">
          {announcements.length === 0 ? (
            <div className="text-center py-6 text-slate-500">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">אין הודעות חדשות</p>
            </div>
          ) : (
            announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="bg-slate-50/50 rounded-lg p-3 border border-slate-200/50 hover:bg-blue-50/30 transition-colors duration-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 space-x-reverse mb-1">
                      <h4 className="font-medium text-slate-900 text-sm truncate">{announcement.title}</h4>
                      {announcement.isNew && (
                        <span className="bg-red-100 text-red-800 text-xs px-1.5 py-0.5 rounded-full flex-shrink-0">
                          חדש
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600">
                      {announcement.instructor} • {announcement.date}
                    </p>
                  </div>
                </div>

                <div className="text-sm text-slate-700 leading-relaxed">
                  {expandedAnnouncements.has(announcement.id) ? (
                    <div>
                      <p className="mb-2">{announcement.content}</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleAnnouncement(announcement.id)
                        }}
                        className="flex items-center space-x-1 space-x-reverse text-[#387ADF] hover:text-[#387ADF]/80 text-xs font-medium"
                        type="button"
                      >
                        <ChevronDown className="w-3 h-3" />
                        <span>הצג פחות</span>
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="mb-2">{truncateText(announcement.content)}</p>
                      {announcement.content.length > 80 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleAnnouncement(announcement.id)
                          }}
                          className="flex items-center space-x-1 space-x-reverse text-[#387ADF] hover:text-[#387ADF]/80 text-xs font-medium"
                          type="button"
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
      )}
    </div>
  )
}
