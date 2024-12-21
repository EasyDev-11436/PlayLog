// app/page.js

"use client";

import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, onSnapshot, where, query, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import AuthComponent from "../components/AuthComponent";
import AddGameForm from "../components/AddGameForm";
import GameCard from "../components/GameCard";
import ExportGames from "../components/ExportGames";
import ImportGames from "../components/ImportGames";
import FriendList from '../components/FriendList'
import { useTheme } from "../contexts/ThemeContext";
import { FiMoon, FiSun } from "react-icons/fi";

export default function Home() {
  const [currentUser, setUser] = useState(null);
  const [games, setGames] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [toast, setToast] = useState({ message: "", type: "" });
  const [showDeleteBottomSheet, setShowDeleteBottomSheet] = useState(false);
  const [showEditBottomSheet, setShowEditBottomSheet] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [editedGame, setEditedGame] = useState(null);
  const [confirmationText, setConfirmationText] = useState("");
  const [friendEmail, setFriendEmail] = useState('')
  const { theme, toggleTheme} = useTheme();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 16; // Number of games per page

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const gamesCollection = collection(db, "users", user.uid, "games");
        const q = query(gamesCollection);
        const unsubscribeFromSnapshot = onSnapshot(q, (snapshot) => {
          const fetchedGames = snapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
          }));
          setGames(fetchedGames);
        });
        
        setUser(user);

        return () => unsubscribeFromSnapshot();
      } else {
        setGames([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const filteredGames = games.filter((game) => {
    const matchesSearch = game.game_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      selectedStatus === "All" ||
      (selectedStatus === "Completed" && game.is_game_completed) ||
      (selectedStatus === "In Progress" && !game.is_game_completed);
    return matchesSearch && matchesStatus;
  }).sort((a, b) => a.game_name.localeCompare(b.game_name));

  const handleDelete = async () => {
    const user = auth.currentUser;
    if (user && selectedGame && confirmationText === selectedGame.game_name) {
      try {
        await deleteDoc(doc(db, "users", user.uid, "games", selectedGame.id));
        showToast(`"${selectedGame?.game_name}" Deleted`, "success");
        setShowDeleteBottomSheet(false);
        setSelectedGame(null);
        setConfirmationText("");
      } catch (err) {
        showToast("Failed to delete the game. Please try again.", "error");
      }
    } else {
      showToast("Game name does not match. Please type the name correctly.", "error");
    }
  };

  const handleEdit = async () => {
    const user = auth.currentUser;
    if (user && editedGame) {
      try {
        await updateDoc(doc(db, "users", user.uid, "games", editedGame.id), editedGame);
        showToast(`"${editedGame?.game_name}" updated`, "success");
        setShowEditBottomSheet(false);
        setEditedGame(null);
      } catch (err) {
        showToast("Failed to update the game. Please try again.", "error");
      }
    }
  };
  
    // Pagination logic
  const totalPages = Math.ceil(filteredGames.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedGames = filteredGames.slice(startIdx, startIdx + itemsPerPage);

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
  
  const showToast = (message, type) => {
    setToast({ message, type });
  };
  
  const handleAddFriend = async (e) => {
    e.preventDefault()
    const user = auth.currentUser
    if (user) {
      const usersQuery = query(collection(db, 'users'), where('email', '==', friendEmail))
      const usersSnapshot = await getDocs(usersQuery)
      if (!usersSnapshot.empty) {
        const friendUser = usersSnapshot.docs[0]
        console.log('Friend user found:', friendUser.data())  // Add this line
        const friendRequestData = {
          from: user.uid,
          to: friendUser.id,
          createdAt: new Date()
        }
        console.log('Creating friend request:', friendRequestData)  // Add this line
        const docRef = await addDoc(collection(db, 'friendRequests'), friendRequestData)
        console.log('Friend request created with ID:', docRef.id)  // Add this line
        showToast('Friend request sent!', 'success')
        setFriendEmail('')
      } else {
        console.log('User not found for email:', friendEmail)  // Add this line
        showToast('User not found', 'error')
      }
    }
  }


  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when filters or search term changes
  }, [selectedStatus, searchTerm]);
  
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 3000); // Dismiss after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 transition-all duration-300">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl p-4 font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
            PlayLog
          </h1>
          <button
            onClick={() => toggleTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-full bg-secondary/50 hover:bg-secondary/80 transition-colors duration-200"
          >
            {theme === "dark" ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
          </button>
        </div>
        <AuthComponent setToast={showToast} />
        {currentUser && (
        <div className="mt-8 glassmorphism p-6 rounded-xl">
          <div>
            <h2 className="text-xl font-bold mb-4">Friends</h2>
            <FriendList />
            <form onSubmit={handleAddFriend} className="mt-4">
              <input
                type="email"
                value={friendEmail}
                onChange={(e) => setFriendEmail(e.target.value)}
                placeholder="Friend's email"
                className="input mb-2"
              />
              <button type="submit" className="btn btn-primary w-full">Add Friend</button>
            </form>
          </div>
        </div>
        )}
        <div className="mt-8 glassmorphism p-6 rounded-xl">
          <AddGameForm setToast={showToast} />
          <div className="mt-4 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search games..."
                className="input pr-10"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input sm:w-48"
            >
              <option value="All">All</option>
              <option value="Completed">Completed</option>
              <option value="In Progress">In Progress</option>
            </select>
          </div>
          <div className="grid mt-4 grid-cols-2 gap-2">
              <ExportGames setToast={showToast} />
              <ImportGames setToast={showToast} />
          </div>
        </div>
        <div className="mt-4 mb-2 text-sm text-muted-foreground">Total Games: {filteredGames.length}</div>
        {/* Game List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {paginatedGames.map((game) => (
            <GameCard 
              key={game.id} 
              game={game} 
              onEditClick={(selectedGame) => {
                setEditedGame(selectedGame);
                setShowEditBottomSheet(true);
              }} 
              onDeleteClick={(selectedGame) => {
                setSelectedGame(selectedGame);
                setShowDeleteBottomSheet(true);
              }} 
            />
          ))}
        </div>

        {/* Pagination */}
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
      
      {/* Delete Bottom Sheet */}
      {showDeleteBottomSheet && (
        <div className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-lg flex justify-center items-center z-50">
          <div className="fixed bottom-0 bg-card p-6 rounded-t-3xl shadow-lg w-full max-w-screen-lg">
            <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
            <p className="mb-4">To confirm, type the game name: &quot;{selectedGame?.game_name}&quot;</p>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder={`Type "${selectedGame?.game_name}"`}
              className="input mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowDeleteBottomSheet(false);
                  setSelectedGame(null);
                  setConfirmationText("");
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button onClick={handleDelete} className="btn btn-primary">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Bottom Sheet */}
      {showEditBottomSheet && (
        <div className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-lg flex justify-center items-center z-50">
          <div className="fixed bottom-0 bg-card p-6 rounded-t-3xl shadow-lg w-full max-w-screen-lg">
            <h3 className="text-lg font-semibold mb-4">Edit Game</h3>
            <input
              type="text"
              value={editedGame?.game_name}
              onChange={(e) => setEditedGame({ ...editedGame, game_name: e.target.value })}
              placeholder="Game Name"
              className="input mb-4"
            />
            <input
              type="text"
              value={editedGame?.game_version}
              onChange={(e) => setEditedGame({ ...editedGame, game_version: e.target.value })}
              placeholder="Game Version"
              className="input mb-4"
            />
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                checked={editedGame?.is_game_completed}
                onChange={(e) => setEditedGame({ ...editedGame, is_game_completed: e.target.checked })}
                className="mr-2 h-5 w-5"
              />
              <span className="text-sm font-medium text-muted-foreground">Completed</span>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowEditBottomSheet(false);
                  setEditedGame(null);
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button onClick={handleEdit} className="btn btn-primary">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      {toast.message && (
        <div
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 ${toast.type === "success" ? "bg-success/20" : "bg-destructive/20"} bg-clip-padding backdrop-filter backdrop-blur backdrop-saturate-0 backdrop-contrast-50 px-6 py-4 rounded-lg shadow-lg z-50 flex items-center justify-between space-x-4 max-w-screen-sm w-[calc(100%-2rem)] sm:w-auto`}>
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => setToast("")}
            className="underline text-sm font-medium hover:text-foreground focus:outline-none"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}