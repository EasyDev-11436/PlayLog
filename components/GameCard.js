import { useState } from 'react';
import { AiOutlineEdit, AiOutlineDelete, AiOutlineCheck, AiOutlineClose } from "react-icons/ai";
import { doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebase";

export default function GameCard({ game, setError }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedGame, setEditedGame] = useState(game);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");

  const handleDelete = async () => {
    const user = auth.currentUser;
    if (user && deleteInput === game.game_name) {
      try {
        await deleteDoc(doc(db, "users", user.uid, "games", game.id));
        setShowDeleteConfirm(false);
        setDeleteInput("");
      } catch (err) {
        setError("Failed to delete the game. Please try again.");
      }
    } else {
      setError("Game name does not match. Please try again.");
    }
  };

  const handleEdit = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        await updateDoc(doc(db, "users", user.uid, "games", game.id), editedGame);
        setIsEditing(false);
      } catch (err) {
        setError("Failed to update the game. Please try again.");
      }
    }
  };

  return (
    <div className="glassmorphism rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl relative">
      <div className="p-6">
        {isEditing ? (
          <input
            type="text"
            value={editedGame.game_name}
            onChange={(e) => setEditedGame({ ...editedGame, game_name: e.target.value })}
            className="input mb-2"
          />
        ) : (
          <h2 className="text-2xl font-semibold mb-2">{game.game_name}</h2>
        )}
        {isEditing ? (
          <input
            type="text"
            value={editedGame.game_version}
            onChange={(e) => setEditedGame({ ...editedGame, game_version: e.target.value })}
            className="input mb-2"
          />
        ) : (
          <p className="text-muted-foreground mb-2">Version: {game.game_version}</p>
        )}
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            checked={isEditing ? editedGame.is_game_completed : game.is_game_completed}
            onChange={(e) => isEditing && setEditedGame({ ...editedGame, is_game_completed: e.target.checked })}
            className="mr-2 h-5 w-5"
            disabled={!isEditing}
          />
          <span className="text-sm font-medium text-muted-foreground">
            {(isEditing ? editedGame.is_game_completed : game.is_game_completed) ? "Completed" : "In Progress"}
          </span>
        </div>
        <div className="flex justify-end space-x-2">
          {isEditing ? (
            <>
              <button onClick={handleEdit} className="btn btn-primary"><AiOutlineCheck /></button>
              <button onClick={() => setIsEditing(false)} className="btn btn-secondary"><AiOutlineClose /></button>
            </>
          ) : (
            <>
              <button onClick={() => setIsEditing(true)} className="btn btn-secondary"><AiOutlineEdit /></button>
              <button onClick={() => setShowDeleteConfirm(true)} className="btn btn-secondary"><AiOutlineDelete /></button>
            </>
          )}
        </div>
      </div>
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-card p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
            <p className="mb-4">Are you sure you want to delete &quot;{game.game_name}&quot;?</p>
            <input
              type="text"
              placeholder={`Type "${game.game_name}"`}
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              className="input mb-4 w-full"
            />
            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="btn btn-secondary">Cancel</button>
              <button
                onClick={handleDelete}
                className="btn btn-primary"
                disabled={deleteInput !== game.game_name}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}