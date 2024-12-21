// components/ImportGames.js

import { useState } from 'react';
import { db, auth } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

export default function ImportGames({ setToast }) {
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setIsImporting(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const games = JSON.parse(e.target.result);
          const user = auth.currentUser;
          if (user) {
            const gamesCollection = collection(db, "users", user.uid, "games");
            for (const game of games) {
              const { id, ...gameData } = game;
              await addDoc(gamesCollection, gameData);
            }
            setToast("Games imported", "success");
          } else {
            setToast("Please login to import game", "error");
          }
        } catch (error) {
          setToast(`Error importing games: ${error}`, "error");
        }
        setIsImporting(false);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        accept=".json"
        onChange={handleImport}
        disabled={isImporting}
        className="hidden"
        id="import-games"
      />
      <label
        htmlFor="import-games"
        className={`w-full btn btn-primary block text-center cursor-pointer ${
          isImporting ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isImporting ? 'Importing...' : 'Import Games'}
      </label>
    </div>
  );
}

