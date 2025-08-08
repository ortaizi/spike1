"use client"

import type React from "react"

import { useState } from "react"
import { ChevronDown, ChevronRight, FileText, PenTool, HelpCircle, Play, Download, BookOpen } from "lucide-react"

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

interface ModernCourseSectionsProps {
  sections: CourseSection[]
}

export function ModernCourseSections({ sections }: ModernCourseSectionsProps) {
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

  const handleDownload = (item: SectionItem, e: React.MouseEvent) => {
    e.stopPropagation()
    console.log("Download item:", item.title)
    // Implement download logic
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3 space-x-reverse mb-6">
        <BookOpen className="w-8 h-8 text-slate-600" />
        <h2 className="text-xl font-medium text-slate-900">חומרי הקורס</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((section) => (
          <div key={section.id} className="card-3d-effect-small rounded-lg overflow-hidden">
            {/* Section Header */}
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full p-4 text-right hover:bg-blue-50/30 transition-colors duration-200 flex items-center justify-between"
            >
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="p-1.5 bg-blue-100/80 rounded border border-blue-200/30">
                  {expandedSections.has(section.id) ? (
                    <ChevronDown className="w-4 h-4 text-[#387ADF]" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-[#387ADF]" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-medium text-slate-900">{section.title}</h3>
                  <p className="text-sm text-slate-600">{section.itemCount} פריטים</p>
                </div>
              </div>
            </button>

            {/* Section Content */}
            {expandedSections.has(section.id) && (
              <div className="border-t border-slate-200/50 bg-slate-50/30">
                <div className="p-4 pt-3">
                  <div className="space-y-2">
                    {section.items.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-center space-x-3 space-x-reverse p-2 rounded hover:bg-white/80 transition-colors duration-200 group cursor-pointer"
                        onClick={() => handleItemClick(item)}
                      >
                        <span className="text-slate-400 text-xs font-medium min-w-[1.5rem]">
                          {(index + 1).toString().padStart(2, "0")}
                        </span>

                        <div className="flex items-center space-x-2 space-x-reverse">{getItemIcon(item.type)}</div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-slate-900 text-sm truncate">{item.title}</h4>
                          <div className="flex items-center space-x-3 space-x-reverse text-xs text-slate-500">
                            {item.duration && <span>{item.duration}</span>}
                            {item.dueDate && <span>עד {item.dueDate}</span>}
                          </div>
                        </div>

                        <button
                          onClick={(e) => handleDownload(item, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-200 transition-all duration-200"
                        >
                          <Download className="w-3 h-3 text-slate-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
