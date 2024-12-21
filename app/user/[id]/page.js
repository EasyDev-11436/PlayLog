'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { auth, db } from '../../../firebase'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import GameCard from '../../../components/GameCard'
import Chat from '../../../components/Chat'
import { MdVerified } from "react-icons/md"
import Image from 'next/image'
import { useRouter } from 'next/navigation';
import { LuArrowLeft } from 'react-icons/lu';
import { useTheme } from '../../../contexts/ThemeContext';

export default function UserProfile() {
  const { id } = useParams()
  const [user, setUser] = useState(null)
  const [games, setGames] = useState([])
  const [isFriend, setIsFriend] = useState(false)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 16; // Number of games per page

  
  const router = useRouter();
  const { theme } = useTheme();

  useEffect(() => {
    const fetchUserAndGames = async () => {
      const userDoc = await getDoc(doc(db, 'users', id))
      if (userDoc.exists()) {
        setUser(userDoc.data())
        if (userDoc.data().shareGameList) {
          const gamesQuery = query(collection(db, 'users', id, 'games'))
          const gamesSnapshot = await getDocs(gamesQuery)
          const gamesList = gamesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          setGames(gamesList.sort((a, b) => a.game_name.localeCompare(b.game_name)))
        }
      }

      const currentUser = auth.currentUser
      if (currentUser) {
        const friendshipQuery = query(
          collection(db, 'friendships'),
          where('users', 'array-contains', currentUser.uid)
        )
        const friendshipSnapshot = await getDocs(friendshipQuery)
        setIsFriend(friendshipSnapshot.docs.some(doc => doc.data().users.includes(id)))
      }
    }

    fetchUserAndGames()
  }, [id])

  if (!user) return <div className="text-center py-8">Loading...</div>

  const totalPages = Math.ceil(games.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedGames = games.slice(startIdx, startIdx + itemsPerPage);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };
  
  const handlePageChange = (page) => {
    if (page === "...") return;
    setCurrentPage(page);
  };
  
  const handleBack = () => {
    router.push('/');
  };
  
  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-background to-secondary/20 transition-all duration-300">
      <button
        onClick={handleBack}
        className="mb-4 flex items-center text-indigo-400 hover:text-indigo-300 transition-colors"
      >
        <LuArrowLeft className="w-4 h-4 mr-2" />
        Back to Home
      </button>
      <h1 className="text-2xl font-bold mb-6">Profile of {user.name || user.email}</h1>
      <div className="w-full glassmorphism p-4 rounded-lg">
        <div className="flex w-full items-center justify-center space-x-4">
          <div className="w-10 h-10 rounded-full overflow-hidden">
            <Image
              src={user.profilePicture || '/placeholder-avatar.svg' }
              alt="Profile Picture"
              width={40}
              height={40}
              className="object-cover w-full h-full"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-md flex items-center gap-1 justify-center font-medium">
              {user.name || user.email} {user.isVerified && <MdVerified className="text-primary"/>}
            </span>
            <span className="text-sm font-medium">
              {user.isVerified && user.roles}
            </span>
          </div>
        </div>
        <div className="border-t border-gray-300 my-4"></div>
        <div className="mt-4">
          <label className="block mb-1">Bio</label>
          <span className="text-sm font-medium">
            {user.bio}
          </span>
        </div>
      </div>
      <h2 className="text-2xl font-bold mb-4">Game List</h2>
      <div className="mt-4 mb-2 text-sm text-muted-foreground">Total Games: {games.length}</div>
      {user.shareGameList ? (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {games.length === 0 ? (
              <p className="text-gray-500">This user hasn&apos;t added any game yet.</p>
            ) : (
              paginatedGames.map(game => (
              <GameCard key={game.id} game={game} />
              )
            ))}
          </div>
          <div className="flex items-center justify-center space-x-2">
          {currentPage > 1 && (
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              className="btn flex items-center justify-center h-8 w-8 btn-secondary"
            >
              &lt;
            </button>
          )}
          {getPageNumbers().map((page, index) => (
            <button
              key={index}
              onClick={() => handlePageChange(page)}
              className={`btn flex items-center justify-center h-8 w-8 ${page === currentPage ? "btn-primary" : "btn-secondary"}`}
            >
              {page}
            </button>
          ))}
          {currentPage < totalPages && (
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              className="btn flex items-center justify-center h-8 w-8 btn-secondary"
            >
              &gt;
            </button>
          )}
        </div>
      </div>
      ) : (
        <p className="text-gray-500 text-md">This user&apos;s game list is private.</p>
      )}
      {isFriend && (
        <div className="mt-8 glassmorphism p-4 rounded-xl">
          <h2 className="text-2xl font-bold mb-4">Chat</h2>
          <Chat friendId={id} />
        </div>
      )}
    </div>
  )
}

