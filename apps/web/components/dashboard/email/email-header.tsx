"use client"

import type React from "react"

import { Search, Filter, Bell, Inbox, Paperclip } from "lucide-react"
import { useState } from "react"

interface EmailHeaderProps {
  onFilterChange: (filter: string) => void
  currentFilter: string
}

export function EmailHeader({ onFilterChange, currentFilter }: EmailHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filters = [
    { id: "all", label: "הכל" },
    { id: "unread", label: "לא נקרא" },
    { id: "attachments", label: "מצורף קבצים" },
    { id: "urgent", label: "דחוף" },
  ]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Searching for:", searchQuery)
    // Implement search functionality
  }

  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">מייל אקדמי חכם</h1>
      <p className="text-slate-600 text-sm mb-6">רק המיילים החשובים מהמרצים והמתרגלים שלך</p>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative flex-1 w-full">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="חפש מיילים..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#387ADF] focus:border-transparent text-sm"
          />
        </form>

        {/* Filter Buttons */}
        <div className="flex space-x-2 space-x-reverse">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                currentFilter === filter.id
                  ? "bg-[#387ADF] text-white"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {filter.id === "all" && <Inbox className="inline-block w-3.5 h-3.5 ml-1.5" />}
              {filter.id === "unread" && <Bell className="inline-block w-3.5 h-3.5 ml-1.5" />}
              {filter.id === "attachments" && <Paperclip className="inline-block w-3.5 h-3.5 ml-1.5" />}
              {filter.id === "urgent" && <Filter className="inline-block w-3.5 h-3.5 ml-1.5" />}
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Smart Filtering Indicators */}
      <div className="mt-4 text-xs text-slate-500 flex flex-col sm:flex-row sm:justify-between">
        <div>מסננים פעילים: מרצים ומתרגלים בלבד</div>
        <div>סווגנו 247 מיילים | הוסתרו 89 מיילים לא רלוונטיים</div>
      </div>
    </div>
  )
}
