'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { auth, db } from '../firebase'
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore'

const NotificationContext = createContext()

export function useNotification() {
  return useContext(NotificationContext)
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    const user = auth.currentUser
    if (!user) return

    const q = query(
      collection(db, 'messages'),
      where('to', '==', user.uid),
      orderBy('timestamp', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const newMessage = change.doc.data()
          setNotifications(prev => [...prev, {
            id: change.doc.id,
            type: 'message',
            content: newMessage.text,
            from: newMessage.from,
            timestamp: newMessage.timestamp
          }])
        }
      })
    })

    return () => unsubscribe()
  }, [])

  const clearNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id))
  }

  return (
    <NotificationContext.Provider value={{ notifications, clearNotification }}>
      {children}
    </NotificationContext.Provider>
  )
}

