"use client"

import { BarChart3, Calendar, Shield, CreditCard, Mail, ClipboardList } from "lucide-react"

const dashboardCards = [
  // Top row components (right side)
  {
    title: "מיילים לא נקראו",
    icon: Mail,
    iconColor: "dipy-icon-sky",
    value: "12",
    subtitle: "מיילים לא נקראו",
  },
  {
    title: "מטלות פתוחות",
    icon: ClipboardList,
    iconColor: "dipy-icon-orange",
    value: "5",
    subtitle: "מטלות פתוחות",
  },
  // Middle row components (right side) - Changed to items structure
  {
    title: "ציונים שפורסמו",
    icon: BarChart3,
    iconColor: "dipy-icon-emerald",
    items: [
      { label: "יסודות האלגוריתמים", value: "87" },
      { label: "מבוא לסטטיסטיקה", value: "92" },
    ],
  },
  {
    title: "מבחנים ובחינות קרובים",
    icon: Calendar,
    iconColor: "dipy-icon-indigo",
    items: [
      { label: "בחינת אמצע - אלגוריתמים", value: "30/04/2025" },
      { label: "בוחן - סטטיסטיקה", value: "05/05/2025" },
    ],
  },
  // Bottom row components
  {
    title: "אירועים וסדנאות",
    icon: Calendar,
    iconColor: "dipy-icon-rose",
    items: [
      { label: "סדנת ניהול זמן", value: "25/04/2025" },
      { label: "כנס יזמות אוניברסיטאי", value: "01/05/2025" },
    ],
  },
  {
    title: "שכר לימודי",
    icon: CreditCard,
    iconColor: "dipy-icon-amber",
    items: [
      { label: "יתרה לתשלום", value: "₪4,250", urgent: true },
      { label: "לתשלום עד", value: "30/04/2025" },
    ],
  },
  {
    title: "ימי מילואים",
    icon: Shield,
    iconColor: "dipy-icon-slate",
    items: [
      { label: "מס׳ ימים מתחילת שנה", value: "12" },
      { label: "קבוצה", value: "5" },
    ],
  },
]

interface HomeContentProps {
  onNavigateToTab?: (tab: string) => void
}

export function HomeContent({ onNavigateToTab }: HomeContentProps) {
  return (
    <div className="space-y-4 overflow-hidden">
      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-hidden">
        {/* All Cards */}
        {dashboardCards.map((card, index) => (
          <div key={index} className={`dipy-card dipy-fade-in overflow-hidden min-h-[200px] max-h-[280px] relative ${
            index === 0 ? 'dipy-accent-sky' : 
            index === 1 ? 'dipy-accent-orange' : 
            index === 2 ? 'dipy-accent-emerald' : 
            index === 3 ? 'dipy-accent-indigo' : 
            index === 4 ? 'dipy-accent-rose' : 
            index === 5 ? 'dipy-accent-amber' : 'dipy-accent-slate'
          }`}>
            {/* Header */}
            <div className="flex items-center space-x-6 space-x-reverse mb-6">
              <card.icon className={`w-8 h-8 ${card.iconColor}`} />
              <div>
                <h3 className="dipy-title text-base font-semibold">{card.title}</h3>
              </div>
            </div>

            {/* Content */}
            {card.value ? (
              /* Simple value display for first 2 cards */
              <div className="text-center mb-4 overflow-hidden">
                <div className="text-3xl font-bold text-slate-900 mb-2">{card.value}</div>
                <p className="text-sm font-medium text-slate-600">{card.subtitle}</p>
              </div>
            ) : (
              /* Items display for other cards */
              <div className="space-y-3 mb-4 overflow-hidden overflow-y-auto max-h-[160px]">
                {card.items?.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
                    <span className="dipy-description text-sm">{item.label}</span>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <span className="text-base font-semibold text-slate-900">{item.value}</span>
                      {item.urgent && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
