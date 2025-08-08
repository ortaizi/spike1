"use client"

import { useState, useEffect } from "react"
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, Plus, Eye } from "lucide-react"
import { EventCreationModal } from "./event-creation-modal"
import { ExamScheduleView } from "./exam-schedule-view"

interface ScheduleEvent {
  id: string
  title: string
  type: "lecture" | "practice" | "lab" | "exam" | "assignment" | "personal" | "event"
  course?: string
  courseColor?: string
  location?: string
  day: number // 0-6 (Sunday-Saturday)
  startTime: string
  endTime: string
  instructor?: string
  notes?: string
  priority?: "urgent" | "normal"
  isDeadline?: boolean
}

interface AssignmentDeadline {
  id: string
  title: string
  course: string
  courseColor: string
  day: number
  dueTime: string
}

const daysOfWeek = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"]
const daysOfWeekShort = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"]
const timeSlots = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
]

const mockScheduleEvents: ScheduleEvent[] = [
  {
    id: "1",
    title: "יסודות האלגוריתמים",
    type: "lecture",
    course: "יסודות האלגוריתמים והסיבוכיות",
    courseColor: "#387ADF",
    location: "בניין 90, כיתה 201",
    day: 0,
    startTime: "10:00",
    endTime: "12:00",
    instructor: "פרופ' יוסי כהן",
  },
  {
    id: "2",
    title: "תרגול אלגוריתמים",
    type: "practice",
    course: "יסודות האלגוריתמים והסיבוכיות",
    courseColor: "#10B981",
    location: "בניין 34, כיתה 102",
    day: 2,
    startTime: "14:00",
    endTime: "16:00",
    instructor: 'ד"ר שרה לוי',
  },
  {
    id: "3",
    title: "מבוא לסטטיסטיקה",
    type: "lecture",
    course: "מבוא לסטטיסטיקה",
    courseColor: "#387ADF",
    location: "בניין 72, כיתה 115",
    day: 1,
    startTime: "12:00",
    endTime: "14:00",
    instructor: 'ד"ר רחל גולן',
  },
  {
    id: "4",
    title: "מעבדת פיזיקה",
    type: "lab",
    course: "מבוא לפיזיקה",
    courseColor: "#A855F7",
    location: "בניין 54, מעבדה 3",
    day: 4,
    startTime: "13:00",
    endTime: "16:00",
  },
  {
    id: "5",
    title: "בחינת אמצע",
    type: "exam",
    course: "מיקרו כלכלה",
    courseColor: "#EF4444",
    location: "בניין 28, כיתה 301",
    day: 0,
    startTime: "16:00",
    endTime: "18:00",
  },
  {
    id: "6",
    title: "סדנת ניהול זמן",
    type: "event",
    courseColor: "#F43F5E",
    location: "מרכז הסטודנטים",
    day: 2,
    startTime: "18:00",
    endTime: "20:00",
  },
]

const mockDeadlines: AssignmentDeadline[] = [
  {
    id: "d1",
    title: "מטלה 2",
    course: "אלגוריתמים",
    courseColor: "#F97316",
    day: 3,
    dueTime: "23:59",
  },
  {
    id: "d2",
    title: "פרויקט סיום",
    course: "סטטיסטיקה",
    courseColor: "#F97316",
    day: 5,
    dueTime: "23:59",
  },
]

export function ScheduleContent() {
  const [currentWeek, setCurrentWeek] = useState(0)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [viewMode, setViewMode] = useState<"week" | "month">("week")
  const [showExamSchedule, setShowExamSchedule] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ day: number; time: string } | null>(null)
  const [events, setEvents] = useState(mockScheduleEvents)

  const getEventStyle = (event: ScheduleEvent) => {
    const startIndex = timeSlots.indexOf(event.startTime)
    const endIndex = timeSlots.indexOf(event.endTime)
    const duration = Math.max(1, endIndex - startIndex)

    return {
      gridColumn: `${event.day + 2}`,
      gridRow: `${startIndex + 2} / span ${duration}`,
    }
  }

  const getEventTypeColor = (type: string) => {
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

  const handlePrevious = () => {
    if (viewMode === "week") {
      setCurrentWeek((prev) => prev - 1)
    } else {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
    }
  }

  const handleNext = () => {
    if (viewMode === "week") {
      setCurrentWeek((prev) => prev + 1)
    } else {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
    }
  }

  const handleToday = () => {
    if (viewMode === "week") {
      setCurrentWeek(0)
    } else {
      setCurrentMonth(new Date())
    }
  }

  const handleTimeSlotClick = (day: number, time: string) => {
    setSelectedTimeSlot({ day, time })
    setShowEventModal(true)
  }

  const handleAddEvent = (newEvent: Omit<ScheduleEvent, "id">) => {
    const event: ScheduleEvent = {
      ...newEvent,
      id: Date.now().toString(),
    }
    setEvents((prev) => [...prev, event])
  }

  const today = new Date()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay() + currentWeek * 7)

  const formatDateRange = () => {
    if (viewMode === "week") {
      const start = new Date(startOfWeek)
      const end = new Date(startOfWeek)
      end.setDate(start.getDate() + 6)

      const startDay = start.getDate()
      const startMonth = start.getMonth() + 1
      const endDay = end.getDate()
      const endMonth = end.getMonth() + 1

      return `${startDay}/${startMonth} - ${endDay}/${endMonth}`
    } else {
      const monthNames = [
        "ינואר",
        "פברואר",
        "מרץ",
        "אפריל",
        "מאי",
        "יוני",
        "יולי",
        "אוגוסט",
        "ספטמבר",
        "אוקטובר",
        "נובמבר",
        "דצמבר",
      ]
      return `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`
    }
  }

  const getMonthDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days = []
    const currentDate = new Date(startDate)

    while (currentDate <= lastDay || days.length < 42) {
      days.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return days
  }

  const getEventsForDay = (dayIndex: number, date?: Date) => {
    return events.filter((event) => event.day === dayIndex)
  }

  const getDeadlinesForDay = (dayIndex: number) => {
    return mockDeadlines.filter((deadline) => deadline.day === dayIndex)
  }

  if (showExamSchedule) {
    return <ExamScheduleView onBack={() => setShowExamSchedule(false)} />
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 space-x-reverse mb-2">
          <Calendar className="w-8 h-8 text-black" />
          <h1 className="text-3xl font-bold text-black text-right">מערכת שעות</h1>
        </div>
        <p className="text-gray-600 text-right">צפה במערכת השעות שלך וצור אירועים חדשים.</p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-3 space-x-reverse mb-6">
        <button
          onClick={() => setShowExamSchedule(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 space-x-reverse hover:bg-blue-700 transition-colors"
        >
          <Eye className="w-4 h-4" />
          <span>ללוח בחינות</span>
        </button>
        <button
          onClick={() => setShowEventModal(true)}
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 space-x-reverse hover:bg-gray-200 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>אירוע חדש</span>
        </button>
      </div>

      {/* Calendar Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          {/* Navigation */}
          <div className="flex items-center space-x-3 space-x-reverse">
            <button
              onClick={handlePrevious}
              className="dipy-button dipy-button-secondary flex items-center space-x-2 space-x-reverse"
            >
              <ChevronRight className="w-4 h-4" />
              <span>{viewMode === "week" ? "שבוע קודם" : "חודש קודם"}</span>
            </button>
            <button onClick={handleToday} className="dipy-button dipy-button-secondary">
              היום
            </button>
            <button
              onClick={handleNext}
              className="dipy-button dipy-button-secondary flex items-center space-x-2 space-x-reverse"
            >
              <span>{viewMode === "week" ? "שבוע הבא" : "חודש הבא"}</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Date Display */}
          <div className="text-center">
            <h2 className="dipy-title">{formatDateRange()}</h2>
            {((viewMode === "week" && currentWeek === 0) ||
              (viewMode === "month" &&
                currentMonth?.getMonth() === today.getMonth() &&
                currentMonth?.getFullYear() === today.getFullYear())) && (
              <span className="dipy-badge dipy-badge-blue mt-2">
                {viewMode === "week" ? "השבוع הנוכחי" : "החודש הנוכחי"}
              </span>
            )}
          </div>

          {/* View Toggle */}
          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              onClick={() => setViewMode("week")}
              className={`dipy-button ${viewMode === "week" ? "dipy-button-primary" : "dipy-button-secondary"} text-sm px-4 py-2`}
            >
              שבוע
            </button>
            <button
              onClick={() => setViewMode("month")}
              className={`dipy-button ${viewMode === "month" ? "dipy-button-primary" : "dipy-button-secondary"} text-sm px-4 py-2`}
            >
              חודש
            </button>
          </div>
        </div>

        {/* Calendar Content */}
        <div className="overflow-x-auto">
          {viewMode === "week" ? (
            /* Weekly View */
            <div className="min-w-[900px] relative">
              <div
                className="grid gap-0"
                style={{
                  gridTemplateColumns: "80px repeat(7, 1fr)",
                  gridTemplateRows: `60px repeat(${timeSlots.length}, 80px)`,
                }}
              >
                {/* Empty top-left corner */}
                <div className="border-b border-slate-200 bg-gray-50"></div>

                {/* Days of week headers */}
                {daysOfWeek.map((day, index) => {
                  const dayDate = new Date(startOfWeek.getTime() + index * 24 * 60 * 60 * 1000)
                  const isToday = index === today.getDay() && currentWeek === 0

                  return (
                    <div
                      key={day}
                      className={`p-3 text-center font-medium border-b border-r border-slate-200 ${
                        isToday ? "bg-indigo-50 text-indigo-700" : "bg-gray-50"
                      }`}
                    >
                      <div className="text-sm font-semibold">{day}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {dayDate.getDate()}/{dayDate.getMonth() + 1}
                      </div>
                    </div>
                  )
                })}

                {/* Time slots */}
                {timeSlots.map((time) => (
                  <div
                    key={time}
                    className="p-2 text-xs text-center text-gray-500 border-r border-b border-slate-200 bg-gray-50/50 flex items-center justify-center font-medium"
                  >
                    {time}
                  </div>
                ))}

                {/* Day columns with time slots */}
                {daysOfWeek.map((_, dayIndex) => {
                  const isToday = dayIndex === today.getDay() && currentWeek === 0

                  return timeSlots.map((time, timeIndex) => (
                    <div
                      key={`${dayIndex}-${timeIndex}`}
                      className={`h-20 border-b border-r border-slate-200 cursor-pointer hover:bg-blue-50/30 transition-colors duration-200 relative ${
                        isToday ? "bg-indigo-50/20" : "bg-white"
                      }`}
                      onClick={() => handleTimeSlotClick(dayIndex, time)}
                    />
                  ))
                })}

                {/* Events */}
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="absolute bg-white rounded-lg shadow-sm border-l-4 p-2 m-1 cursor-pointer hover:shadow-md transition-all duration-200 z-10 overflow-hidden"
                    style={{
                      ...getEventStyle(event),
                      borderLeftColor: getEventTypeColor(event.type),
                      left: `${80 + event.day * (100 / 7)}%`,
                      right: `${100 - 80 - (event.day + 1) * (100 / 7)}%`,
                      top: `${60 + (timeSlots.indexOf(event.startTime) * 80) + 4}px`,
                      height: `${(timeSlots.indexOf(event.endTime) - timeSlots.indexOf(event.startTime)) * 80 - 8}px`,
                    }}
                    onClick={() => console.log("Edit event:", event.id)}
                  >
                    <div
                      className="font-semibold text-sm truncate mb-1"
                      style={{ color: getEventTypeColor(event.type) }}
                    >
                      {event.title}
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <div className="flex items-center space-x-1 space-x-reverse">
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        <span>
                          {event.startTime} - {event.endTime}
                        </span>
                      </div>

                      {event.location && (
                        <div className="flex items-center space-x-1 space-x-reverse">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}

                      {event.course && <div className="text-xs text-slate-500 truncate">{event.course}</div>}
                    </div>
                  </div>
                ))}

                {/* Assignment Deadlines */}
                {mockDeadlines.map((deadline) => (
                  <div
                    key={deadline.id}
                    className="absolute top-1 right-1 z-20"
                    style={{
                      left: `${80 + (deadline.day * (100 / 7)) + 2}%`,
                      top: "62px",
                    }}
                  >
                    <div className="bg-orange-100 border border-orange-300 rounded-full px-2 py-1 text-xs text-orange-800 font-medium shadow-sm">
                      <div className="flex items-center space-x-1 space-x-reverse">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span>
                          {deadline.title} עד {deadline.dueTime}
                        </span>
                      </div>
                      <div className="text-xs text-orange-600">{deadline.course}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Monthly View */
            <div className="min-w-[700px]">
              <div className="grid grid-cols-7 gap-0">
                {/* Days of week headers */}
                {daysOfWeekShort.map((day) => (
                  <div key={day} className="p-3 text-center font-medium border-b border-slate-200 bg-gray-50">
                    {day}
                  </div>
                ))}

                {/* Calendar days */}
                {getMonthDays().map((date, index) => {
                  const isCurrentMonth = date.getMonth() === currentMonth?.getMonth() || 0
                  const isToday = date.toDateString() === today.toDateString()
                  const dayEvents = getEventsForDay(date.getDay(), date)
                  const dayDeadlines = getDeadlinesForDay(date.getDay())

                  return (
                    <div
                      key={index}
                      className={`min-h-[120px] p-2 border-b border-r border-slate-200 cursor-pointer hover:bg-blue-50/30 transition-colors duration-200 ${
                        isCurrentMonth ? "bg-white" : "bg-gray-50/50"
                      } ${isToday ? "bg-indigo-50 ring-2 ring-indigo-200" : ""}`}
                      onClick={() => {
                        // Handle day click for monthly view
                        console.log("Day clicked:", date)
                      }}
                    >
                      <div
                        className={`text-sm font-medium mb-2 ${
                          isCurrentMonth ? "text-slate-900" : "text-slate-400"
                        } ${isToday ? "text-indigo-700" : ""}`}
                      >
                        {date.getDate()}
                      </div>

                      {/* Events in monthly view */}
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            className="text-xs p-1 rounded border-l-2 bg-white/80 truncate"
                            style={{ borderLeftColor: getEventTypeColor(event.type) }}
                          >
                            {event.title}
                          </div>
                        ))}

                        {dayEvents.length > 2 && (
                          <div className="text-xs text-slate-500">+{dayEvents.length - 2} נוספים</div>
                        )}

                        {/* Deadlines in monthly view */}
                        {dayDeadlines.map((deadline) => (
                          <div
                            key={deadline.id}
                            className="text-xs bg-orange-100 text-orange-800 p-1 rounded border border-orange-200"
                          >
                            <div className="flex items-center space-x-1 space-x-reverse">
                              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                              <span className="truncate">{deadline.title}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="dipy-card dipy-fade-in">
        <h3 className="dipy-title mb-4">מקרא</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: "#387ADF" }}></div>
            <span className="text-sm">הרצאות</span>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: "#10B981" }}></div>
            <span className="text-sm">תרגולים</span>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: "#A855F7" }}></div>
            <span className="text-sm">מעבדות</span>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: "#F97316" }}></div>
            <span className="text-sm">דדליינים</span>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: "#EF4444" }}></div>
            <span className="text-sm">בחינות</span>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: "#F43F5E" }}></div>
            <span className="text-sm">אירועים</span>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span className="text-sm">דדליין</span>
          </div>
        </div>
      </div>

      {/* Event Creation Modal */}
      {showEventModal && (
        <EventCreationModal
          isOpen={showEventModal}
          onClose={() => {
            setShowEventModal(false)
            setSelectedTimeSlot(null)
          }}
          onSave={handleAddEvent}
          selectedTimeSlot={selectedTimeSlot}
        />
      )}
    </div>
  )
}
