"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, FileText, PenTool, HelpCircle, Play, ChevronLeft } from "lucide-react"

interface SectionItem {
  id: string
  title: string
  type: "video" | "document" | "assignment" | "quiz"
  duration?: string
  dueDate?: string
}

interface CourseSection {
  id: string
  title: string
  itemCount: number
  items: SectionItem[]
}

interface CourseSectionsProps {
  sections: CourseSection[]
}

export function CourseSections({ sections }: CourseSectionsProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const getItemIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Play className="w-4 h-4 text-red-500" />
      case "document":
        return <FileText className="w-4 h-4 text-blue-500" />
      case "assignment":
        return <PenTool className="w-4 h-4 text-green-500" />
      case "quiz":
        return <HelpCircle className="w-4 h-4 text-purple-500" />
      default:
        return <FileText className="w-4 h-4 text-slate-500" />
    }
  }

  const handleItemClick = (item: SectionItem) => {
    console.log("Open item:", item.title)
    // Implement item opening logic
  }

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <div key={section.id} className="card-3d-effect rounded-xl overflow-hidden">
          {/* Section Header */}
          <button
            onClick={() => toggleSection(section.id)}
            className="w-full p-6 text-right hover:bg-blue-50/30 transition-colors duration-200 flex items-center justify-between"
          >
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="p-2 bg-blue-100/80 rounded-lg border border-blue-200/30">
                {expandedSections.has(section.id) ? (
                  <ChevronDown className="w-5 h-5 text-[#387ADF]" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-[#387ADF]" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{section.title}</h3>
                <p className="text-sm text-slate-600">{section.itemCount} פריטים</p>
              </div>
            </div>
          </button>

          {/* Section Content */}
          {expandedSections.has(section.id) && (
            <div className="border-t border-slate-200/50 bg-slate-50/30">
              <div className="p-6 pt-4">
                <div className="space-y-3">
                  {section.items.map((item, index) => (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className="w-full text-right p-3 rounded-lg hover:bg-white/80 transition-colors duration-200 flex items-center space-x-3 space-x-reverse border border-transparent hover:border-slate-200/50"
                    >
                      <span className="text-slate-400 text-sm font-medium min-w-[2rem]">
                        {(index + 1).toString().padStart(2, "0")}
                      </span>

                      <div className="flex items-center space-x-2 space-x-reverse">{getItemIcon(item.type)}</div>

                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900 text-sm">{item.title}</h4>
                        <div className="flex items-center space-x-4 space-x-reverse text-xs text-slate-500 mt-1">
                          {item.duration && <span>משך: {item.duration}</span>}
                          {item.dueDate && <span>תאריך הגשה: {item.dueDate}</span>}
                        </div>
                      </div>

                      <ChevronLeft className="w-4 h-4 text-slate-400" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
