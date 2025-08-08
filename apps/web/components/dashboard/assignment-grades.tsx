"use client"

import { FileText, ChevronDown, ChevronUp, Award } from "lucide-react"
import { useState } from "react"

interface AssignmentGrade {
  id: string
  name: string
  grade: string
  maxGrade: string
  percentage: string
  status: "completed" | "pending" | "overdue"
  type: "assignment" | "exam" | "project"
}

const mockAssignmentGrades: AssignmentGrade[] = [
  {
    id: "1",
    name: "מטלה 1 - מבוא לאלגוריתמים",
    grade: "85",
    maxGrade: "100",
    percentage: "85%",
    status: "completed",
    type: "assignment",
  },
  {
    id: "2",
    name: "מטלה 2 - מיון וחיפוש",
    grade: "92",
    maxGrade: "100",
    percentage: "92%",
    status: "completed",
    type: "assignment",
  },
  {
    id: "3",
    name: "בחינת אמצע",
    grade: "78",
    maxGrade: "100",
    percentage: "78%",
    status: "completed",
    type: "exam",
  },
  {
    id: "4",
    name: "פרויקט סיום",
    grade: "95",
    maxGrade: "100",
    percentage: "95%",
    status: "completed",
    type: "project",
  },
  {
    id: "5",
    name: "מטלה 3 - גרפים",
    grade: "0",
    maxGrade: "100",
    percentage: "0%",
    status: "pending",
    type: "assignment",
  },
]

export function AssignmentGrades() {
  // Use a more specific state name to avoid conflicts
  const [isGradesExpanded, setIsGradesExpanded] = useState(false)

  const handleToggleExpanded = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsGradesExpanded(!isGradesExpanded)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return "dipy-badge dipy-badge-emerald"
      case "pending":
        return "dipy-badge dipy-badge-amber"
      case "overdue":
        return "dipy-badge dipy-badge-red"
      default:
        return "dipy-badge dipy-badge-slate"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "הושלם"
      case "pending":
        return "ממתין"
      case "overdue":
        return "עבר זמן"
      default:
        return "לא ידוע"
    }
  }

  const completedCount = mockAssignmentGrades.filter((a) => a.status === "completed").length

  return (
    <div className="space-y-4">
      {/* Header with Toggle */}
      <button
        onClick={handleToggleExpanded}
        className="w-full flex items-center justify-between cursor-pointer"
        type="button"
      >
        <div className="flex items-center space-x-3 space-x-reverse">
          <Award className="w-8 h-8 text-slate-600" />
          <h3 className="text-lg font-medium text-slate-900">ציוני מטלות</h3>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          <span className="text-sm text-slate-600">
            {completedCount}/{mockAssignmentGrades.length} הושלמו
          </span>
          {isGradesExpanded ? (
            <ChevronDown className="w-4 h-4 text-slate-600" />
          ) : (
            <ChevronUp className="w-4 h-4 text-slate-600" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isGradesExpanded && (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-right py-3 px-2 font-medium text-slate-700">מטלה</th>
                  <th className="text-center py-3 px-2 font-medium text-slate-700">ציון</th>
                  <th className="text-center py-3 px-2 font-medium text-slate-700">מתוך</th>
                  <th className="text-center py-3 px-2 font-medium text-slate-700">אחוז</th>
                  <th className="text-center py-3 px-2 font-medium text-slate-700">סטטוס</th>
                </tr>
              </thead>
              <tbody>
                {mockAssignmentGrades.map((assignment, index) => (
                  <tr
                    key={assignment.id}
                    className={`border-b border-slate-100 hover:bg-slate-50/50 transition-colors duration-200 ${
                      index % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                    }`}
                  >
                    <td className="py-3 px-2">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="font-medium text-slate-900 text-sm">{assignment.name}</span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-2 font-medium text-slate-900">{assignment.grade}</td>
                    <td className="text-center py-3 px-2 text-slate-600">{assignment.maxGrade}</td>
                    <td className="text-center py-3 px-2 font-medium text-slate-900">{assignment.percentage}</td>
                    <td className="text-center py-3 px-2">
                      <span className={`${getStatusBadge(assignment.status)} text-xs`}>
                        {getStatusText(assignment.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex justify-between text-sm text-slate-600">
              <span>סה"כ מטלות: {mockAssignmentGrades.length}</span>
              <span>הושלמו: {completedCount}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
