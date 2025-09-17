'use client';

import { AlertCircle, BarChart3, Bell, ClipboardList, FileText } from 'lucide-react';
import { useState } from 'react';

interface Notification {
  id: string;
  type: 'grade' | 'file' | 'assignment' | 'general';
  title: string;
  course?: string;
  timestamp: string;
  isRead: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'grade',
    title: 'ציון חדש: יסודות האלגוריתמים - 87',
    course: 'יסודות האלגוריתמים והסיבוכיות',
    timestamp: 'לפני שעה',
    isRead: false,
  },
  {
    id: '2',
    type: 'file',
    title: 'קובץ חדש הועלה: מבוא לסטטיסטיקה',
    course: 'מבוא לסטטיסטיקה',
    timestamp: 'לפני 2 שעות',
    isRead: false,
  },
  {
    id: '3',
    type: 'assignment',
    title: 'עדכון מטלה: הגשת פרויקט אמצע',
    course: 'מיקרו כלכלה',
    timestamp: 'לפני 3 שעות',
    isRead: true,
  },
  {
    id: '4',
    type: 'grade',
    title: 'ציון חדש במבוא לסטטיסטיקה: 92',
    course: 'מבוא לסטטיסטיקה',
    timestamp: 'לפני יום',
    isRead: false,
  },
  {
    id: '5',
    type: 'file',
    title: 'קובץ PDF חדש - מיקרו כלכלה שיעור 5',
    course: 'מיקרו כלכלה',
    timestamp: 'לפני יום',
    isRead: true,
  },
];

export function Notifications() {
  const [notifications, setNotifications] = useState(mockNotifications);

  // const unreadCount = notifications.filter((n) => !n.isRead).length; // Reserved for future use

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'grade':
        return <BarChart3 className='h-5 w-5 text-emerald-600' />;
      case 'file':
        return <FileText className='h-5 w-5 text-sky-600' />;
      case 'assignment':
        return <ClipboardList className='h-5 w-5 text-orange-600' />;
      default:
        return <AlertCircle className='h-5 w-5 text-purple-600' />;
    }
  };

  const getNotificationDotClass = (type: string) => {
    switch (type) {
      case 'grade':
        return 'w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0';
      case 'file':
        return 'w-2 h-2 bg-sky-500 rounded-full mt-2 flex-shrink-0';
      case 'assignment':
        return 'w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0';
      default:
        return 'w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0';
    }
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, isRead: true } : notification
      )
    );
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    console.log('Navigate to:', notification.type, notification.course);
  };

  // const handleViewAll = () => {
  //   console.log('Navigate to all notifications');
  // }; // Reserved for future use

  return (
    <div className='overflow-hidden'>
      {/* Notifications List */}
      <div className='max-h-80 space-y-0 overflow-y-auto'>
        {notifications.length === 0 ? (
          <div className='py-8 text-center'>
            <div className='mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50'>
              <Bell className='h-6 w-6 text-blue-400' />
            </div>
            <h4 className='mb-1 text-sm font-semibold text-gray-900'>הכל מעודכן!</h4>
            <p className='text-xs text-gray-500'>אין התראות חדשות</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`cursor-pointer border-b border-gray-200/30 p-4 transition-colors duration-200 hover:bg-gray-50 ${
                !notification.isRead ? 'bg-blue-50' : ''
              }`}
            >
              <div className='flex items-start space-x-3 space-x-reverse'>
                {/* Icon */}
                <div className='flex-shrink-0'>{getNotificationIcon(notification.type)}</div>

                {/* Content */}
                <div className='min-w-0 flex-1'>
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <p
                        className={`text-sm leading-relaxed ${
                          notification.isRead ? 'text-gray-700' : 'font-semibold text-gray-900'
                        }`}
                      >
                        {notification.title}
                      </p>
                      {notification.course && (
                        <p className='mt-1 truncate text-xs text-gray-500'>{notification.course}</p>
                      )}
                    </div>

                    {/* Status Dot and Timestamp */}
                    <div className='flex flex-shrink-0 items-center space-x-2 space-x-reverse'>
                      {!notification.isRead && (
                        <div
                          className={`h-2 w-2 rounded-full ${getNotificationDotClass(notification.type).replace('mt-2', '')}`}
                        ></div>
                      )}
                      <span className='text-xs text-gray-400'>{notification.timestamp}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
