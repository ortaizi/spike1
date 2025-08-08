"use client"

import { useState } from "react"
import { Bell, X, BarChart3, FileText, ClipboardList, AlertCircle } from "lucide-react"

interface Notification {
  id: string
  type: "grade" | "file" | "assignment" | "general"
  title: string
  course?: string
  timestamp: string
  isRead: boolean
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "grade",
    title: "ציון חדש: יסודות האלגוריתמים - 87",
    course: "יסודות האלגוריתמים והסיבוכיות",
    timestamp: "לפני שעה",
    isRead: false,
  },
  {
    id: "2",
    type: "file",
    title: "קובץ חדש הועלה: מבוא לסטטיסטיקה",
    course: "מבוא לסטטיסטיקה",
    timestamp: "לפני 2 שעות",
    isRead: false,
  },
  {
    id: "3",
    type: "assignment",
    title: "עדכון מטלה: הגשת פרויקט אמצע",
    course: "מיקרו כלכלה",
    timestamp: "לפני 3 שעות",
    isRead: true,
  },
  {
    id: "4",
    type: "grade",
    title: "ציון חדש במבוא לסטטיסטיקה: 92",
    course: "מבוא לסטטיסטיקה",
    timestamp: "לפני יום",
    isRead: false,
  },
  {
    id: "5",
    type: "file",
    title: "קובץ PDF חדש - מיקרו כלכלה שיעור 5",
    course: "מיקרו כלכלה",
    timestamp: "לפני יום",
    isRead: true,
  },
]

export function Notifications() {
  const [notifications, setNotifications] = useState(mockNotifications)

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "grade":
        return <BarChart3 className="w-5 h-5 text-emerald-600" />
      case "file":
        return <FileText className="w-5 h-5 text-sky-600" />
      case "assignment":
        return <ClipboardList className="w-5 h-5 text-orange-600" />
      default:
        return <AlertCircle className="w-5 h-5 text-purple-600" />
    }
  }

  const getNotificationDotClass = (type: string) => {
    switch (type) {
      case "grade":
        return "w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"
      case "file":
        return "w-2 h-2 bg-sky-500 rounded-full mt-2 flex-shrink-0"
      case "assignment":
        return "w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"
      default:
        return "w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"
    }
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, isRead: true } : notification)),
    )
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id)
    }
    console.log("Navigate to:", notification.type, notification.course)
  }

  const handleViewAll = () => {
    console.log("Navigate to all notifications")
  }

  return (
    <div className="overflow-hidden">
      {/* Notifications List */}
      <div className="space-y-0 max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Bell className="w-6 h-6 text-blue-400" />
            </div>
            <h4 className="text-sm font-semibold text-gray-900 mb-1">הכל מעודכן!</h4>
            <p className="text-xs text-gray-500">אין התראות חדשות</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`p-4 hover:bg-gray-50 transition-colors duration-200 cursor-pointer border-b border-gray-200/30 ${
                !notification.isRead ? "bg-blue-50" : ""
              }`}
            >
              <div className="flex items-start space-x-3 space-x-reverse">
                {/* Icon */}
                <div className="flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p
                        className={`text-sm leading-relaxed ${
                          notification.isRead ? "text-gray-700" : "text-gray-900 font-semibold"
                        }`}
                      >
                        {notification.title}
                      </p>
                      {notification.course && (
                        <p className="text-xs text-gray-500 mt-1 truncate">{notification.course}</p>
                      )}
                    </div>
                    
                    {/* Status Dot and Timestamp */}
                    <div className="flex items-center space-x-2 space-x-reverse flex-shrink-0">
                      {!notification.isRead && (
                        <div className={`w-2 h-2 rounded-full ${getNotificationDotClass(notification.type).replace('mt-2', '')}`}></div>
                      )}
                      <span className="text-xs text-gray-400">{notification.timestamp}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  )
}
