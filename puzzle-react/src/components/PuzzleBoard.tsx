import React from "react";
import type { Piece } from "../utils/PuzzleGenerator";

interface PuzzleBoardProps {
  pieces: Piece[];
  boardWidth: number;
  boardHeight: number;
  imageSrc: string;
  snappedPieces: Record<number, boolean>;
}

export const PuzzleBoard: React.FC<PuzzleBoardProps> = ({
  pieces,
  boardWidth,
  boardHeight,
  imageSrc,
  snappedPieces,
}) => {
  return (
    <div
      style={{ width: boardWidth, height: boardHeight }}
      className="relative bg-slate-900/90 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-4 border-slate-700/80 select-none backdrop-blur-sm"
    >
      {/* Silueta de fondo de la imagen (Guía visual para niños) */}
      <img
        src={imageSrc}
        alt="Puzzle silueta"
        className="absolute inset-0 w-full h-full object-fill opacity-15 grayscale pointer-events-none"
      />

      {/* Grid de encaje con guías en SVG */}
      <svg
        width={boardWidth}
        height={boardHeight}
        viewBox={`0 0 ${boardWidth} ${boardHeight}`}
        className="absolute inset-0 pointer-events-none overflow-visible"
      >
        {pieces.map((piece) => {
          const isSnapped = snappedPieces[piece.id];
          return (
            <path
              key={`board-slot-${piece.id}`}
              d={piece.path}
              transform={`translate(${piece.correctX}, ${piece.correctY})`}
              fill="none"
              stroke={isSnapped ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.3)"}
              strokeWidth={1.5}
              strokeDasharray={isSnapped ? "none" : "5 5"}
              className="transition-all duration-300"
            />
          );
        })}
      </svg>

      {/* Sombra interna para dar profundidad tridimensional */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_4px_10px_rgba(0,0,0,0.6)]" />
    </div>
  );
};
