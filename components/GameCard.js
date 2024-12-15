import { useState } from "react";
import { AiOutlineEdit, AiOutlineDelete, AiOutlineCheck, AiOutlineClose } from "react-icons/ai";

export default function GameCard({ game, setError, onDeleteClick, onEditClick }) {
  
  return (
    <div className="glassmorphism rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl relative">
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-2">{game.game_name}</h2>
        <p className="text-muted-foreground mb-2">Version: {game.game_version}</p>
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            checked={game.is_game_completed}
            className="mr-2 h-5 w-5"
            disabled
          />
          <span className="text-sm font-medium text-muted-foreground">
            {game.is_game_completed ? "Completed" : "In Progress"}
          </span>
        </div>
        <div className="flex justify-end space-x-2">
          <button onClick={() => onEditClick(game)} className="btn btn-secondary">
            <AiOutlineEdit />
          </button>
          <button onClick={() => onDeleteClick(game)} className="btn btn-secondary">
            <AiOutlineDelete />
          </button>
        </div>
      </div>
    </div>
  );
}