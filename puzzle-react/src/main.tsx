import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const rootEl = document.getElementById('root')
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
}

// Registrar función global para integración como Widget en HTML Vanilla
;(window as any).initLumiKidsPuzzle = (
  elementId: string,
  options?: {
    imageSrc?: string;
    difficulty?: "facil" | "medio" | "dificil" | "experto";
    onClose?: () => void;
    onSuccess?: () => void;
    initialSnappedPieces?: Record<number, boolean>;
    playablePieceId?: number;
  }
) => {
  const container = document.getElementById(elementId)
  if (container) {
    const root = createRoot(container)
    root.render(
      <StrictMode>
        <App
          imageSrc={options?.imageSrc}
          difficulty={options?.difficulty}
          onClose={options?.onClose}
          onSuccess={options?.onSuccess}
          initialSnappedPieces={options?.initialSnappedPieces}
          playablePieceId={options?.playablePieceId}
        />
      </StrictMode>
    )
    return root
  }
  console.error(`No se encontró el contenedor con ID: ${elementId}`)
  return null
}
