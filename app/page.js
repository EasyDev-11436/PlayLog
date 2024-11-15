// app/page.js
"use client";

import { useState, useEffect } from "react";
import { db } from "../firebase"; // Import Firebase config
import { getDocs, addDoc, deleteDoc, updateDoc, doc, collection, onSnapshot } from "firebase/firestore"; // Import onSnapshot
import { AiOutlineEdit, AiOutlineDelete, AiOutlineClose } from "react-icons/ai"; // Import icons
import AuthComponent from '../components/AuthComponent';
import { auth } from '../firebase'; // Import Firebase auth

export default function Home() {
  const [games, setGames] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [newGame, setNewGame] = useState({
    gameName: "",
    gameVersion: "",
    isGameCompleted: false,
  });
  const [editingGame, setEditingGame] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    gameName: "",
    gameId: "",
    input: "",
  });
  const [selectedStatus, setSelectedStatus] = useState("All"); // New state for status filter

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        const gamesCollection = collection(db, "users", user.uid, "games"); // Reference to user's games subcollection
        const unsubscribeFromSnapshot = onSnapshot(gamesCollection, (snapshot) => {
          const fetchedGames = snapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
          }));

          // Sort games alphabetically by game_name
          fetchedGames.sort((a, b) => a.game_name.localeCompare(b.game_name));

          setGames(fetchedGames);
        });

        return () => unsubscribeFromSnapshot(); // Cleanup listener on unmount
      } else {
        setGames([]); // Clear games if no user is logged in
      }
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  const handleAddGame = async () => {
    const { gameName, gameVersion, isGameCompleted } = newGame;
    const user = auth.currentUser ; // Get current user

    if (user && gameName && gameVersion) {
      const newGameObj = {
        game_name: gameName,
        game_version: gameVersion,
        is_game_completed: isGameCompleted,
      };
      await addDoc(collection(db, "users", user.uid, "games"), newGameObj); // Add to user's games
      setNewGame({
        gameName: "",
        gameVersion: "",
        isGameCompleted: false,
      });
    }
  };

  const handleSaveEdit = async () => {
    if (editingGame) {
      const { gameName, gameVersion, isGameCompleted } = newGame;
      const updatedGame = {
        game_name: gameName,
        game_version: gameVersion,
        is_game_completed: isGameCompleted,
      };
      const user = auth.currentUser ; // Get current user

      await updateDoc(doc(db, "users", user.uid, "games", editingGame.id), updatedGame); // Update user's game

      setEditingGame(null);
      setNewGame({
        gameName: "",
        gameVersion: "",
        isGameCompleted: false,
      });
    }
  };

  const handleDeleteGame = async () => {
    if (deleteConfirmation.input === deleteConfirmation.gameName) {
      const user = auth.currentUser ; // Get current user
      await deleteDoc(doc(db, "users", user.uid, "games", deleteConfirmation.gameId)); // Delete user's game
    }
    setDeleteConfirmation({
      isOpen: false,
      gameName: "",
      gameId: "",
      input: "",
    });
  };

  const handleExport = async () => {
    const user = auth.currentUser ; // Get current user
    if (user) {
      const gamesToExport = games.map(({ id, ...game }) => game); // Prepare games data for export
      const blob = new Blob([JSON.stringify(gamesToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
      a.href = url;
      a.download = 'games_list.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleImport = async (event) => {
    const user = auth.currentUser  ; // Get current user
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const importedGames = JSON.parse(e.target.result);
        const gamesCollection = collection(db, "users", user.uid, "games");
        for (const game of importedGames) {
          await addDoc(gamesCollection, game); // Add each game to Firestore
        }
      };
      reader.readAsText(file);
    }
  };

  const handleEditGame = (game) => {
    setEditingGame(game);
    setNewGame({
      gameName: game.game_name,
      gameVersion: game.game_version,
      isGameCompleted: game.is_game_completed,
    });
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase()); // Update search term
  };

  const filteredGames = games.filter((game) => {
    const matchesSearchTerm = game.game_name.toLowerCase().includes(searchTerm);
    const matchesStatus =
      selectedStatus === "All" ||
      (selectedStatus === "Completed" && game.is_game_completed) ||
      (selectedStatus === "In Progress" && !game.is_game_completed);

    return matchesSearchTerm && matchesStatus;
  });

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-lg mx-auto">
        <img className="mx-auto mb-6" src="/logo.svg" alt="Logo" width="50" height="50" />
        <AuthComponent />
        <div className="sticky top-0 pt-4 pb-4 z-10 rounded-lg bg-white max-w-lg">
          <div className="mb-6">
            <input
              type="text"
              value={newGame.gameName}
              onChange={(e) =>
                setNewGame({
                  ...newGame,
                  gameName: e.target.value,
                })
              }
              placeholder="Game Name"
              className="border p-3 rounded w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={newGame.gameVersion}
              onChange={(e) =>
                setNewGame({
                  ...newGame,
                  gameVersion: e.target.value,
                })
              }
              placeholder="Game Version"
              className="border p-3 rounded w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                checked={newGame.isGameCompleted}
                onChange={(e) =>
                  setNewGame({
                    ...newGame,
                    isGameCompleted: e.target.checked,
                  })
                }
                className="mr-2 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isGameCompleted" className="text-gray-700">Completed</label>
            </div>
            <button
              onClick={editingGame ? handleSaveEdit : handleAddGame}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg w-full hover:bg-blue-700 transition duration-300 mb-4"
            >
              {editingGame ? "Save Changes" : "Add Game"}
            </button>
            <div className="relative mb-6">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearch}
                placeholder="Search by Game Name"
                className="border p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  <AiOutlineClose size={20} />
                </button>
              )}
            </div>
            <div className="mb-6">
              <label htmlFor="statusFilter" className="block text-gray-700 mb-2">Filter by Status:</label>
              <select
                id="statusFilter"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="border p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All</option>
                <option value="Completed">Completed</option>
                <option value="In Progress">In Progress</option>
              </select>
            </div>
          </div>
          <div className="mb-6 flex space-x-4">
            <button
              onClick={handleExport}
              className="bg-green-600 text-white px-6 py-3 rounded-lg w-full hover:bg-green-700 transition duration-300"
            >
              Export Game List
            </button>
            <label
              htmlFor="importFile"
              className="bg-yellow-500 text-white px-6 py-3 rounded-lg cursor-pointer w-full text-center hover:bg-yellow-600 transition duration-300"
            >
              Import Game List
            </label>
            <input
              type="file"
              id="importFile"
              onChange={handleImport}
              accept="application/json"
              className="hidden"
            />
          </div>
          <p className="text-center text-gray-700 mb-6">Total Games: {games.length}</p>
        </div>
        <ul id="gameList" className="space-y-4">
          {filteredGames.map((game) => (
            <li
              key={game.id}
              className="relative bg-gray-100 p-4 pt-8 rounded-lg shadow-md hover:shadow-lg transition duration-300"
            >
              <span
                className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-semibold ${
                  game.is_game_completed
                    ? "bg-green-600 text-white"
                    : "bg-yellow-500 text-white"
                }`}
              >
                {game.is_game_completed ? "Completed" : "In Progress"}
              </span>
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {game.game_name}
                  </h2>
                  <p className="text-gray-600">
                    Version: {game.game_version}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleEditGame(game)}
                    className="text-blue-500 text-2xl"
                  >
                    <AiOutlineEdit />
                  </button>
                  <button
                    onClick={() =>
                      setDeleteConfirmation({
                        isOpen: true,
                        gameName: game.game_name,
                        gameId: game.id,
                        input: "",
                      })
                    }
                    className="text-red-500 text-2xl"
                  >
                    <AiOutlineDelete />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {deleteConfirmation.isOpen && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Confirm Deletion
              </h2>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete the game: {deleteConfirmation.gameName}?
              </p>
              <input
                type="text"
                value={deleteConfirmation.input}
                onChange={(e) =>
                  setDeleteConfirmation({
                    ...deleteConfirmation,
                    input: e.target.value,
                  })
                }
                placeholder={`Type "${deleteConfirmation.gameName}" to confirm`}
                className="border p-3 rounded w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex justify-between">
                <button
                  onClick={handleDeleteGame}
                  disabled={
                    deleteConfirmation.input !== deleteConfirmation.gameName
                  }
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition duration-300"
                >
                  Delete
                </button>
                <button
                  onClick={() =>
                    setDeleteConfirmation({
                      isOpen: false,
                      gameName: "",
                      gameId: "",
                      input: "",
                    })
                  }
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition duration-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  </div>
  );
}