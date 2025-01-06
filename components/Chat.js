// components/Chat.js

import { useState, useEffect, useRef } from 'react'
import { auth, db } from '../firebase'
import { collection, query, where, orderBy, addDoc, onSnapshot } from 'firebase/firestore'
import { format } from 'date-fns' // Install this library using `npm install date-fns`
import { useNotification } from '../contexts/NotificationContext'

export default function Chat({ friendId }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const { clearNotification } = useNotification()
  const messagesContainerRef = useRef(null)

  useEffect(() => {
    const user = auth.currentUser
    if (user && friendId) {
      const chatId = [user.uid, friendId].sort().join('_')
      const messagesQuery = query(
        collection(db, 'messages'),
        where('chatId', '==', chatId),
        orderBy('timestamp')
      )

      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const messageList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setMessages(messageList)
        // Clear notifications for this chat
        messageList.forEach(message => {
          if (message.to === user.uid) {
            clearNotification(message.id)
          }
        })
      })

      return () => unsubscribe()
    }
  }, [friendId, clearNotification])

  useEffect(() => {
    // Scroll to the bottom of the messages container when messages change
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    const user = auth.currentUser
    if (user && friendId && newMessage.trim()) {
      const chatId = [user.uid, friendId].sort().join('_')
      await addDoc(collection(db, 'messages'), {
        chatId,
        from: user.uid,
        to: friendId,
        text: newMessage,
        timestamp: new Date()
      })
      setNewMessage('')
    }
  }

  return (
    <div className="shadow rounded-lg p-6">
      <div ref={messagesContainerRef} className="h-64 overflow-y-auto mb-4 space-y-2">
        {messages.map(message => (
          <div key={message.id} className={`p-2 rounded-lg text-white ${message.from === auth.currentUser.uid ? 'bg-primary ml-auto' : 'bg-gray-600 mr-auto'} max-w-[70%]`}>
            <p>{message.text}</p>
            <div className="border-t border-gray-300 my-4"></div>
            <small className="block text-gray-400 text-sm">
              {message.timestamp ? format(new Date(message.timestamp.seconds * 1000), 'MMM d, yyyy h:mm a') : ''}
            </small>
          </div>
        ))}
      </div>
      <form onSubmit={handleSendMessage} className="flex">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-grow input-msg border rounded-l-lg rounded-r-none px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Type a message..."
        />
        <button type="submit" className="bg-primary text-white px-4 py-2 rounded-r-lg hover:bg-primary-dark transition-colors">Send</button>
      </form>
    </div>
  )
}