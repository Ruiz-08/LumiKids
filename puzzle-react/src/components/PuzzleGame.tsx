import React, { useState, useEffect, useRef } from "react";
import { generatePuzzle } from "../utils/PuzzleGenerator";
import type { PuzzleData } from "../utils/PuzzleGenerator";
import { PuzzleBoard } from "./PuzzleBoard";
import { PuzzlePiece } from "./PuzzlePiece";
import confetti from "canvas-confetti";
import { Volume2, VolumeX, RotateCcw, Award, Check } from "lucide-react";

// Lista de imágenes infantiles atractivas por defecto
const PUZZLE_IMAGES = [
  "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80", // Bosque de fantasía / Anime
  "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80", // Espacio mágico
  "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80", // Ilustración de león colorido
];

type Difficulty = "facil" | "medio" | "dificil" | "experto";

const DIFFICULTY_SETTINGS: Record<Difficulty, { cols: number; rows: number; label: string }> = {
  facil: { cols: 2, rows: 2, label: "Fácil (4 piezas)" },
  medio: { cols: 3, rows: 3, label: "Medio (9 piezas)" },
  dificil: { cols: 4, rows: 4, label: "Difícil (16 piezas)" },
  experto: { cols: 5, rows: 5, label: "Experto (25 piezas)" },
};

interface PuzzleGameProps {
  initialImageSrc?: string;
  initialDifficulty?: Difficulty;
  onClose?: () => void;
  onSuccess?: () => void;
  initialSnappedPieces?: Record<number, boolean>;
  playablePieceId?: number;
}

export const PuzzleGame: React.FC<PuzzleGameProps> = ({
  initialImageSrc,
  initialDifficulty,
  onClose,
  onSuccess,
  initialSnappedPieces,
  playablePieceId,
}) => {
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty || "medio");
  const [imageIndex, setImageIndex] = useState(0);
  const [puzzle, setPuzzle] = useState<PuzzleData | null>(null);
  const [snappedPieces, setSnappedPieces] = useState<Record<number, boolean>>({});
  const [scatteredPositions, setScatteredPositions] = useState<{ id: number; x: number; y: number }[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isVictory, setIsVictory] = useState(false);
  const [trayScale, setTrayScale] = useState(0.55);

  const containerRef = useRef<HTMLDivElement>(null);

  const targetImage = initialImageSrc || PUZZLE_IMAGES[imageIndex];

  // Dimensiones base del tablero
  const boardWidth = 480;
  const boardHeight = 360;
  const trayWidth = 240;

  // Audio sintetizado con Web Audio API (evita depender de archivos .mp3 rotos)
  const playSnap = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.warn("AudioContext bloqueado o no soportado:", e);
    }
  };

  const playVictory = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playNote = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.08, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };

      const now = ctx.currentTime;
      playNote(261.63, now, 0.3); // C4
      playNote(329.63, now + 0.08, 0.3); // E4
      playNote(392.00, now + 0.16, 0.3); // G4
      playNote(523.25, now + 0.24, 0.6); // C5
    } catch (e) {
      console.warn(e);
    }
  };

  // Inicializar rompecabezas
  const startNewGame = () => {
    const settings = DIFFICULTY_SETTINGS[difficulty];
    const data = generatePuzzle(boardWidth, boardHeight, settings.cols, settings.rows);
    setPuzzle(data);
    setSnappedPieces(initialSnappedPieces || {});
    setIsVictory(false);

    // Calcular escala y grilla de bandeja según número de piezas
    const N = data.pieces.length;
    let trayCols = 2;
    let scaleVal = 0.50;

    if (N <= 4) {
      trayCols = 2;
      scaleVal = 0.55;
    } else if (N <= 9) {
      trayCols = 2;
      scaleVal = 0.42;
    } else if (N <= 16) {
      trayCols = 3;
      scaleVal = 0.32;
    } else {
      trayCols = 3;
      scaleVal = 0.25;
    }
    setTrayScale(scaleVal);

    const trayRows = Math.ceil(N / trayCols);
    const colWidth = trayWidth / trayCols;
    const rowHeight = boardHeight / Math.max(trayRows, 4);

    const pieceW = boardWidth / settings.cols;
    const pieceH = boardHeight / settings.rows;

    const scattered = data.pieces.map((piece, i) => {
      const gridCol = i % trayCols;
      const gridRow = Math.floor(i / trayCols);

      const visualW = pieceW * scaleVal;
      const visualH = pieceH * scaleVal;

      // Sumar padding de 24px (p-6) para alinear con el inicio real de la bandeja
      const trayStartOffset = boardWidth + 40 + 24; 
      const cellCenterX = trayStartOffset + gridCol * colWidth + colWidth / 2;
      const cellCenterY = 24 + gridRow * rowHeight + rowHeight / 2; // Añadir padding superior 24px

      const x = cellCenterX - visualW / 2;
      const y = cellCenterY - visualH / 2;

      // Restar overflow
      const overflow = Math.min(pieceW, pieceH) * 0.28;

      return {
        id: piece.id,
        x: x - overflow,
        y: y - overflow,
      };
    });

    setScatteredPositions(scattered);
  };

  useEffect(() => {
    startNewGame();
  }, [difficulty, imageIndex]);

  // Manejar el snap de una pieza
  const handleSnap = (id: number) => {
    if (snappedPieces[id]) return;

    playSnap();

    setSnappedPieces((prev) => {
      const next = { ...prev, [id]: true };
      
      // Comprobar victoria
      if (puzzle && Object.keys(next).length === puzzle.pieces.length) {
        setIsVictory(true);
        playVictory();
        // Explosión de confeti mágico
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#3b82f6", "#60a5fa", "#f59e0b", "#10b981", "#ec4899"],
        });
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 1500);
        }
      } else {
        // Si no está completo todo el puzzle, pero se encajó la pieza jugable asignada:
        if (playablePieceId !== undefined && id === playablePieceId) {
          confetti({
            particleCount: 80,
            spread: 50,
            origin: { y: 0.6 },
            colors: ["#10b981", "#3b82f6", "#f59e0b"],
          });
          if (onSuccess) {
            setTimeout(() => {
              onSuccess();
            }, 1500);
          }
        }
      }
      return next;
    });
  };

  const isEmbedded = !!onClose || !!onSuccess;

  if (!puzzle) return null;

  return (
    <div className={`flex flex-col items-center justify-center select-none text-white w-full ${isEmbedded ? 'bg-transparent p-2' : 'min-h-screen bg-slate-950 p-6'}`}>
      {/* Encabezado e Indicadores */}
      <div className="w-full max-w-4xl flex flex-col md:flex-row items-center justify-between mb-8 gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
            <Award className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Rompecabezas Mágico
            </h1>
            <p className="text-xs text-slate-400">Completa la imagen arrastrando las fichas</p>
          </div>
        </div>

        {/* Panel de Opciones */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Dificultades (Oculto si se especifica dificultad fija inicial) */}
          {!initialDifficulty && (
            <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800">
              {(Object.keys(DIFFICULTY_SETTINGS) as Difficulty[]).map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                    difficulty === level
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          )}

          {/* Cambiar Imagen (Oculto si es una imagen específica del cuento) */}
          {!initialImageSrc && (
            <button
              onClick={() => setImageIndex((prev) => (prev + 1) % PUZZLE_IMAGES.length)}
              className="px-3 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 active:scale-95 transition rounded-xl border border-slate-700/60"
            >
              Siguiente Imagen
            </button>
          )}

          {/* Alternar Sonido */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors rounded-xl border border-slate-700/50"
            title={soundEnabled ? "Silenciar" : "Activar Sonido"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
          </button>

          {/* Reiniciar */}
          <button
            onClick={startNewGame}
            className="p-2 bg-blue-600 hover:bg-blue-500 active:scale-90 text-white transition rounded-xl shadow-lg shadow-blue-600/20"
            title="Reiniciar partida"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Botón de Cerrar */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 hover:text-rose-200 transition-colors rounded-xl border border-rose-500/30 font-bold ml-2 px-3 active:scale-90"
              title="Cerrar juego"
            >
              ✕ Cerrar
            </button>
          )}
        </div>
      </div>

      {/* Contenedor Principal Interactible */}
      <div
        ref={containerRef}
        style={{ maxWidth: boardWidth + trayWidth + 40, width: '100%' }}
        className="relative flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10 p-4 md:p-6 bg-slate-900/30 rounded-3xl border border-slate-800/40 shadow-inner overflow-hidden"
      >
        {/* Tablero de Juego */}
        <div className="relative">
          <PuzzleBoard
            pieces={puzzle.pieces}
            boardWidth={boardWidth}
            boardHeight={boardHeight}
            imageSrc={targetImage}
            snappedPieces={snappedPieces}
          />

          {/* Pantalla de Victoria */}
          {isVictory && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md rounded-2xl border-4 border-emerald-500/30 transition-all duration-700 animate-fade-in">
              <div className="p-4 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/40 mb-4 animate-bounce">
                <Check className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-extrabold text-emerald-400 drop-shadow">¡Felicidades!</h2>
              <p className="text-slate-300 text-sm mb-6 mt-1">¡Has completado el rompecabezas a la perfección!</p>
              <button
                onClick={startNewGame}
                className="px-6 py-2.5 font-bold bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 rounded-xl shadow-lg shadow-emerald-500/30 transition-all"
              >
                Volver a Jugar
              </button>
            </div>
          )}
        </div>

        {/* Bandeja de Piezas (Tray) */}
        <div
          style={{ width: trayWidth, height: boardHeight }}
          className="relative bg-slate-950/50 rounded-2xl border-2 border-slate-800/80 p-4 shadow-[inset_0_4px_10px_rgba(0,0,0,0.5)] overflow-hidden"
        >
          <div className="absolute top-2 left-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest pointer-events-none">
            Fichas Disponibles
          </div>
          
          {/* Decoración del Fondo de la Bandeja */}
          <div className="absolute inset-0 border border-slate-850 rounded-xl pointer-events-none" />
        </div>

        {/* Renderizado de las Piezas (capa absoluta encima de todo) */}
        {puzzle.pieces.map((piece) => {
          const isSnapped = snappedPieces[piece.id];
          const initialPos = scatteredPositions.find((pos) => pos.id === piece.id) || { x: 0, y: 0 };

          // Si es incrustado y solo una pieza es jugable, no renderizar las demás a menos que estén ya encajadas
          if (playablePieceId !== undefined && !isSnapped && piece.id !== playablePieceId) {
            return null;
          }

          return (
            <PuzzlePiece
              key={`piece-${piece.id}`}
              piece={piece}
              imageSrc={targetImage}
              boardWidth={boardWidth}
              boardHeight={boardHeight}
              isSnapped={isSnapped}
              onSnap={handleSnap}
              containerRef={containerRef}
              initialX={initialPos.x}
              initialY={initialPos.y}
              trayScale={trayScale}
            />
          );
        })}
      </div>
    </div>
  );
};
export default PuzzleGame;
