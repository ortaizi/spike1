"use client"

import { useState } from "react"
import { Calendar, MapPin, Clock, Users, Tag, Search, Filter, CalendarDays } from "lucide-react"

interface Event {
  id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  category: "academic" | "social" | "career" | "workshop" | "other"
  attendees: number
  isRegistered: boolean
}

const mockEvents: Event[] = [
  {
    id: "1",
    title: "סדנת ניהול זמן",
    description: "סדנה מעשית לניהול זמן יעיל לסטודנטים, כולל כלים וטכניקות לתכנון לימודים.",
    date: "25/04/2025",
    time: "14:00 - 16:00",
    location: "בניין 72, אולם 115",
    category: "workshop",
    attendees: 45,
    isRegistered: true,
  },
  {
    id: "2",
    title: "כנס יזמות אוניברסיטאי",
    description: "כנס שנתי ליזמות וחדשנות, כולל הרצאות מפתח ופאנלים עם יזמים מובילים.",
    date: "01/05/2025",
    time: "09:00 - 17:00",
    location: "מרכז הכנסים, קמפוס צפוני",
    category: "career",
    attendees: 120,
    isRegistered: false,
  },
  {
    id: "3",
    title: "מסיבת סוף סמסטר",
    description: "מסיבת סוף סמסטר מסורתית של אגודת הסטודנטים, כולל הופעות חיות ודי-ג'יי.",
    date: "15/05/2025",
    time: "21:00 - 02:00",
    location: "מועדון הקמפוס",
    category: "social",
    attendees: 350,
    isRegistered: false,
  },
  {
    id: "4",
    title: "הרצאת אורח: חידושים בבינה מלאכותית",
    description: "הרצאה מרתקת על התפתחויות אחרונות בתחום הבינה המלאכותית והשפעתן על החברה.",
    date: "10/05/2025",
    time: "18:00 - 20:00",
    location: "בניין 90, אולם 201",
    category: "academic",
    attendees: 80,
    isRegistered: true,
  },
  {
    id: "5",
    title: "יריד תעסוקה",
    description: "יריד תעסוקה שנתי עם נציגים מחברות מובילות במשק, הזדמנות למצוא משרות ופרקטיקום.",
    date: "20/05/2025",
    time: "10:00 - 16:00",
    location: "רחבת הספרייה המרכזית",
    category: "career",
    attendees: 200,
    isRegistered: false,
  },
]

export function EventsContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [registeredOnly, setRegisteredOnly] = useState(false)

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "academic":
        return "dipy-badge-blue"
      case "social":
        return "dipy-badge-purple"
      case "career":
        return "dipy-badge-amber"
      case "workshop":
        return "dipy-badge-emerald"
      default:
        return "dipy-badge-slate"
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "academic":
        return "אקדמי"
      case "social":
        return "חברתי"
      case "career":
        return "קריירה"
      case "workshop":
        return "סדנה"
      default:
        return "אחר"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "academic":
        return <Calendar className="w-4 h-4" />
      case "social":
        return <Users className="w-4 h-4" />
      case "career":
        return <Tag className="w-4 h-4" />
      case "workshop":
        return <Clock className="w-4 h-4" />
      default:
        return <Tag className="w-4 h-4" />
    }
  }

  const handleRegister = (eventId: string) => {
    console.log("Register for event:", eventId)
    // Implement registration logic
  }

  const handleCancelRegistration = (eventId: string) => {
    console.log("Cancel registration for event:", eventId)
    // Implement cancellation logic
  }

  const filteredEvents = mockEvents.filter((event) => {
    // Search filter
    if (searchQuery && !event.title.includes(searchQuery) && !event.description.includes(searchQuery)) {
      return false
    }

    // Category filter
    if (categoryFilter && event.category !== categoryFilter) {
      return false
    }

    // Registration filter
    if (registeredOnly && !event.isRegistered) {
      return false
    }

    return true
  })

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 space-x-reverse mb-2">
          <CalendarDays className="w-8 h-8 text-black" />
          <h1 className="text-3xl font-bold text-black text-right">אירועים וסדנאות</h1>
        </div>
        <p className="text-gray-600 text-right">גלה אירועים, סדנאות וכנסים באוניברסיטה, הירשם והישאר מעודכן.</p>
      </div>

      {/* Filters */}
      <div className="dipy-card dipy-fade-in dipy-accent-rose">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="חפש אירועים..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="dipy-input pr-10"
            />
          </div>

          {/* Category Filter */}
          <div className="flex space-x-2 space-x-reverse">
            <button
              onClick={() => setCategoryFilter(null)}
              className={`dipy-button ${
                categoryFilter === null ? "dipy-button-primary" : "dipy-button-secondary"
              } text-sm px-3 py-2`}
            >
              הכל
            </button>
            <button
              onClick={() => setCategoryFilter("academic")}
              className={`dipy-button ${
                categoryFilter === "academic" ? "dipy-button-primary" : "dipy-button-secondary"
              } text-sm px-3 py-2`}
            >
              אקדמי
            </button>
            <button
              onClick={() => setCategoryFilter("social")}
              className={`dipy-button ${
                categoryFilter === "social" ? "dipy-button-primary" : "dipy-button-secondary"
              } text-sm px-3 py-2`}
            >
              חברתי
            </button>
            <button
              onClick={() => setCategoryFilter("career")}
              className={`dipy-button ${
                categoryFilter === "career" ? "dipy-button-primary" : "dipy-button-secondary"
              } text-sm px-3 py-2`}
            >
              קריירה
            </button>
            <button
              onClick={() => setCategoryFilter("workshop")}
              className={`dipy-button ${
                categoryFilter === "workshop" ? "dipy-button-primary" : "dipy-button-secondary"
              } text-sm px-3 py-2`}
            >
              סדנאות
            </button>
          </div>

          {/* Registered Only Filter */}
          <button
            onClick={() => setRegisteredOnly(!registeredOnly)}
            className={`dipy-button ${
              registeredOnly ? "dipy-button-primary" : "dipy-button-secondary"
            } text-sm px-3 py-2 flex items-center space-x-2 space-x-reverse`}
          >
            <Filter className="w-4 h-4" />
            <span>נרשמתי בלבד</span>
          </button>
        </div>
      </div>

      {/* Events Grid */}
      <div className="dipy-grid dipy-grid-cols-1 md:dipy-grid-cols-2 lg:dipy-grid-cols-3">
        {filteredEvents.length === 0 ? (
          <div className="col-span-full dipy-card dipy-fade-in text-center py-12">
            <div className="dipy-empty-state">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="dipy-empty-state-title">לא נמצאו אירועים</h3>
              <p className="dipy-empty-state-description">נסה לשנות את הסינון או לחפש מחדש</p>
            </div>
          </div>
        ) : (
          filteredEvents.map((event) => (
            <div key={event.id} className="dipy-card dipy-fade-in dipy-accent-rose">
              {/* Event Header */}
              <div className="flex justify-between items-start mb-4">
                <h3 className="dipy-title">{event.title}</h3>
                <span
                  className={`dipy-badge ${getCategoryColor(event.category)} flex items-center space-x-1 space-x-reverse`}
                >
                  {getCategoryIcon(event.category)}
                  <span>{getCategoryLabel(event.category)}</span>
                </span>
              </div>

              {/* Event Description */}
              <p className="dipy-description mb-4">{event.description}</p>

              {/* Event Details */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center space-x-2 space-x-reverse text-sm text-slate-600">
                  <Calendar className="w-4 h-4 text-rose-500" />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse text-sm text-slate-600">
                  <Clock className="w-4 h-4 text-rose-500" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse text-sm text-slate-600">
                  <MapPin className="w-4 h-4 text-rose-500" />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse text-sm text-slate-600">
                  <Users className="w-4 h-4 text-rose-500" />
                  <span>{event.attendees} משתתפים</span>
                </div>
              </div>

              {/* Registration Button */}
              {event.isRegistered ? (
                <button
                  onClick={() => handleCancelRegistration(event.id)}
                  className="dipy-button dipy-button-secondary w-full"
                >
                  בטל הרשמה
                </button>
              ) : (
                <button onClick={() => handleRegister(event.id)} className="dipy-button dipy-button-primary w-full">
                  הירשם לאירוע
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
