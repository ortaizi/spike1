"use client"

import { Calendar, Clock, MapPin, ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"

interface ExamDate {
  id: string
  period: "מועד א'" | "מועד ב'"
  date: string
  time: string
  location: string
  duration: string
  isRegistered: boolean
}

interface ExamDatesProps {
  courseId: string
}

const mockExamDates: { [key: string]: ExamDate[] } = {
  "1": [
    {
      id: "1",
      period: "מועד א'",
      date: "15/06/2025",
      time: "10:00",
      location: "בניין 28, אולם 101",
      duration: "3 שעות",
      isRegistered: true,
    },
    {
      id: "2",
      period: "מועד ב'",
      date: "28/08/2025",
      time: "16:00",
      location: "בניין 28, אולם 205",
      duration: "3 שעות",
      isRegistered: false,
    },
  ],
  "2": [
    {
      id: "3",
      period: "מועד א'",
      date: "20/06/2025",
      time: "14:00",
      location: "בניין 15, אולם 203",
      duration: "2 שעות",
      isRegistered: true,
    },
    {
      id: "4",
      period: "מועד ב'",
      date: "05/09/2025",
      time: "10:00",
      location: "בניין 15, אולם 203",
      duration: "2 שעות",
      isRegistered: false,
    },
  ],
  "3": [
    {
      id: "5",
      period: "מועד א'",
      date: "25/06/2025",
      time: "16:00",
      location: "בניין 28, אולם 301",
      duration: "3 שעות",
      isRegistered: true,
    },
    {
      id: "6",
      period: "מועד ב'",
      date: "28/08/2025",
      time: "16:00",
      location: "בניין 28, אולם 205",
      duration: "3 שעות",
      isRegistered: false,
    },
  ],
}

export function ExamDates({ courseId }: ExamDatesProps) {
  const examDates = mockExamDates[courseId] || []
  const [isExpanded, setIsExpanded] = useState(false)
  const [expandedExams, setExpandedExams] = useState<Set<string>>(new Set())

  const handleToggleExpanded = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  const toggleExamDetails = (examId: string) => {
    const newExpanded = new Set(expandedExams)
    if (newExpanded.has(examId)) {
      newExpanded.delete(examId)
    } else {
      newExpanded.add(examId)
    }
    setExpandedExams(newExpanded)
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
          <Calendar className="w-8 h-8 text-slate-600" />
          <h3 className="text-lg font-medium text-slate-900">תאריכי בחינות</h3>
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
          {examDates.length === 0 ? (
            <div className="text-center py-6 text-slate-500">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">טרם נקבעו תאריכי בחינות</p>
            </div>
          ) : (
            <>
              {examDates.map((exam) => (
                <div
                  key={exam.id}
                  className="bg-slate-50/50 rounded-lg p-4 border border-slate-200/50 hover:bg-blue-50/30 transition-colors duration-200"
                >
                  {/* Compact Exam Info */}
                  <button
                    onClick={() => toggleExamDetails(exam.id)}
                    className="w-full flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center space-x-4 space-x-reverse">
                      <span className="font-medium text-slate-900">{exam.period}</span>
                      <span className="font-medium text-slate-900">{exam.date}</span>
                    </div>
                    
                    {expandedExams.has(exam.id) ? (
                      <ChevronDown className="w-4 h-4 text-slate-600" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-slate-600" />
                    )}
                  </button>

                  {/* Expanded Exam Details */}
                  {expandedExams.has(exam.id) && (
                    <div className="mt-4 pt-4 border-t border-slate-200/50 space-y-2">
                      <div className="flex items-center space-x-2 space-x-reverse text-sm text-slate-700">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <span>
                          {exam.time} ({exam.duration})
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse text-sm text-slate-600">
                        <MapPin className="w-4 h-4 text-slate-500" />
                        <span>{exam.location}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Additional Info */}
              <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>הערה:</strong> ההרשמה לבחינות נפתחת 30 יום לפני מועד הבחינה. יש להירשם במערכת האקדמית עד 7 ימים
                  לפני הבחינה.
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
