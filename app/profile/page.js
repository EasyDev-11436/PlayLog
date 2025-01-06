// app/profile/page.js

'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { auth, db } from '../../firebase'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { LuArrowLeft } from 'react-icons/lu'
import { useTheme } from '../../contexts/ThemeContext'

const MAX_FILE_SIZE = 1024 * 1024 // 1MB

export default function ProfilePage() {
  const [user, setUser] = useState(null)
  const [name, setName] = useState('')
  const [dob, setDob] = useState('')
  const [bio, setBio] = useState('')
  const [gender, setGender] = useState('')
  const [profilePicture, setProfilePicture] = useState('/placeholder-avatar.svg')
  const [shareGameList, setShareGameList] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const router = useRouter()
  const { theme } = useTheme()

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user)
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          setName(userData.name || '')
          setDob(userData.dob || '')
          setBio(userData.bio || '')
          setGender(userData.gender || '')
          setProfilePicture(userData.profilePicture || '/placeholder-avatar.svg')
          setShareGameList(userDoc.data().shareGameList || false)
        }
      }
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleBack = () => {
    router.push('/')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (user) {
      await setDoc(doc(db, 'users', user.uid), {
        name,
        dob,
        bio,
        gender,
        profilePicture
      }, { merge: true })
      setToast('Profile updated successfully!')
    }
  }
  
  const handleShareGameListChange = async (e) => {
    const newShareGameList = e.target.checked
    setShareGameList(newShareGameList)
    await updateDoc(doc(db, 'users', user.uid), { shareGameList: newShareGameList })
  }

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = document.createElement('img')
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          const scaleFactor = Math.min(1, MAX_FILE_SIZE / file.size)
          canvas.width = img.width * scaleFactor
          canvas.height = img.height * scaleFactor
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(URL.createObjectURL(blob))
            } else {
              reject(new Error('Failed to compress image'))
            }
          }, 'image/jpeg', 0.7)
        }
        img.onerror = () => {
          reject(new Error('Failed to load image'))
        }
        img.src = event.target.result
      }
      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }
      reader.readAsDataURL(file)
    })
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        try {
          const compressedImage = await compressImage(file)
          setProfilePicture(compressedImage)
          setError('')
        } catch (err) {
          setError('Error compressing image. Please try a smaller file.')
        }
      } else {
        const reader = new FileReader()
        reader.onloadend = () => {
          setProfilePicture(reader.result)
          setError('')
        }
        reader.readAsDataURL(file)
      }
    }
  }
  
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(''), 3000) // Dismiss after 5 seconds
      return () => clearTimeout(timer)
    }
  }, [toast])

  if (isLoading) {
    return <div className="text-center py-10">Loading...</div>
  }

  if (!user) {
    return <div className="text-center py-10">Please log in to view your profile.</div>
  }

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-background to-secondary/20 transition-all duration-300">
      <button
        onClick={handleBack}
        className="mb-4 flex items-center text-indigo-400 hover:text-indigo-300 transition-colors"
      >
        <LuArrowLeft className="w-4 h-4 mr-2" />
        Back to Home
      </button>
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full overflow-hidden mb-2">
            <Image
              src={profilePicture}
              alt="Profile Picture"
              width={96}
              height={96}
              className="object-cover w-full h-full"
            />
          </div>
          <label className={`cursor-pointer ${theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'} px-4 py-2 rounded-lg transition-colors`}>
            Change Picture
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>
          {error && <p className="text-red-500 mt-2">{error}</p>}
          <p className="text-sm text-gray-500 mt-2">Max file size: 1MB</p>
        </div>
        <div>
          <label htmlFor="name" className="block mb-1">Name</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full px-4 py-2 ${theme === 'dark' ? 'bg-[#12151f] text-white' : 'bg-white text-gray-900'} rounded-lg`}
          />
        </div>
        <div>
          <label htmlFor="dob" className="block mb-1">Date of Birth</label>
          <input
            type="date"
            id="dob"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className={`w-full px-4 py-2 ${theme === 'dark' ? 'bg-[#12151f] text-white' : 'bg-white text-gray-900'} rounded-lg`}
          />
        </div>
        <div>
          <label htmlFor="gender" className="block mb-1">Gender</label>
          <select
            id="gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className={`w-full px-4 py-2 ${theme === 'dark' ? 'bg-[#12151f] text-white' : 'bg-white text-gray-900'} rounded-lg`}
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer-not-to-say">Prefer not to say</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={shareGameList}
              onChange={handleShareGameListChange}
              className="mr-2"
            />
            Share my game list with friends
          </label>
        </div>

        <div>
          <label htmlFor="bio" className="block mb-1">Bio</label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className={`w-full px-4 py-2 ${theme === 'dark' ? 'bg-[#12151f] text-white' : 'bg-white text-gray-900'} rounded-lg h-32`}
          ></textarea>
        </div>
        <button type="submit" className={`w-full px-4 py-2 ${theme === 'dark' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-500 hover:bg-indigo-600'} text-white rounded-lg transition-colors`}>
          Save Profile
        </button>
      </form>
      {toast && (
        <div
          className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-success/20 bg-clip-padding backdrop-filter backdrop-blur backdrop-saturate-0 backdrop-contrast-50 px-6 py-4 rounded-lg shadow-lg z-50 flex items-center justify-between space-x-4 max-w-screen-sm w-[calc(100%-2rem)] sm:w-auto"
        >
          <span className="text-sm font-medium">{toast}</span>
          <button
            onClick={() => setToast('')}
            className="underline text-sm font-medium hover:text-foreground focus:outline-none"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  )
}

