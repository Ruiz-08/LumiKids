export interface Piece {
  id: number;
  col: number;
  row: number;
  correctX: number;
  correctY: number;
  width: number;
  height: number;
  bgX: number;
  bgY: number;
  path: string;
  clipPathId: string;
}

export interface PuzzleData {
  pieces: Piece[];
  boardWidth: number;
  boardHeight: number;
  cols: number;
  rows: number;
}

export function generatePuzzle(
  boardWidth: number,
  boardHeight: number,
  cols: number,
  rows: number
): PuzzleData {
  const pieceW = boardWidth / cols;
  const pieceH = boardHeight / rows;

  // Generar matrices de conectores aleatorios (1 = pestaña, -1 = hueco)
  const down: number[][] = Array.from({ length: rows - 1 }, () =>
    Array.from({ length: cols }, () => (Math.random() > 0.5 ? 1 : -1))
  );

  const right: number[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols - 1 }, () => (Math.random() > 0.5 ? 1 : -1))
  );

  const pieces: Piece[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const id = r * cols + c;

      // Obtener conectores para los 4 lados (0 para bordes exteriores)
      const topC = r > 0 ? -down[r - 1][c] : 0;
      const bottomC = r < rows - 1 ? down[r][c] : 0;
      const leftC = c > 0 ? -right[r][c - 1] : 0;
      const rightC = c < cols - 1 ? right[r][c] : 0;

      // Crear el path SVG con pestañas de tamaño uniforme
      const path = createJigsawPath(pieceW, pieceH, {
        top: topC,
        right: rightC,
        bottom: bottomC,
        left: leftC,
      });

      const correctX = c * pieceW;
      const correctY = r * pieceH;

      pieces.push({
        id,
        col: c,
        row: r,
        correctX,
        correctY,
        width: pieceW,
        height: pieceH,
        bgX: -correctX,
        bgY: -correctY,
        path,
        clipPathId: `clip-jigsaw-${id}-${Math.random().toString(36).slice(2, 7)}`,
      });
    }
  }

  return {
    pieces,
    boardWidth,
    boardHeight,
    cols,
    rows,
  };
}

interface Connectors {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

function createJigsawPath(w: number, h: number, conn: Connectors): string {
  // Tamaño de pestaña S constante basado en el tamaño de la pieza (28% del menor eje)
  const S = Math.min(w, h) * 0.28;

  const nubPath = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    sign: number
  ): string => {
    if (sign === 0) return `L ${x2.toFixed(2)} ${y2.toFixed(2)}`;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);

    // Vector normal unitario apuntando hacia afuera
    const nx = dy / len;
    const ny = -dx / len;

    // Amplitud de la pestaña
    const A = S * sign;

    // Punto medio del borde
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;

    // Vector dirección unitario
    const ux = dx / len;
    const uy = dy / len;

    // Mapeo local a absoluto
    const p = (uVal: number, nVal: number): string => {
      const px = mx + uVal * S * ux + nVal * A * nx;
      const py = my + uVal * S * uy + nVal * A * ny;
      return `${px.toFixed(2)} ${py.toFixed(2)}`;
    };

    // Retorna la curva Bézier C1 continua
    return [
      `L ${p(-0.467, 0)}`,
      `C ${p(-0.20, 0)}, ${p(-0.15, 0.25)}, ${p(-0.40, 0.40)}`, // Cuello Izquierdo
      `C ${p(-0.90, 0.70)}, ${p(-0.667, 1.0)}, ${p(0.0, 1.0)}`, // Cabeza
      `C ${p(0.667, 1.0)}, ${p(0.90, 0.70)}, ${p(0.40, 0.40)}`, // Cabeza Derecha
      `C ${p(0.15, 0.25)}, ${p(0.20, 0)}, ${p(0.467, 0)}`, // Cuello Derecho
      `L ${x2.toFixed(2)} ${y2.toFixed(2)}`,
    ].join(' ');
  };

  return [
    `M 0 0`,
    nubPath(0, 0, w, 0, conn.top),
    nubPath(w, 0, w, h, conn.right),
    nubPath(w, h, 0, h, conn.bottom),
    nubPath(0, h, 0, 0, conn.left),
    `Z`,
  ].join(' ');
}
