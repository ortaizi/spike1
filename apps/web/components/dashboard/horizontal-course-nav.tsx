"use client"

import { useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface Course {
  id: string
  name: string
  code: string
  semester: string
  credits: number
  color: string
}

interface HorizontalCourseNavProps {
  courses: Course[]
  activeCourse: string
  onCourseSelect: (courseId: string) => void
}

export function HorizontalCourseNav({ courses, activeCourse, onCourseSelect }: HorizontalCourseNavProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: "smooth" })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: "smooth" })
    }
  }

  const truncateName = (name: string, maxLength = 25) => {
    return name.length > maxLength ? name.substring(0, maxLength) + "..." : name
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-2">
      <div className="flex items-center justify-end">
        <div className="flex items-center space-x-2 space-x-reverse">
          <button onClick={scrollLeft} className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200">
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
          <button onClick={scrollRight} className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200">
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex space-x-4 space-x-reverse overflow-x-auto mt-2 pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {courses.map((course) => (
          <button
            key={course.id}
            onClick={() => onCourseSelect(course.id)}
            className={`flex-shrink-0 p-4 rounded-lg border transition-all duration-200 min-w-[200px] ${
              activeCourse === course.id
                ? "bg-blue-50 border-blue-200 shadow-sm"
                : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 text-right">
                <h3
                  className={`font-semibold text-sm ${
                    activeCourse === course.id ? "text-black" : "text-black"
                  }`}
                  title={course.name}
                >
                  {truncateName(course.name)}
                </h3>
              </div>
              <div
                className={`w-3 h-3 rounded-full ${course.color} ml-3 ${
                  activeCourse === course.id ? "ring-2 ring-blue-300" : ""
                }`}
              ></div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
