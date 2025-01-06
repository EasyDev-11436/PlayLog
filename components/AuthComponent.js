// components/AuthComponent.js

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { auth, db } from '../firebase'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { MdVerified } from 'react-icons/md'

export default function AuthComponent({ setToast }) {
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [name, setName] = useState('')
  const [isVerified, setVerified] = useState(false)
  const [roles, setRoles] = useState('')
  const [profilePicture, setProfilePicture] = useState('/placeholder-avatar.svg')
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user)
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          setName(userData.name || '')
          setVerified(userData.isVerified || false)
          setRoles(userData.roles || '')
          setProfilePicture(userData.profilePicture || '/placeholder-avatar.svg')
        }
      } else {
        setUser(null)
        setName('')
        setVerified(false)
        setRoles('')
        setProfilePicture('/placeholder-avatar.svg')
      }
    })

    return () => unsubscribe()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: userCredential.user.email,
          name: '',
          gender: '',
          isVerified: false,
          roles: '',
          profilePicture: '/placeholder-avatar.svg',
          shareGameList: false
        })
        setToast(`${userCredential.user.email} has been registered`, 'success')
      }
    } catch (error) {
      const code = error.code
      console.log(code)
      if (code === 'auth/invalid-credential') {
        setToast('Please check your email or password', 'error')
      } else if (code === 'auth/email-already-in-use') {
        setToast('The email has already registered', 'error')
      } else if (code == 'auth/weak-password') {
        setToast('Your password is too weak. Please choose a stronger password with at least 8 characters, including uppercase letters, lowercase letters, numbers, and special symbols.', 'error')
      }
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      setToast(error.message, 'error')
    }
  }

  const handleEditProfile = () => {
    router.push('/profile')
  }

  if (user) {
    return (
      <div className="flex w-full glassmorphism p-4 rounded-lg items-center justify-center space-x-4">
        <div className="w-10 h-10 rounded-full overflow-hidden">
          <Image
            src={profilePicture}
            alt="Profile Picture"
            width={40}
            height={40}
            className="object-cover w-full h-full"
          />
        </div>
        <div className="flex flex-col">
          <span className="text-md flex items-center gap-1 justify-center font-medium">
            {name || user.email} {isVerified && <MdVerified className="text-primary"/>}
          </span>
          <span className="text-sm font-medium">
            {isVerified && roles}
          </span>
          <button
            onClick={handleEditProfile}
            className="text-xs text-indigo-400 hover:text-indigo-300"
          >
            Edit Profile
          </button>
        </div>
        <button
          onClick={handleLogout}
          className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 rounded transition-colors"
        >
          Logout
        </button>
      </div>
    )
  }

  return (
    <div className="glassmorphism p-4 rounded-lg">
      <h2 className="text-xl font-bold text-center mb-4">{isLogin ? 'Login' : 'Register'}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="input"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="input"
        />
        <button
          type="submit"
          className="w-full btn btn-primary"
        >
          {isLogin ? 'Login' : 'Register'}
        </button>
      </form>
      <button
        onClick={() => setIsLogin(!isLogin)}
        className="mt-4 text-sm text-indigo-400 hover:text-indigo-300"
      >
        {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
      </button>
    </div>
  )
}

