"use client"

import { AssignmentsTable } from "./assignments-table"
import { TodoList } from "./todo-list"
import { ClipboardList, Calendar, CheckCircle } from "lucide-react"

export function AssignmentsContent() {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 space-x-reverse mb-2">
          <ClipboardList className="w-8 h-8 text-black" />
          <h1 className="text-3xl font-bold text-black text-right">מטלות</h1>
        </div>
        <p className="text-gray-600 text-right">
          כאן תוכל לראות את כל המטלות הפתוחות שלך, מסודרות לפי תאריך ההגשה והזמן שנותר לביצוע.
        </p>
      </div>

      {/* Main Content Grid - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Assignments Table - Right Side */}
        <div className="dipy-card dipy-fade-in dipy-accent-orange">
          <div className="flex items-center space-x-3 space-x-reverse mb-6">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Calendar className="dipy-icon dipy-icon-orange" />
            </div>
            <h2 className="dipy-title">מטלות פתוחות</h2>
          </div>
          <AssignmentsTable />
        </div>

        {/* Todo List - Left Side */}
        <div className="dipy-card dipy-fade-in dipy-accent-emerald">
          <div className="flex items-center space-x-3 space-x-reverse mb-6">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <CheckCircle className="dipy-icon dipy-icon-emerald" />
            </div>
            <h2 className="dipy-title">המשימות שלי</h2>
          </div>
          <TodoList />
        </div>
      </div>
    </div>
  )
}
