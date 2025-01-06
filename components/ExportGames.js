// components/ExportGames.js

import { useState } from 'react'
import { db, auth } from '../firebase'
import { collection, getDocs } from 'firebase/firestore'

export default function ExportGames({ setToast }) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    const user = auth.currentUser
    if (user) {
      try {
        const gamesCollection = collection(db, 'users', user.uid, 'games')
        const gamesSnapshot = await getDocs(gamesCollection)
        const games = gamesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        
        const blob = new Blob([JSON.stringify(games, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'playlog_games.json'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        setToast('Game list exported as json file', 'success')
      } catch (error) {
        setToast(`Error exporting games: ${error}`, 'error')
      }
    } else {
      setToast('Please login to export the game', 'error')
    }
    setIsExporting(false)
  }

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="w-full btn btn-primary"
    >
      {isExporting ? 'Exporting...' : 'Export Games'}
    </button>
  )
}

