"use client"

import { useState } from "react"
import { EmailHeader } from "./email/email-header"
import { CourseEmailSection } from "./email/course-email-section"
import { EmailView } from "./email/email-view"
import { Mail, Search, Filter, Download, Archive, Trash2, Reply, Forward } from "lucide-react"
import type { EmailData } from "./email/email-card"

// Mock data for emails
const mockCourses = [
  {
    id: "1",
    name: "יסודות האלגוריתמים והסיבוכיות",
    code: "372.1.4567",
    color: "bg-blue-500",
    lastActivity: "לפני שעה",
  },
  {
    id: "2",
    name: "מבוא לסטטיסטיקה",
    code: "372.1.1234",
    color: "bg-green-500",
    lastActivity: "לפני יום",
  },
  {
    id: "3",
    name: "מיקרו כלכלה",
    code: "372.1.5678",
    color: "bg-purple-500",
    lastActivity: "לפני 3 ימים",
  },
]

const mockEmails: EmailData[] = [
  {
    id: "1",
    sender: {
      name: "פרופ' יוסי כהן",
      role: "מרצה",
      email: "yossi@university.edu",
    },
    subject: "עדכון לגבי מועד בחינת אמצע",
    preview: "שלום לכולם, ברצוני לעדכן כי מועד בחינת האמצע נדחה בשבוע אחד קדימה...",
    timestamp: "לפני שעה",
    hasAttachments: true,
    isUnread: true,
    courseId: "1",
  },
  {
    id: "2",
    sender: {
      name: 'ד"ר שרה לוי',
      role: "מתרגל",
      email: "sarah@university.edu",
    },
    subject: "חומר נוסף לתרגול 5",
    preview: "היי לכולם, לקראת התרגול הבא הכנתי עבורכם חומר נוסף שיעזור לכם להתכונן...",
    timestamp: "לפני 3 שעות",
    hasAttachments: true,
    isUnread: true,
    courseId: "1",
  },
  {
    id: "3",
    sender: {
      name: "פרופ' יוסי כהן",
      role: "מרצה",
      email: "yossi@university.edu",
    },
    subject: "שינוי במערכת השעות",
    preview: "שימו לב, השיעור ביום שלישי הבא יתקיים באולם 305 במקום באולם הרגיל...",
    timestamp: "לפני 5 שעות",
    hasAttachments: false,
    isUnread: true,
    courseId: "1",
  },
  {
    id: "4",
    sender: {
      name: 'ד"ר רחל גולן',
      role: "מרצה",
      email: "rachel@university.edu",
    },
    subject: "הגשת עבודה 2",
    preview: "תזכורת: הגשת העבודה השנייה היא עד יום ראשון בחצות. אנא הקפידו על הנחיות ההגשה...",
    timestamp: "לפני יום",
    hasAttachments: false,
    isUnread: true,
    courseId: "2",
  },
  {
    id: "5",
    sender: {
      name: "אבי לוי",
      role: "מתרגל",
      email: "avi@university.edu",
    },
    subject: "פתרונות לתרגיל 3",
    preview: "מצורפים פתרונות לתרגיל 3. אם יש שאלות, אשמח לענות בשעות הקבלה...",
    timestamp: "לפני 2 ימים",
    hasAttachments: true,
    isUnread: false,
    courseId: "2",
  },
  {
    id: "6",
    sender: {
      name: 'ד"ר דן ישראלי',
      role: "מרצה",
      email: "dan@university.edu",
    },
    subject: "חומר קריאה לשיעור הבא",
    preview: "לקראת השיעור הבא, אנא קראו את המאמר המצורף. נדון בו במהלך השיעור...",
    timestamp: "לפני 3 ימים",
    hasAttachments: true,
    isUnread: false,
    courseId: "3",
  },
]

export function EmailContent() {
  const [currentFilter, setCurrentFilter] = useState("all")
  const [selectedEmail, setSelectedEmail] = useState<EmailData | null>(null)

  const handleFilterChange = (filter: string) => {
    setCurrentFilter(filter)
    setSelectedEmail(null)
  }

  const handleEmailClick = (emailId: string) => {
    const email = mockEmails.find((e) => e.id === emailId)
    if (email) {
      setSelectedEmail(email)
    }
  }

  const getFilteredEmails = () => {
    let filtered = [...mockEmails]

    switch (currentFilter) {
      case "unread":
        filtered = filtered.filter((email) => email.isUnread)
        break
      case "attachments":
        filtered = filtered.filter((email) => email.hasAttachments)
        break
      case "urgent":
        filtered = filtered.filter((email) => email.subject.includes("דחוף") || email.subject.includes("חשוב"))
        break
      default:
        break
    }

    return filtered
  }

  const filteredEmails = getFilteredEmails()

  const getEmailsByCourse = (courseId: string) => {
    return filteredEmails.filter((email) => email.courseId === courseId)
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 space-x-reverse mb-2">
          <Mail className="w-8 h-8 text-black" />
          <h1 className="text-3xl font-bold text-black text-right">מייל אקדמי חכם</h1>
        </div>
        <p className="text-gray-600 text-right">
          רק המיילים החשובים מהמרצים והמתרגלים שלך, מסודרים לפי קורסים ומסוננים באופן חכם.
        </p>
      </div>

      <EmailHeader onFilterChange={handleFilterChange} currentFilter={currentFilter} />

      {selectedEmail ? (
        <div className="dipy-card dipy-fade-in dipy-accent-sky">
          <EmailView email={selectedEmail} onClose={() => setSelectedEmail(null)} />
        </div>
      ) : (
        <div className="space-y-4">
          {mockCourses.map((course) => {
            const courseEmails = getEmailsByCourse(course.id)
            if (courseEmails.length === 0 && currentFilter !== "all") return null

            return (
              <div key={course.id} className="dipy-card dipy-fade-in">
                <CourseEmailSection
                  courseId={course.id}
                  courseName={course.name}
                  courseColor={course.color}
                  emails={courseEmails}
                  lastActivity={course.lastActivity}
                  onEmailClick={handleEmailClick}
                />
              </div>
            )
          })}

          {filteredEmails.length === 0 && (
            <div className="dipy-card dipy-fade-in text-center py-12">
              <div className="dipy-empty-state">
                <div className="text-6xl mb-4">📬</div>
                <h3 className="dipy-empty-state-title">הכל נקי!</h3>
                <p className="dipy-empty-state-description">כל המיילים החשובים כאן</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
