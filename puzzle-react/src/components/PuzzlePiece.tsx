import React, { useEffect, useRef } from "react";
import { motion, useMotionValue, useAnimation } from "framer-motion";
import type { Piece } from "../utils/PuzzleGenerator";

interface PuzzlePieceProps {
  piece: Piece;
  imageSrc: string;
  boardWidth: number;
  boardHeight: number;
  isSnapped: boolean;
  onSnap: (id: number) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  initialX: number;
  initialY: number;
  trayScale: number;
}

export const PuzzlePiece: React.FC<PuzzlePieceProps> = ({
  piece,
  imageSrc,
  boardWidth,
  boardHeight,
  isSnapped,
  onSnap,
  containerRef,
  initialX,
  initialY,
  trayScale,
}) => {
  const controls = useAnimation();
  const x = useMotionValue(initialX);
  const y = useMotionValue(initialY);

  const dragRef = useRef<HTMLDivElement>(null);

  // Margen de seguridad para las pestañas de rompecabezas
  const S = Math.min(piece.width, piece.height) * 0.28;
  const overflow = S; 
  const svgW = piece.width + overflow * 2;
  const svgH = piece.height + overflow * 2;

  // Animación al encajar o al reiniciar
  useEffect(() => {
    if (isSnapped) {
      // Posición correcta relativa al tablero
      controls.start({
        x: piece.correctX - overflow,
        y: piece.correctY - overflow,
        scale: 1,
        transition: { type: "spring", stiffness: 300, damping: 25 },
      });
    } else {
      controls.start({
        x: initialX,
        y: initialY,
        scale: trayScale,
        transition: { type: "spring", stiffness: 150, damping: 20 },
      });
    }
  }, [isSnapped, initialX, initialY, piece.correctX, piece.correctY, overflow, controls, trayScale]);

  const handleDragEnd = () => {
    if (isSnapped) return;

    // Calcular la posición actual de la pieza respecto al contenedor/tablero
    const currentPieceX = x.get() + overflow;
    const currentPieceY = y.get() + overflow;

    // Distancia a su posición correcta
    const dist = Math.hypot(
      currentPieceX - piece.correctX,
      currentPieceY - piece.correctY
    );

    // Tolerancia para encajar (ej. 30 píxeles)
    const threshold = Math.min(piece.width, piece.height) * 0.35;

    if (dist < threshold) {
      onSnap(piece.id);
    } else {
      // Regresa a su posición inicial si no está cerca
      controls.start({
        x: initialX,
        y: initialY,
        scale: 1,
        transition: { type: "spring", stiffness: 200, damping: 18 },
      });
    }
  };

  return (
    <motion.div
      ref={dragRef}
      drag={!isSnapped}
      dragConstraints={containerRef}
      dragMomentum={false}
      dragElastic={0.1}
      style={{
        x,
        y,
        top: 0,
        left: 0,
        width: svgW,
        height: svgH,
        position: "absolute",
        zIndex: isSnapped ? 10 : 20,
        touchAction: "none",
        cursor: isSnapped ? "default" : "grab",
      }}
      animate={controls}
      whileHover={isSnapped ? {} : { scale: trayScale * 1.05, filter: "brightness(1.1)" }}
      whileDrag={{
        scale: 1.05,
        zIndex: 50,
        filter: "drop-shadow(0px 10px 15px rgba(0, 0, 0, 0.4))",
      }}
      onDragEnd={handleDragEnd}
      className="select-none active:cursor-grabbing"
    >
      <svg
        width={svgW}
        height={svgH}
        viewBox={`0 0 ${svgW} ${svgH}`}
        className="overflow-visible block drop-shadow-md transition-shadow duration-300"
      >
        <defs>
          <clipPath id={piece.clipPathId}>
            <path d={piece.path} transform={`translate(${overflow}, ${overflow})`} />
          </clipPath>
        </defs>

        {/* Imagen recortada */}
        <g clipPath={`url(#${piece.clipPathId})`}>
          <image
            href={imageSrc}
            x={overflow + piece.bgX}
            y={overflow + piece.bgY}
            width={boardWidth}
            height={boardHeight}
            preserveAspectRatio="none"
          />
        </g>

        {/* Borde / Contorno */}
        <path
          d={piece.path}
          transform={`translate(${overflow}, ${overflow})`}
          fill="none"
          stroke={isSnapped ? "rgba(255, 255, 255, 0.25)" : "#3b82f6"}
          strokeWidth={isSnapped ? 1.5 : 2.5}
          className={`transition-colors duration-300 ${
            !isSnapped ? "hover:stroke-blue-400 drop-shadow-[0_0_4px_rgba(59,130,246,0.6)]" : ""
          }`}
        />
      </svg>
    </motion.div>
  );
};
