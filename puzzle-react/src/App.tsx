import PuzzleGame from "./components/PuzzleGame";

interface AppProps {
  imageSrc?: string;
  difficulty?: "facil" | "medio" | "dificil" | "experto";
  onClose?: () => void;
  onSuccess?: () => void;
  initialSnappedPieces?: Record<number, boolean>;
  playablePieceId?: number;
}

function App({ imageSrc, difficulty, onClose, onSuccess, initialSnappedPieces, playablePieceId }: AppProps) {
  const isEmbedded = !!onClose || !!onSuccess;

  return (
    <div className={`puzzle-widget-root w-full flex items-center justify-center ${isEmbedded ? 'bg-transparent py-2' : 'min-h-screen bg-slate-950'}`}>
      <PuzzleGame
        initialImageSrc={imageSrc}
        initialDifficulty={difficulty}
        onClose={onClose}
        onSuccess={onSuccess}
        initialSnappedPieces={initialSnappedPieces}
        playablePieceId={playablePieceId}
      />
    </div>
  );
}

export default App;
