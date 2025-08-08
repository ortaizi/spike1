"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X, Calendar, Clock, MapPin, BookOpen, FileText } from "lucide-react"

interface EventCreationModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (event: {
    title: string
    type: "lecture" | "practice" | "lab" | "exam" | "assignment" | "personal" | "event"
    course?: string
    courseColor?: string
    location?: string
    day: number
    startTime: string
    endTime: string
    notes?: string
    priority?: "urgent" | "normal"
  }) => void
  selectedTimeSlot?: { day: number; time: string } | null
}

const daysOfWeek = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"]
const timeSlots = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, "0")}:00`)

const mockCourses = [
  { id: "1", name: "יסודות האלגוריתמים והסיבוכיות", color: "#387ADF" },
  { id: "2", name: "מבוא לסטטיסטיקה", color: "#10B981" },
  { id: "3", name: "מיקרו כלכלה", color: "#A855F7" },
  { id: "4", name: "אלגברה לינארית", color: "#EF4444" },
  { id: "5", name: "מבוא לפיזיקה", color: "#F97316" },
]

export function EventCreationModal({ isOpen, onClose, onSave, selectedTimeSlot }: EventCreationModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    type: "personal" as "lecture" | "practice" | "lab" | "exam" | "assignment" | "personal" | "event",
    course: "",
    location: "",
    day: selectedTimeSlot?.day || 0,
    startTime: selectedTimeSlot?.time || "09:00",
    endTime: "10:00",
    notes: "",
    priority: "normal" as "urgent" | "normal",
  })

  useEffect(() => {
    if (selectedTimeSlot) {
      setFormData((prev) => ({
        ...prev,
        day: selectedTimeSlot.day,
        startTime: selectedTimeSlot.time,
      }))
    }
  }, [selectedTimeSlot])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const selectedCourse = mockCourses.find((c) => c.id === formData.course)

    onSave({
      ...formData,
      course: selectedCourse?.name,
      courseColor: selectedCourse?.color,
    })

    onClose()

    // Reset form
    setFormData({
      title: "",
      type: "personal",
      course: "",
      location: "",
      day: 0,
      startTime: "09:00",
      endTime: "10:00",
      notes: "",
      priority: "normal",
    })
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "lecture":
        return "#387ADF"
      case "practice":
        return "#10B981"
      case "lab":
        return "#A855F7"
      case "assignment":
        return "#F97316"
      case "exam":
        return "#EF4444"
      case "event":
        return "#F43F5E"
      default:
        return "#64748B"
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="dipy-card max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="dipy-title text-lg">אירוע חדש</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200">
            <X className="w-5 h-5 text-slate-500" suppressHydrationWarning />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="dipy-label">כותרת האירוע</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              className="dipy-input"
              placeholder="הכנס כותרת..."
              required
            />
          </div>

          {/* Type */}
          <div>
            <label className="dipy-label">סוג האירוע</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value as any }))}
              className="dipy-input"
            >
              <option value="personal">אישי</option>
              <option value="lecture">הרצאה</option>
              <option value="practice">תרגול</option>
              <option value="lab">מעבדה</option>
              <option value="assignment">מטלה</option>
              <option value="exam">בחינה</option>
              <option value="event">אירוע</option>
            </select>
          </div>

          {/* Course Selection */}
          {(formData.type === "lecture" ||
            formData.type === "practice" ||
            formData.type === "lab" ||
            formData.type === "assignment" ||
            formData.type === "exam") && (
            <div>
              <label className="dipy-label">קורס</label>
              <select
                value={formData.course}
                onChange={(e) => setFormData((prev) => ({ ...prev, course: e.target.value }))}
                className="dipy-input"
              >
                <option value="">בחר קורס...</option>
                {mockCourses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="dipy-label">יום</label>
              <select
                value={formData.day}
                onChange={(e) => setFormData((prev) => ({ ...prev, day: Number.parseInt(e.target.value) }))}
                className="dipy-input"
              >
                {daysOfWeek.map((day, index) => (
                  <option key={index} value={index}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="dipy-label">שעת התחלה</label>
              <select
                value={formData.startTime}
                onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))}
                className="dipy-input"
              >
                {timeSlots.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="dipy-label">שעת סיום</label>
              <select
                value={formData.endTime}
                onChange={(e) => setFormData((prev) => ({ ...prev, endTime: e.target.value }))}
                className="dipy-input"
              >
                {timeSlots.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="dipy-label">מיקום (אופציונלי)</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
              className="dipy-input"
              placeholder="בניין, כיתה..."
            />
          </div>

          {/* Priority */}
          {formData.type === "assignment" && (
            <div>
              <label className="dipy-label">עדיפות</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData((prev) => ({ ...prev, priority: e.target.value as any }))}
                className="dipy-input"
              >
                <option value="normal">רגיל</option>
                <option value="urgent">דחוף</option>
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="dipy-label">הערות (אופציונלי)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              className="dipy-input resize-none"
              rows={3}
              placeholder="הערות נוספות..."
            />
          </div>

          {/* Preview */}
          <div
            className="p-3 rounded-lg border-r-4 bg-slate-50"
            style={{ borderRightColor: getTypeColor(formData.type) }}
          >
            <div className="flex items-center space-x-2 space-x-reverse mb-2">
              <div className="p-1 rounded" style={{ backgroundColor: `${getTypeColor(formData.type)}20` }}>
                {formData.type === "assignment" ? (
                  <FileText className="w-4 h-4" style={{ color: getTypeColor(formData.type) }} suppressHydrationWarning />
                ) : formData.type === "lecture" || formData.type === "practice" ? (
                  <BookOpen className="w-4 h-4" style={{ color: getTypeColor(formData.type) }} suppressHydrationWarning />
                ) : (
                  <Calendar className="w-4 h-4" style={{ color: getTypeColor(formData.type) }} suppressHydrationWarning />
                )}
              </div>
              <span className="text-sm font-medium" style={{ color: getTypeColor(formData.type) }}>
                {formData.title || "כותרת האירוע"}
              </span>
            </div>
            <div className="text-xs text-slate-600 space-y-1">
              <div className="flex items-center space-x-1 space-x-reverse">
                <Calendar className="w-3 h-3" suppressHydrationWarning />
                <span>{daysOfWeek[formData.day]}</span>
              </div>
              <div className="flex items-center space-x-1 space-x-reverse">
                <Clock className="w-3 h-3" suppressHydrationWarning />
                <span>
                  {formData.startTime} - {formData.endTime}
                </span>
              </div>
              {formData.location && (
                <div className="flex items-center space-x-1 space-x-reverse">
                  <MapPin className="w-3 h-3" suppressHydrationWarning />
                  <span>{formData.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 space-x-reverse pt-4">
            <button type="button" onClick={onClose} className="dipy-button dipy-button-secondary flex-1">
              ביטול
            </button>
            <button type="submit" className="dipy-button dipy-button-primary flex-1">
              שמור אירוע
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
