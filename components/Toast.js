'use client'

import { useNotification } from '../contexts/NotificationContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Toast() {
  const { notifications, clearNotification } = useNotification()
  const router = useRouter()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (notifications.length > 0) {
      setVisible(true)
      const timer = setTimeout(() => {
        setVisible(false)
        clearNotification(notifications[0].id)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [notifications, clearNotification])

  const handleClick = () => {
    if (notifications.length > 0) {
      const notification = notifications[0]
      if (notification.type === 'message') {
        router.push(`/user/${notification.from}`)
      }
      clearNotification(notification.id)
    }
    setVisible(false)
  }

  if (!visible || notifications.length === 0) return null

  const notification = notifications[0]

  return (
    <div
      className="fixed bottom-4 right-4 bg-primary text-white p-4 rounded-lg shadow-lg cursor-pointer transition-all duration-300 transform translate-y-0 opacity-100"
      onClick={handleClick}
    >
      <h3 className="font-bold">New Message</h3>
      <p className="text-sm">{notification.content}</p>
    </div>
  )
}

