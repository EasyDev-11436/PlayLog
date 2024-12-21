// components/GameCard.js

import { AiOutlineEdit, AiOutlineDelete } from "react-icons/ai";
import { MdCheckCircle, MdPending } from "react-icons/md";

export default function GameCard({ game, setError, onDeleteClick, onEditClick }) {
  const isCompleted = game.is_game_completed;
  const statusClass = isCompleted
    ? "bg-green-100 text-green-800"
    : "bg-yellow-100 text-yellow-800";
  const statusIcon = isCompleted ? <MdCheckCircle className="mr-1" /> : <MdPending className="mr-1" />;

  return (
    <div className="glassmorphism rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl relative">
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-2">{game.game_name}</h2>
        <p className="text-muted-foreground mb-2">Version: {game.game_version}</p>
        <div className="flex items-center mb-4">
          <span
            className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusClass}`}
          >
            {statusIcon}
            {isCompleted ? "Completed" : "In Progress"}
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