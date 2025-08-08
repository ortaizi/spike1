"use client"
import { BookOpen } from "lucide-react"

interface Course {
  id: string
  name: string
  code: string
  semester: string
  credits: number
  color: string
}

interface CourseSidebarProps {
  courses: Course[]
  activeCourse: string
  onCourseSelect: (courseId: string) => void
}

export function CourseSidebar({ courses, activeCourse, onCourseSelect }: CourseSidebarProps) {
  return (
    <div className="dipy-card dipy-fade-in p-4 h-fit sticky top-6 border-r-4 border-r-blue-500">
      <div className="flex items-center space-x-3 space-x-reverse mb-6">
        <BookOpen className="w-8 h-8 text-slate-600" />
        <h2 className="text-lg font-semibold text-slate-900">הקורסים שלי</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-2">
        {courses.map((course) => (
          <button
            key={course.id}
            onClick={() => onCourseSelect(course.id)}
            className={`w-full text-right p-3 rounded-lg transition-all duration-200 ${
              activeCourse === course.id
                ? "text-blue-600 bg-blue-50/50 border border-blue-200/50 shadow-sm"
                : "text-gray-700 hover:text-gray-900"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3
                  className={`font-semibold text-base mb-1 ${
                    activeCourse === course.id ? "text-blue-600" : "text-gray-900"
                  }`}
                >
                  {course.name}
                </h3>
                <p className="text-sm text-gray-600 mb-2">{course.code}</p>
                <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-500">
                  <span>{course.credits} נק"ז</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
