// components/FriendList.js

import { useState, useEffect } from 'react'
import { auth, db } from '../firebase'
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, getDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import Link from 'next/link'
import { MdVerified } from 'react-icons/md'

export default function FriendList() {
  const [friends, setFriends] = useState([])
  const [friendRequests, setFriendRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        console.log('User is logged in:', currentUser.uid)
        setUser(currentUser)
      } else {
        console.log('No user is logged in.')
        setUser(null)
        setIsLoading(false)
      }
    })

    return () => unsubscribeAuth()
  }, [])

  useEffect(() => {
    if (!user) return

    let unsubscribeFriends = null
    let unsubscribeRequests = null

    const friendsQuery = query(collection(db, 'friendships'), where('users', 'array-contains', user.uid))
    unsubscribeFriends = onSnapshot(friendsQuery, async (snapshot) => {
      try {
        const friendsData = await Promise.all(snapshot.docs.map(async (friendDoc) => {
          const friendId = friendDoc.data().users.find(id => id !== user.uid)
          const userDoc = await getDoc(doc(db, 'users', friendId))
          return {
            id: friendDoc.id,
            userId: friendId,
            name: userDoc.data()?.name || userDoc.data()?.email || 'Unknown User',
            isVerified: userDoc.data()?.isVerified || false
          }
        }))
        setFriends(friendsData)
      } catch (error) {
        console.error('Error fetching friends data:', error)
      } finally {
        setIsLoading(false)
      }
    })

    const requestsQuery = query(collection(db, 'friendRequests'), where('to', '==', user.uid))
    unsubscribeRequests = onSnapshot(requestsQuery, async (snapshot) => {
      try {
        const requestsData = await Promise.all(snapshot.docs.map(async (requestDoc) => {
          const fromUserDoc = await getDoc(doc(db, 'users', requestDoc.data().from))
          return {
            id: requestDoc.id,
            from: requestDoc.data().from,
            name: fromUserDoc.data()?.name || fromUserDoc.data()?.email || 'Unknown User'
          }
        }))
        setFriendRequests(requestsData)
      } catch (error) {
        console.error('Error fetching requests data:', error)
      } finally {
        setIsLoading(false)
      }
    })

    return () => {
      if (unsubscribeFriends) unsubscribeFriends()
      if (unsubscribeRequests) unsubscribeRequests()
    }
  }, [user])

  const handleAcceptRequest = async (request) => {
    if (user) {
      try {
        console.log('Accepting request from:', request.from)
        await addDoc(collection(db, 'friendships'), {
          users: [user.uid, request.from]
        })
        await deleteDoc(doc(db, 'friendRequests', request.id))
      } catch (error) {
        console.error('Error accepting friend request:', error)
      }
    }
  }

  if (isLoading) {
    return <div className="text-center">Loading friends and requests...</div>
  }

  if (!user) {
    return <div className="text-center">User not logged in</div>
  }

  return (
    <div className="shadow rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Friends</h2>
      <ul className="space-y-2">
        {friends.map(friend => (
          <li key={friend.id} className="flex items-center justify-between">
            <Link href={`/user/${friend.userId}`} className="text-primary hover:text-primary-dark">
              <span className="text-md flex items-center gap-1 justify-center font-medium">
                {friend.name} {friend.isVerified && <MdVerified className="text-primary"/>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <h2 className="text-xl font-bold mt-6 mb-4">Friend Requests ({friendRequests.length})</h2>
      <ul className="space-y-2">
        {friendRequests.length === 0 ? (
          <li>No friend requests</li>
        ) : (
          friendRequests.map(request => (
            <li key={request.id} className="flex items-center justify-between">
              <span>{request.name}</span>
              <button 
                onClick={() => handleAcceptRequest(request)} 
                className="bg-primary text-white px-3 py-1 rounded hover:bg-primary-dark transition-colors"
              >
                Accept
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}