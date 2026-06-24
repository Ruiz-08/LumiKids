/* ============================================================
   LUMIKIDS — JUEGO INTERACTIVO DE ROMPECABEZAS v2.0
   puzzle-juego.js — Piezas con forma real de rompecabezas (SVG)
   ============================================================ */

'use strict';

/* ── Estado del juego ──────────────────────────────────────────── */
const PJ = {
    libroId: null, titulo: '', mundo: '', mundoNombre: '',
    emoji: '🧩', imagenUrl: '',
    totalPiezas: 4, cols: 2, rows: 2,
    piezaW: 0, piezaH: 0,
    TABLERO_W: 380, TABLERO_H: 380,
    celdas: [], piezasEnBandeja: [], piezasColocadas: [],
    cronometroId: null, segundos: 0,
    juegoTerminado: false, pistaUsada: false,
    arrastrando: null,
    conectores: [],   // tabla de conectores entre piezas adyacentes
};

const GRID_CONFIG = {
    4:  { cols: 2, rows: 2 },
    6:  { cols: 3, rows: 2 },
    8:  { cols: 4, rows: 2 },
    9:  { cols: 3, rows: 3 },
    12: { cols: 4, rows: 3 },
    16: { cols: 4, rows: 4 },
};

/* ============================================================
   GENERACIÓN DE CONECTORES (pestañas/muescas)
   Cada borde compartido entre dos piezas tiene un tipo:
     +1 = pestaña (protuberancia hacia afuera)
     -1 = muesca  (hueco hacia adentro)
   ============================================================ */
function generarConectores(cols, rows) {
    // conectores[row][col][dir]: 'right'=col-col+1, 'down'=row-row+1
    const c = { right: [], down: [] };

    // Bordes horizontales (right)
    for (let r = 0; r < rows; r++) {
        c.right[r] = [];
        for (let col = 0; col < cols - 1; col++) {
            c.right[r][col] = Math.random() > 0.5 ? 1 : -1;
        }
    }

    // Bordes verticales (down)
    for (let r = 0; r < rows - 1; r++) {
        c.down[r] = [];
        for (let col = 0; col < cols; col++) {
            c.down[r][col] = Math.random() > 0.5 ? 1 : -1;
        }
    }
    return c;
}

/* ============================================================
   CREAR PATH SVG PARA UNA PIEZA
   Genera el outline de la pieza con pestañas y muescas reales
   ============================================================ */
function crearPathPieza(piezaId, w, h, conectores, cols, rows) {
    const col = piezaId % cols;
    const row = Math.floor(piezaId / cols);

    // Obtener el conector para cada borde (0 = borde exterior, 1 = pestaña, -1 = hueco)
    const topC    = row > 0            ? -conectores.down[row-1][col]     : 0;
    const bottomC = row < rows - 1     ?  conectores.down[row][col]       : 0;
    const leftC   = col > 0            ? -conectores.right[row][col-1]    : 0;
    const rightC  = col < cols - 1     ?  conectores.right[row][col]      : 0;

    // Tamaño de pestaña S constante basado en el tamaño menor de la pieza (28%)
    const S = Math.min(w, h) * 0.28;

    function nubPath(x1, y1, x2, y2, sign) {
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

        // Mapeo de coordenadas locales (u: tangencial, n: normal) respecto al centro
        const p = (uVal, nVal) => {
            const px = mx + uVal * S * ux + nVal * A * nx;
            const py = my + uVal * S * uy + nVal * A * ny;
            return `${px.toFixed(2)} ${py.toFixed(2)}`;
        };

        // Curva de rompecabezas clásica simétrica y suave (C1-continua)
        return [
            `L ${p(-0.467, 0)}`,
            `C ${p(-0.20, 0)}, ${p(-0.15, 0.25)}, ${p(-0.40, 0.40)}`, // Cuello Izquierdo
            `C ${p(-0.90, 0.70)}, ${p(-0.667, 1.0)}, ${p(0.0, 1.0)}`, // Cabeza
            `C ${p(0.667, 1.0)}, ${p(0.90, 0.70)}, ${p(0.40, 0.40)}`, // Cabeza Derecha
            `C ${p(0.15, 0.25)}, ${p(0.20, 0)}, ${p(0.467, 0)}`, // Cuello Derecho
            `L ${x2.toFixed(2)} ${y2.toFixed(2)}`
        ].join(' ');
    }

    return [
        `M 0 0`,
        nubPath(0, 0, w, 0, topC),        // Borde superior
        nubPath(w, 0, w, h, rightC),      // Borde derecho
        nubPath(w, h, 0, h, bottomC),     // Borde inferior
        nubPath(0, h, 0, 0, leftC),       // Borde izquierdo
        `Z`
    ].join(' ');
}

/* ============================================================
   INICIALIZACIÓN
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('overlay-rompecabezas');
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            const btn = e.target.closest('.tarjeta-puzzle-btn-armar');
            if (btn) {
                e.stopPropagation();
                const d = btn.dataset;
                abrirJuegoPuzzle({
                    libroId:     d.libroId,
                    titulo:      d.titulo,
                    mundo:       d.mundo,
                    mundoNombre: d.mundoNombre,
                    emoji:       d.emoji,
                    imagenUrl:   obtenerUrlImagen(d.imagen),
                    totalPiezas: parseInt(d.piezas, 10) || 4,
                });
            }
        });
    }

    const botones = {
        'pj-btn-cerrar':     cerrarJuego,
        'pj-btn-mezclar':    mezclarBandeja,
        'pj-btn-pista':      mostrarPista,
        'pj-btn-ver-imagen': toggleVerImagen,
        'pj-btn-jugar-otro': cerrarJuego,
        'pj-btn-revolver':   () => reiniciarJuego(),
    };
    Object.entries(botones).forEach(([id, fn]) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', fn);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const jo = document.getElementById('puzzle-juego-overlay');
            if (jo && jo.classList.contains('activo')) cerrarJuego();
        }
    });

    window.abrirJuegoPuzzle = abrirJuegoPuzzle;
});

/* ============================================================
   ABRIR JUEGO (React Jigsaw Puzzle Widget Integration)
   ============================================================ */
let currentReactPuzzleRoot = null;

function abrirJuegoPuzzle(config) {
    const reactOverlay = document.getElementById('react-puzzle-overlay');
    const galeriaOverlay = document.getElementById('overlay-rompecabezas');

    if (reactOverlay && window.initLumiKidsPuzzle) {
        // Cerrar la galería de fondo
        if (galeriaOverlay) galeriaOverlay.style.display = 'none';

        // Mostrar overlay de React
        reactOverlay.style.display = 'flex';

        // Mapear dificultad
        let difficulty = "medio";
        if (config.totalPiezas <= 4) difficulty = "facil";
        else if (config.totalPiezas <= 9) difficulty = "medio";
        else if (config.totalPiezas <= 16) difficulty = "dificil";
        else difficulty = "experto";

        // Inicializar React
        currentReactPuzzleRoot = window.initLumiKidsPuzzle("react-puzzle-root", {
            imageSrc: config.imagenUrl,
            difficulty: difficulty,
            onClose: () => {
                reactOverlay.style.display = 'none';
                if (currentReactPuzzleRoot) {
                    currentReactPuzzleRoot.unmount();
                    currentReactPuzzleRoot = null;
                }
                if (galeriaOverlay) galeriaOverlay.style.display = 'flex';
            },
            onSuccess: () => {
                // Guardar progreso en localStorage
                localStorage.setItem(`lumikids_completed_${config.libroId}`, 'true');
                
                // Actualizar piezas obtenidas en cache
                const cachedBook = localStorage.getItem(`lumikids_story_cache_v2_${config.libroId}`);
                if (cachedBook) {
                    try {
                        const parsed = JSON.parse(cachedBook);
                        parsed.piezasObtenidas = config.totalPiezas;
                        localStorage.setItem(`lumikids_story_cache_v2_${config.libroId}`, JSON.stringify(parsed));
                    } catch (e) {}
                }

                // Notificar al mapa principal para refrescar el estado
                window.dispatchEvent(new CustomEvent('libroCompletado', { detail: { libroId: config.libroId } }));
            }
        });
        return;
    }

    // FALLBACK: Si React no se ha cargado por alguna razón, usar el código antiguo
    Object.assign(PJ, {
        libroId:      config.libroId,
        titulo:       config.titulo,
        mundo:        config.mundo,
        mundoNombre:  config.mundoNombre,
        emoji:        config.emoji,
        imagenUrl:    config.imagenUrl,
        totalPiezas:  config.totalPiezas,
        juegoTerminado: false,
        pistaUsada:   false,
    });

    const gc = GRID_CONFIG[PJ.totalPiezas] || GRID_CONFIG[4];
    PJ.cols = gc.cols; PJ.rows = gc.rows;
    PJ.piezaW = PJ.TABLERO_W / PJ.cols;
    PJ.piezaH = PJ.TABLERO_H / PJ.rows;

    // Generar conectores de forma aleatoria (una vez por juego)
    PJ.conectores = generarConectores(PJ.cols, PJ.rows);

    if (galeriaOverlay) galeriaOverlay.style.display = 'none';

    const juegoOverlay = document.getElementById('puzzle-juego-overlay');
    const victoria = document.getElementById('pj-victoria');
    if (victoria) victoria.style.display = 'none';
    if (juegoOverlay) {
        juegoOverlay.classList.add('activo');
        const modal = juegoOverlay.querySelector('.puzzle-juego-modal');
        if (modal) modal.style.display = 'flex';
    }

    setText('pj-cab-titulo', PJ.titulo);
    setText('pj-cab-mundo',  PJ.mundoNombre);
    const emojiEl = document.getElementById('pj-cab-emoji');
    if (emojiEl) emojiEl.textContent = PJ.emoji;

    // Imagen de referencia
    const refEl = document.getElementById('pj-tablero-referencia');
    if (refEl && PJ.imagenUrl) {
        refEl.style.backgroundImage  = `url('${PJ.imagenUrl}')`;
        refEl.style.backgroundSize   = `${PJ.TABLERO_W}px ${PJ.TABLERO_H}px`;
        refEl.style.width  = PJ.TABLERO_W + 'px';
        refEl.style.height = PJ.TABLERO_H + 'px';
        refEl.style.opacity = '0.12';
    }

    // Ajustar tamaño del contenedor del tablero SVG
    const tableroEl = document.getElementById('pj-tablero');
    if (tableroEl) {
        tableroEl.style.width  = PJ.TABLERO_W + 'px';
        tableroEl.style.height = PJ.TABLERO_H + 'px';
    }

    construirEstadoJuego();
    renderizarTablero();
    renderizarBandeja();
    actualizarHUD();

    PJ.segundos = 0;
    clearInterval(PJ.cronometroId);
    PJ.cronometroId = setInterval(() => {
        PJ.segundos++;
        setText('pj-cronometro', formatearTiempo(PJ.segundos));
    }, 1000);
}

/* ============================================================
   CONSTRUIR ESTADO INICIAL
   ============================================================ */
function construirEstadoJuego() {
    PJ.celdas          = Array.from({ length: PJ.totalPiezas }, (_, i) => ({ id: i, ocupada: false, piezaId: null }));
    PJ.piezasEnBandeja = shuffleArray([...Array(PJ.totalPiezas).keys()]);
    PJ.piezasColocadas = [];
}

/* ============================================================
   RENDERIZAR TABLERO (celdas SVG)
   ============================================================ */
function renderizarTablero() {
    const tablero = document.getElementById('pj-tablero');
    if (!tablero) return;
    tablero.innerHTML = '';
    tablero.style.position = 'relative';

    PJ.celdas.forEach((celda, i) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'pj-celda-wrapper';
        wrapper.dataset.celdaId = i;

        const col = i % PJ.cols;
        const row = Math.floor(i / PJ.cols);
        wrapper.style.position = 'absolute';
        wrapper.style.left = (col * PJ.piezaW) + 'px';
        wrapper.style.top  = (row * PJ.piezaH) + 'px';
        wrapper.style.width  = PJ.piezaW + 'px';
        wrapper.style.height = PJ.piezaH + 'px';

        if (celda.ocupada && celda.piezaId !== null) {
            wrapper.appendChild(crearElementoPieza(celda.piezaId, true));
        } else {
            // Celda vacía con contorno SVG de pieza
            const svgHueco = crearSVGHueco(i);
            wrapper.appendChild(svgHueco);
        }

        // Eventos drop
        wrapper.addEventListener('dragover',  (e) => { e.preventDefault(); wrapper.classList.add('pj-celda-hover'); });
        wrapper.addEventListener('dragleave', ()  => wrapper.classList.remove('pj-celda-hover'));
        wrapper.addEventListener('drop',      (e) => manejarDrop(e, i));
        wrapper.addEventListener('touchend',  (e) => manejarTouchDrop(e, i));

        tablero.appendChild(wrapper);
    });
}

/* ── Crear SVG "hueco" para celda vacía ── */
function crearSVGHueco(piezaId) {
    const overflow = 24; // extra para pestañas
    const W = PJ.piezaW + overflow * 2;
    const H = PJ.piezaH + overflow * 2;

    const path = crearPathPieza(piezaId, PJ.piezaW, PJ.piezaH, PJ.conectores, PJ.cols, PJ.rows);
    const svgNs = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNs, 'svg');
    svg.setAttribute('class', 'pj-hueco-svg');
    svg.setAttribute('width',  W);
    svg.setAttribute('height', H);
    svg.setAttribute('viewBox', `${-overflow} ${-overflow} ${W} ${H}`);
    svg.style.cssText = `position:absolute;left:${-overflow}px;top:${-overflow}px;pointer-events:none;`;

    const pathEl = document.createElementNS(svgNs, 'path');
    pathEl.setAttribute('d', path);
    pathEl.setAttribute('class', 'pj-hueco-path');
    svg.appendChild(pathEl);

    // Número de guía al centro
    const num = document.createElementNS(svgNs, 'text');
    num.setAttribute('x', PJ.piezaW / 2);
    num.setAttribute('y', PJ.piezaH / 2 + 6);
    num.setAttribute('text-anchor', 'middle');
    num.setAttribute('class', 'pj-hueco-num');
    num.textContent = piezaId + 1;
    svg.appendChild(num);

    return svg;
}

/* ============================================================
   RENDERIZAR BANDEJA (piezas en forma de puzzle)
   ============================================================ */
function renderizarBandeja() {
    const bandeja = document.getElementById('pj-bandeja');
    if (!bandeja) return;
    bandeja.innerHTML = '';

    if (PJ.piezasEnBandeja.length === 0) {
        const vacio = document.createElement('div');
        vacio.className = 'pj-bandeja-vacia';
        vacio.innerHTML = '<div class="pj-bandeja-vacia-icono">✅</div><span>¡Todas las piezas colocadas!</span>';
        bandeja.appendChild(vacio);
        return;
    }

    PJ.piezasEnBandeja.forEach(piezaId => {
        bandeja.appendChild(crearElementoPieza(piezaId, false));
    });
}

/* ============================================================
   CREAR ELEMENTO DE PIEZA (SVG clip-path con imagen)
   ============================================================ */
function crearElementoPieza(piezaId, enTablero) {
    const overflow = enTablero ? 0 : 20;
    const W  = PJ.piezaW + overflow * 2;
    const H  = PJ.piezaH + overflow * 2;

    const col = piezaId % PJ.cols;
    const row = Math.floor(piezaId / PJ.cols);
    const bgX = -(col * PJ.piezaW) + overflow;
    const bgY = -(row * PJ.piezaH) + overflow;

    const svgNs = 'http://www.w3.org/2000/svg';
    const wrapper = document.createElement('div');
    wrapper.className = `pj-pieza-wrapper ${enTablero ? 'pj-pieza-tablero' : 'pj-pieza-bandeja'}`;
    wrapper.dataset.piezaId = piezaId;
    wrapper.style.cssText = `
        width:${W}px; height:${H}px;
        position:relative; flex-shrink:0;
        cursor:${enTablero ? 'default' : 'grab'};
    `;
    if (!enTablero) wrapper.draggable = true;

    const svg = document.createElementNS(svgNs, 'svg');
    svg.setAttribute('width',  W);
    svg.setAttribute('height', H);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.style.cssText = 'overflow:visible;display:block;';

    // Defs: clipPath + filtros de sombra
    const defs = document.createElementNS(svgNs, 'defs');
    const clipId = `clip-p${piezaId}-${Math.random().toString(36).slice(2,7)}`;

    const clipPath = document.createElementNS(svgNs, 'clipPath');
    clipPath.setAttribute('id', clipId);
    const pathEl = document.createElementNS(svgNs, 'path');
    const pathD = crearPathPieza(piezaId, PJ.piezaW, PJ.piezaH, PJ.conectores, PJ.cols, PJ.rows);
    // Desplazamos el path por el overflow
    pathEl.setAttribute('d', desplazarPath(pathD, overflow, overflow));
    clipPath.appendChild(pathEl);

    // Filtro de sombra para bandeja
    const filterId = `shadow-${clipId}`;
    const filter = document.createElementNS(svgNs, 'filter');
    filter.setAttribute('id', filterId);
    filter.setAttribute('x', '-20%'); filter.setAttribute('y', '-20%');
    filter.setAttribute('width', '140%'); filter.setAttribute('height', '140%');
    const feDropShadow = document.createElementNS(svgNs, 'feDropShadow');
    feDropShadow.setAttribute('dx', '2'); feDropShadow.setAttribute('dy', '3');
    feDropShadow.setAttribute('stdDeviation', '4');
    feDropShadow.setAttribute('flood-color', 'rgba(0,0,0,0.5)');
    filter.appendChild(feDropShadow);

    defs.appendChild(clipPath);
    defs.appendChild(filter);
    svg.appendChild(defs);

    // Grupo con clip
    const g = document.createElementNS(svgNs, 'g');
    g.setAttribute('clip-path', `url(#${clipId})`);
    if (!enTablero) g.setAttribute('filter', `url(#${filterId})`);

    if (PJ.imagenUrl) {
        const img = document.createElementNS(svgNs, 'image');
        img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', PJ.imagenUrl);
        img.setAttribute('x', bgX);
        img.setAttribute('y', bgY);
        img.setAttribute('width',  PJ.TABLERO_W);
        img.setAttribute('height', PJ.TABLERO_H);
        img.setAttribute('preserveAspectRatio', 'none');
        g.appendChild(img);
    } else {
        // Sin imagen: color sólido con número
        const colores = ['#6366f1','#06b6d4','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6'];
        const rect = document.createElementNS(svgNs, 'rect');
        rect.setAttribute('x', 0); rect.setAttribute('y', 0);
        rect.setAttribute('width', W); rect.setAttribute('height', H);
        rect.setAttribute('fill', colores[piezaId % colores.length]);
        g.appendChild(rect);

        const txt = document.createElementNS(svgNs, 'text');
        txt.setAttribute('x', W / 2); txt.setAttribute('y', H / 2 + 8);
        txt.setAttribute('text-anchor', 'middle');
        txt.setAttribute('fill', 'white');
        txt.setAttribute('font-size', '22');
        txt.setAttribute('font-weight', '800');
        txt.textContent = piezaId + 1;
        g.appendChild(txt);
    }

    // Borde de la pieza (stroke)
    const border = document.createElementNS(svgNs, 'path');
    border.setAttribute('d', desplazarPath(pathD, overflow, overflow));
    border.setAttribute('fill', 'none');
    border.setAttribute('stroke', enTablero ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.6)');
    border.setAttribute('stroke-width', enTablero ? '1' : '2');

    svg.appendChild(g);
    svg.appendChild(border);
    wrapper.appendChild(svg);

    if (!enTablero) {
        // Eventos drag mouse
        wrapper.addEventListener('dragstart', (e) => {
            PJ.arrastrando = { piezaId, desdeTablero: false };
            wrapper.classList.add('pj-pieza-dragging');
            e.dataTransfer.setData('text/plain', piezaId);
            e.dataTransfer.effectAllowed = 'move';
        });
        wrapper.addEventListener('dragend', () => wrapper.classList.remove('pj-pieza-dragging'));

        // Touch
        wrapper.addEventListener('touchstart', (e) => manejarTouchStart(e, piezaId, false), { passive: true });
        wrapper.addEventListener('touchmove',  (e) => manejarTouchMove(e), { passive: false });
    }

    return wrapper;
}

/* ── Desplazar un path SVG por (dx, dy) ── */
function desplazarPath(pathStr, dx, dy) {
    pathStr = pathStr.replace(/,/g, ' ');
    // Expresiones regulares corregidas para capturar opcionalmente el signo negativo (-?)
    return pathStr.replace(/([ML])\s*(-?[\d.]+)\s+(-?[\d.]+)/g, (m, cmd, x, y) =>
        `${cmd} ${parseFloat(x)+dx} ${parseFloat(y)+dy}`
    ).replace(/([C])\s*(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)/g,
        (m, cmd, x1, y1, x2, y2, x, y) =>
        `${cmd} ${parseFloat(x1)+dx} ${parseFloat(y1)+dy} ${parseFloat(x2)+dx} ${parseFloat(y2)+dy} ${parseFloat(x)+dx} ${parseFloat(y)+dy}`
    );
}

/* ============================================================
   MANEJO DE DROP (mouse)
   ============================================================ */
function manejarDrop(e, celdaDestino) {
    e.preventDefault();
    const celdaEl = e.currentTarget;
    celdaEl.classList.remove('pj-celda-hover');
    if (!PJ.arrastrando) return;
    const { piezaId, desdeTablero } = PJ.arrastrando;
    colocarPiezaEnCelda(piezaId, celdaDestino, desdeTablero);
    PJ.arrastrando = null;
}

/* ============================================================
   COLOCAR PIEZA EN CELDA
   ============================================================ */
function colocarPiezaEnCelda(piezaId, celdaDestino, desdeTablero) {
    const celda = PJ.celdas[celdaDestino];
    if (!celda) return;

    // Liberar pieza anterior de esa celda
    if (celda.ocupada && celda.piezaId !== null) {
        const prev = celda.piezaId;
        PJ.piezasColocadas = PJ.piezasColocadas.filter(id => id !== prev);
        PJ.piezasEnBandeja.push(prev);
    }

    // Si venía del tablero, liberar su celda anterior
    if (desdeTablero) {
        const celdaAnterior = PJ.celdas.find(c => c.piezaId === piezaId);
        if (celdaAnterior) { celdaAnterior.ocupada = false; celdaAnterior.piezaId = null; }
        PJ.piezasColocadas = PJ.piezasColocadas.filter(id => id !== piezaId);
    } else {
        PJ.piezasEnBandeja = PJ.piezasEnBandeja.filter(id => id !== piezaId);
    }

    celda.ocupada = true;
    celda.piezaId = piezaId;
    if (!PJ.piezasColocadas.includes(piezaId)) PJ.piezasColocadas.push(piezaId);

    const esCorrecta = (piezaId === celdaDestino);

    renderizarTablero();
    renderizarBandeja();
    actualizarHUD();

    // Flash visual
    requestAnimationFrame(() => {
        const wrappers = document.querySelectorAll('.pj-celda-wrapper');
        wrappers.forEach(w => {
            if (parseInt(w.dataset.celdaId) === celdaDestino) {
                w.classList.add(esCorrecta ? 'pj-celda-correcta' : 'pj-celda-incorrecta');
                setTimeout(() => w.classList.remove('pj-celda-correcta', 'pj-celda-incorrecta'), 700);
            }
        });
    });

    verificarVictoria();
}

/* ============================================================
   TOUCH SUPPORT
   ============================================================ */
let touchGhost = null;

function manejarTouchStart(e, piezaId, desdeTablero) {
    PJ.arrastrando = { piezaId, desdeTablero };
    if (touchGhost) touchGhost.remove();

    const srcEl = e.currentTarget;
    const clone = srcEl.cloneNode(true);
    clone.style.cssText += `
        position:fixed; pointer-events:none; z-index:99999;
        opacity:0.85; transform:scale(1.1) rotate(-4deg);
        transition:none; box-shadow:0 12px 36px rgba(0,0,0,0.45);
    `;
    document.body.appendChild(clone);
    touchGhost = clone;

    const touch = e.touches[0];
    clone.style.left = (touch.clientX - PJ.piezaW / 2) + 'px';
    clone.style.top  = (touch.clientY - PJ.piezaH / 2) + 'px';
}

function manejarTouchMove(e) {
    if (!touchGhost) return;
    e.preventDefault();
    const touch = e.touches[0];
    touchGhost.style.left = (touch.clientX - PJ.piezaW / 2) + 'px';
    touchGhost.style.top  = (touch.clientY - PJ.piezaH / 2) + 'px';
}

function manejarTouchDrop(e, celdaDestino) {
    if (touchGhost) { touchGhost.remove(); touchGhost = null; }
    if (!PJ.arrastrando) return;
    const { piezaId, desdeTablero } = PJ.arrastrando;
    colocarPiezaEnCelda(piezaId, celdaDestino, desdeTablero);
    PJ.arrastrando = null;
}

/* ============================================================
   MEZCLAR PIEZAS EN BANDEJA
   ============================================================ */
function mezclarBandeja() {
    PJ.piezasEnBandeja = shuffleArray([...PJ.piezasEnBandeja]);
    renderizarBandeja();
    const btn = document.getElementById('pj-btn-mezclar');
    if (btn) {
        btn.style.transform = 'rotate(360deg)';
        setTimeout(() => { btn.style.transform = ''; }, 400);
    }
}

/* ============================================================
   PISTA
   ============================================================ */
function mostrarPista() {
    if (PJ.piezasEnBandeja.length === 0) return;
    PJ.pistaUsada = true;
    const piezaId = PJ.piezasEnBandeja[0];

    // Resaltar celda correcta
    const wrappers = document.querySelectorAll('.pj-celda-wrapper');
    wrappers.forEach(w => {
        if (parseInt(w.dataset.celdaId) === piezaId) {
            w.classList.add('pj-celda-pista');
            setTimeout(() => w.classList.remove('pj-celda-pista'), 2500);
        }
    });

    // Resaltar pieza en bandeja
    const piezaEl = document.querySelector(`.pj-bandeja [data-pieza-id="${piezaId}"]`);
    if (piezaEl) {
        piezaEl.classList.add('pj-pieza-pista');
        setTimeout(() => piezaEl.classList.remove('pj-pieza-pista'), 2500);
    }

    const btn = document.getElementById('pj-btn-pista');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '⏳ En 4s...';
        setTimeout(() => {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-lightbulb-fill"></i> Pista';
        }, 4000);
    }
}

/* ============================================================
   VER IMAGEN
   ============================================================ */
function toggleVerImagen() {
    const ref = document.getElementById('pj-tablero-referencia');
    if (!ref) return;
    const nueva = ref.style.opacity === '0.12' ? '0.55' : '0.12';
    ref.style.opacity = nueva;
    const btn = document.getElementById('pj-btn-ver-imagen');
    if (btn) {
        btn.innerHTML = nueva > '0.2'
            ? '<i class="bi bi-eye-slash-fill"></i> Ocultar'
            : '<i class="bi bi-eye-fill"></i> Ver imagen';
    }
}

/* ============================================================
   VERIFICAR VICTORIA
   ============================================================ */
function verificarVictoria() {
    const todasCorrectas = PJ.celdas.every(c => c.ocupada && c.piezaId === c.id);
    if (!todasCorrectas) return;
    PJ.juegoTerminado = true;
    clearInterval(PJ.cronometroId);
    setTimeout(() => mostrarVictoria(), 700);
}

function mostrarVictoria() {
    const modal    = document.querySelector('.puzzle-juego-modal');
    const victoria = document.getElementById('pj-victoria');
    if (!victoria) return;
    if (modal) modal.style.display = 'none';

    const sub = document.getElementById('pj-victoria-sub');
    if (sub) {
        const t  = PJ.segundos;
        const ts = t < 60 ? `${t} segundos` : `${Math.floor(t/60)}m ${t%60}s`;
        sub.textContent = `¡Lo armaste en ${ts}!${PJ.pistaUsada ? ' 💡 (usaste una pista)' : ' ⭐ ¡Sin pista!'}`;
    }

    const imgWrap = document.getElementById('pj-victoria-imagen-wrap');
    if (imgWrap && PJ.imagenUrl) {
        imgWrap.innerHTML = `<img src="${PJ.imagenUrl}" alt="${PJ.titulo}"
            style="width:220px;height:220px;object-fit:cover;border-radius:20px;
            box-shadow:0 8px 32px rgba(0,0,0,0.4),0 0 0 4px rgba(251,191,36,0.5);">`;
    }

    victoria.style.display = 'flex';
    lanzarConfeti();
}

/* ============================================================
   CONFETI
   ============================================================ */
function lanzarConfeti() {
    const juegoOverlay = document.getElementById('puzzle-juego-overlay');
    if (!juegoOverlay) return;
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;border-radius:24px;';
    juegoOverlay.appendChild(canvas);
    canvas.width  = juegoOverlay.clientWidth;
    canvas.height = juegoOverlay.clientHeight;

    const ctx = canvas.getContext('2d');
    const shapes = ['rect','circle','triangle'];
    const colores = ['#ffd700','#ff69b4','#00bfff','#90ee90','#ff6347','#da70d6','#40e0d0'];

    const piezas = Array.from({ length: 140 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        w: 6 + Math.random() * 10,
        h: 4 + Math.random() * 8,
        color: colores[Math.floor(Math.random() * colores.length)],
        vel: 1.5 + Math.random() * 4,
        giro: (Math.random() - 0.5) * 0.18,
        angulo: Math.random() * Math.PI * 2,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
    }));

    let frame = 0;
    function animarConfeti() {
        if (frame++ > 240) { canvas.remove(); return; }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        piezas.forEach(p => {
            p.y += p.vel;
            p.angulo += p.giro;
            if (p.y > canvas.height + 10) p.y = -10;
            ctx.save();
            ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
            ctx.rotate(p.angulo);
            ctx.fillStyle = p.color;
            if (p.shape === 'circle') {
                ctx.beginPath();
                ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.shape === 'triangle') {
                ctx.beginPath();
                ctx.moveTo(0, -p.h / 2);
                ctx.lineTo(p.w / 2, p.h / 2);
                ctx.lineTo(-p.w / 2, p.h / 2);
                ctx.closePath();
                ctx.fill();
            } else {
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            }
            ctx.restore();
        });
        requestAnimationFrame(animarConfeti);
    }
    animarConfeti();
}

/* ============================================================
   ACTUALIZAR HUD
   ============================================================ */
function actualizarHUD() {
    const restantes = PJ.piezasEnBandeja.length;
    setText('pj-piezas-restantes', restantes === 0 ? '¡Todo colocado!' : `${restantes} pieza${restantes !== 1 ? 's' : ''} restante${restantes !== 1 ? 's' : ''}`);

    const correctas = PJ.celdas.filter(c => c.ocupada && c.piezaId === c.id).length;
    const pct = Math.round((correctas / PJ.totalPiezas) * 100);

    const barra = document.getElementById('pj-progreso-barra');
    const textoEl = document.getElementById('pj-progreso-texto');
    if (barra) {
        barra.style.width = pct + '%';
        barra.style.background = pct === 100
            ? 'linear-gradient(90deg,#22c55e,#16a34a)'
            : pct > 60 ? 'linear-gradient(90deg,#f59e0b,#d97706)'
            : 'linear-gradient(90deg,#6366f1,#4f46e5)';
    }
    if (textoEl) textoEl.textContent = `${pct}% en posición correcta`;
}

/* ============================================================
   REINICIAR JUEGO
   ============================================================ */
function reiniciarJuego() {
    const victoria = document.getElementById('pj-victoria');
    const modal    = document.querySelector('.puzzle-juego-modal');
    if (victoria) victoria.style.display = 'none';
    if (modal)    modal.style.display = 'flex';

    const canvas = document.querySelector('#puzzle-juego-overlay canvas');
    if (canvas) canvas.remove();

    PJ.juegoTerminado = false;
    PJ.pistaUsada = false;
    PJ.conectores = generarConectores(PJ.cols, PJ.rows); // nuevas formas
    construirEstadoJuego();
    renderizarTablero();
    renderizarBandeja();
    actualizarHUD();

    PJ.segundos = 0;
    clearInterval(PJ.cronometroId);
    setText('pj-cronometro', '00:00');
    PJ.cronometroId = setInterval(() => {
        PJ.segundos++;
        setText('pj-cronometro', formatearTiempo(PJ.segundos));
    }, 1000);
}

/* ============================================================
   CERRAR JUEGO
   ============================================================ */
function cerrarJuego() {
    clearInterval(PJ.cronometroId);
    PJ.juegoTerminado = true;
    if (touchGhost) { touchGhost.remove(); touchGhost = null; }

    const juegoOverlay = document.getElementById('puzzle-juego-overlay');
    if (juegoOverlay) juegoOverlay.classList.remove('activo');

    const canvas = document.querySelector('#puzzle-juego-overlay canvas');
    if (canvas) canvas.remove();

    const modal = document.querySelector('.puzzle-juego-modal');
    if (modal) modal.style.display = 'flex';

    const victoria = document.getElementById('pj-victoria');
    if (victoria) victoria.style.display = 'none';

    const galeria = document.getElementById('overlay-rompecabezas');
    if (galeria) { galeria.style.display = ''; galeria.classList.add('activo'); }
}

/* ============================================================
   UTILIDADES
   ============================================================ */
function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function setText(id, txt) {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
}

function formatearTiempo(s) {
    return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
}

function obtenerUrlImagen(imagenPath) {
    if (!imagenPath) return '';
    if (imagenPath.startsWith('http') || imagenPath.startsWith('../')) return imagenPath;
    return `../historias/${imagenPath}`;
}
