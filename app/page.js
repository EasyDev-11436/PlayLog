"use client";

import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, onSnapshot, query, updateDoc, deleteDoc, doc } from "firebase/firestore";
import AuthComponent from "../components/AuthComponent";
import AddGameForm from "../components/AddGameForm";
import GameCard from "../components/GameCard";
import { useTheme } from "next-themes";
import { FiMoon, FiSun } from "react-icons/fi";

export default function Home() {
  const [games, setGames] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [error, setError] = useState("");
  const [showDeleteBottomSheet, setShowDeleteBottomSheet] = useState(false);
  const [showEditBottomSheet, setShowEditBottomSheet] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [editedGame, setEditedGame] = useState(null);
  const [confirmationText, setConfirmationText] = useState("");
  const { theme, setTheme } = useTheme();

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
  });

  const handleDelete = async () => {
    const user = auth.currentUser;
    if (user && selectedGame && confirmationText === selectedGame.game_name) {
      try {
        await deleteDoc(doc(db, "users", user.uid, "games", selectedGame.id));
        setShowDeleteBottomSheet(false);
        setSelectedGame(null);
        setConfirmationText("");
      } catch (err) {
        setError("Failed to delete the game. Please try again.");
      }
    } else {
      setError("Game name does not match. Please type the name correctly.");
    }
  };

  const handleEdit = async () => {
    const user = auth.currentUser;
    if (user && editedGame) {
      try {
        await updateDoc(doc(db, "users", user.uid, "games", editedGame.id), editedGame);
        setShowEditBottomSheet(false);
        setEditedGame(null);
      } catch (err) {
        setError("Failed to update the game. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 transition-all duration-300">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl p-4 font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
            PlayLog
          </h1>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-full bg-secondary/50 hover:bg-secondary/80 transition-colors duration-200"
          >
            {theme === "dark" ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
          </button>
        </div>
        <AuthComponent />
        <div className="mt-8 glassmorphism p-6 rounded-xl">
          <AddGameForm setError={setError} />
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
        </div>
        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg mt-4 glassmorphism">
            {error}
            <button onClick={() => setError("")} className="ml-4 underline">
              Dismiss
            </button>
          </div>
        )}
        <div className="mt-4 mb-2 text-sm text-muted-foreground">Total Games: {filteredGames.length}</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {filteredGames.map((game) => (
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
      </div>

      {/* Delete Bottom Sheet */}
      {showDeleteBottomSheet && (
        <div className="fixed inset-x-0 bottom-0 bg-card p-6 rounded-t-3xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
          <p className="mb-4">To confirm, type the game name: &quot;{selectedGame?.game_name}&quot;</p>
          <input
            type="text"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            placeholder={`Type ${selectedGame?.game_name}`}
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
      )}

      {/* Edit Bottom Sheet */}
      {showEditBottomSheet && (
        <div className="fixed inset-x-0 bottom-0 bg-card p-6 rounded-t-3xl shadow-lg">
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
      )}
    </div>
  );
}