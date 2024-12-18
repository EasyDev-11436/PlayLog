import { useState } from 'react';
import { addDoc, collection } from "firebase/firestore";
import { db, auth } from "../firebase";

export default function AddGameForm({ setToast }) {
  const [newGame, setNewGame] = useState({
    gameName: "",
    gameVersion: "",
    isGameCompleted: false,
  });

  const handleAddGame = async (e) => {
    e.preventDefault();
    const { gameName, gameVersion, isGameCompleted } = newGame;
    const user = auth.currentUser;

    if (user) {
      if (gameName && gameVersion) {
        const newGameObj = {
          game_name: gameName,
          game_version: gameVersion,
          is_game_completed: isGameCompleted,
        };
        try {
          await addDoc(collection(db, "users", user.uid, "games"), newGameObj);
          setNewGame({
            gameName: "",
            gameVersion: "",
            isGameCompleted: false,
          });
          setToast("Game added successfully", "success");
        } catch (err) {
          setToast("Failed to add the game. Please try again.", "error");
        }
      } else {
        setToast("Please fill in all fields", "error");
      }
    } else {
      setToast("Please login to add game", "error");
    }
  };

  return (
    <form onSubmit={handleAddGame} className="space-y-4">
      <h3 className="text-xl font-semibold mb-4">Add New Game</h3>
      <input
        type="text"
        value={newGame.gameName}
        onChange={(e) => setNewGame({ ...newGame, gameName: e.target.value })}
        placeholder="Game Name"
        className="input"
      />
      <input
        type="text"
        value={newGame.gameVersion}
        onChange={(e) => setNewGame({ ...newGame, gameVersion: e.target.value })}
        placeholder="Game Version"
        className="input"
      />
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={newGame.isGameCompleted}
          onChange={(e) => setNewGame({ ...newGame, isGameCompleted: e.target.checked })}
          className="mr-2 h-5 w-5"
        />
        <label htmlFor="isGameCompleted" className="text-sm font-medium text-muted-foreground">
          Completed
        </label>
      </div>
      <button type="submit" className="btn btn-primary w-full">
        Add Game
      </button>
    </form>
  );
}

