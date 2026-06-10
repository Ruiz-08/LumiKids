/* ============================================================
   LUMIKIDS — MAPA DE MUNDOS MÁGICOS — mundo.js
   GSAP + PixiJS  |  Interacción, partículas, animaciones
   ============================================================ */

'use strict';

// ─── Configuración de mundos y base de datos ─────────────────
const MUNDOS_DATA = {
    bosque: {
        emoji: '🌳',
        nombre: 'Bosque Encantado',
        descripcion: 'Un espeso bosque cubierto de árboles sabios, setas luminosas e historias mágicas por leer. ¡Ten cuidado con los duendes traviesos!',
        imagen: 'bosque.png',
        historias: 5,
        piezas: '12/20',
        progreso: 60,
        estado: 'activo',
        color: 0x2db34a,
        tema: 'tema-bosque',
        reqTexto: '',
        url: '../historias/historia.html?mundo=bosque'
    },
    pirata: {
        emoji: '🏴‍☠️',
        nombre: 'Isla Pirata',
        descripcion: 'Navega por aguas misteriosas y explora cavernas llenas de doblones de oro y mapas perdidos. ¡Aprende a leer el mapa del tesoro!',
        imagen: 'pirata.png',
        historias: 5,
        piezas: '0/25',
        progreso: 0,
        estado: 'bloqueado',
        color: 0xf4791f,
        tema: 'tema-pirata',
        reqTexto: 'Completa 20 piezas para desbloquear',
        url: '../historias/historia.html?mundo=pirata'
    },
    letras: {
        emoji: '🚀',
        nombre: 'Planeta de las Letras',
        descripcion: 'Viaja al espacio sideral donde las estrellas forman sílabas y las constelaciones narran cuentos intergalácticos extraordinarios.',
        imagen: 'letras.png',
        historias: 5,
        piezas: '0/30',
        progreso: 0,
        estado: 'bloqueado',
        color: 0x5b9bf4,
        tema: 'tema-letras',
        reqTexto: 'Completa 40 piezas para desbloquear',
        url: '../historias/historia.html?mundo=letras'
    },
    dragones: {
        emoji: '🐉',
        nombre: 'Reino Dragón',
        descripcion: 'Entra en el valle de los volcanes durmientes y haz amistad con dragones amigables que escupen fuego de palabras e historias.',
        imagen: 'dragon.png',
        historias: 5,
        piezas: '0/35',
        progreso: 0,
        estado: 'bloqueado',
        color: 0xc0392b,
        tema: 'tema-dragones',
        reqTexto: 'Completa 70 piezas para desbloquear',
        url: '../historias/historia.html?mundo=dragones'
    },
    ciudad: {
        emoji: '🏰',
        nombre: 'Ciudad Dorada',
        descripcion: 'Descubre los grandes templos y murallas de oro de la antigua civilización de los libros perdidos. ¡El gran desafío final!',
        imagen: 'ciudad.png',
        historias: 5,
        piezas: '0/40',
        progreso: 0,
        estado: 'bloqueado',
        color: 0xffd700,
        tema: 'tema-ciudad',
        reqTexto: 'Completa 100 piezas para desbloquear',
        url: '../historias/historia.html?mundo=ciudad'
    }
};

// ─── Estado de la aplicación ─────────────────────────────────
let pixiApp = null;
let mundoSeleccionadoId = null;

/* ============================================================
   INICIALIZACIÓN PRINCIPAL
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    registrarGSAP();
    animarEntrada();
    initPixiParticulas();
    animarCamino();
    configurarInteraccionMundos();
    configurarZoomOverlay();
    configurarDragScroll();
    centrarScrollEnLumi();
    
    // Zoom out when clicking on empty map background
    const contenedor = document.getElementById('mapa-contenedor');
    if (contenedor) {
        contenedor.addEventListener('click', (e) => {
            if (mundoSeleccionadoId && (e.target.id === 'mapa-img' || e.target.id === 'mapa-fondo' || e.target.id === 'camino-svg' || e.target.tagName === 'path')) {
                restablecerZoom();
            }
        });
    }

    console.log('%cLUMIKIDS 🌍 Mapa de Mundos cargado', 'color:#ffd700;font-size:14px;font-weight:bold;');
});

/* ============================================================
   GSAP — Registro y animación de entrada
   ============================================================ */
function registrarGSAP() {
    if (typeof gsap !== 'undefined' && typeof MotionPathPlugin !== 'undefined') {
        gsap.registerPlugin(MotionPathPlugin);
    }
}

function animarEntrada() {
    if (typeof gsap === 'undefined') return;

    // Barra inferior: deslizar desde abajo
    gsap.from('#barra-inferior', {
        y: 80, opacity: 0, duration: 0.9,
        ease: 'back.out(1.4)', delay: 0.2
    });

    // Imagen del mapa: escalar desde centro
    gsap.from('#mapa-img', {
        scale: 1.08, opacity: 0, duration: 1.4,
        ease: 'power2.out', delay: 0.1
    });

    // Islas: aparición con rebote en cascada
    const nodos = document.querySelectorAll('.mundo-nodo');
    nodos.forEach((nodo, i) => {
        gsap.from(nodo, {
            scale: 0, opacity: 0, duration: 0.7,
            ease: 'back.out(2.2)', delay: 0.4 + i * 0.15
        });
    });

    // Lumi: entrar desde abajo
    gsap.from('#lumi-personaje', {
        y: 60, opacity: 0, duration: 0.9,
        ease: 'back.out(2)', delay: 1.1
    });
}

/* ============================================================
   CAMINO DORADO — Animación SVG
   ============================================================ */
function animarCamino() {
    const camino = document.getElementById('camino-dorado');
    if (!camino) return;

    // Actualizar MUNDOS_DATA y los candados/progreso en el DOM basándose en los libros leídos
    renderizarMundosDOM();

    const longitud = camino.getTotalLength ? camino.getTotalLength() : 2200;
    camino.style.strokeDasharray  = longitud;
    camino.style.strokeDashoffset = longitud;

    const fraccionRuta = calcularPorcentajeRuta();
    const targetOffset = longitud * (1.0 - fraccionRuta);

    if (typeof gsap !== 'undefined') {
        gsap.to(camino, {
            strokeDashoffset: targetOffset,
            duration: 2.5,
            ease: 'power2.inOut',
            delay: 0.8
        });
    } else {
        camino.style.transition = 'stroke-dashoffset 2.5s ease 0.8s';
        setTimeout(() => {
            camino.style.strokeDashoffset = targetOffset;
        }, 100);
    }
}

/* ─── Renderizar y actualizar los mundos y candados según libros completados ─── */
function renderizarMundosDOM() {
    try {
        const mundosKeys = ['bosque', 'pirata', 'letras', 'dragones', 'ciudad'];
        let totalPiezasCompletadas = 0;
        const biblioteca = window.LUMIKIDS_BIBLIOTECA;

        // 1. Calcular total de piezas ganadas por el usuario leyendo libros de todos los mundos
        if (biblioteca) {
            mundosKeys.forEach(key => {
                const libros = biblioteca[key]?.libros || [];
                libros.forEach(lib => {
                    if (localStorage.getItem(`lumikids_completed_${lib.id}`) === 'true') {
                        totalPiezasCompletadas += lib.piezas;
                    }
                });
            });
        } else {
            console.warn("LUMIKIDS_BIBLIOTECA no está disponible todavía, usando fallback de localStorage.");
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('lumikids_completed_') && localStorage.getItem(key) === 'true') {
                    const bookId = key.replace('lumikids_completed_', '');
                    if (bookId.startsWith('bosque_')) totalPiezasCompletadas += 4;
                    else if (bookId.startsWith('pirata_')) totalPiezasCompletadas += 5;
                    else if (bookId.startsWith('letras_')) totalPiezasCompletadas += 6;
                    else if (bookId.startsWith('dragones_')) totalPiezasCompletadas += 7;
                    else if (bookId.startsWith('ciudad_')) totalPiezasCompletadas += 8;
                }
            }
        }

        console.log("Total piezas completadas encontradas:", totalPiezasCompletadas);

        // 2. Actualizar MUNDOS_DATA y elementos HTML de cada mundo
        mundosKeys.forEach(key => {
            const data = MUNDOS_DATA[key];
            if (!data) return;

            let librosLeidos = 0;
            let piezasGanadas = 0;
            let maxPiezasPosibles = 0;

            if (biblioteca) {
                const libros = biblioteca[key]?.libros || [];
                const totalLibros = libros.length;
                maxPiezasPosibles = libros.reduce((acc, lib) => acc + lib.piezas, 0);
                libros.forEach(lib => {
                    const completado = localStorage.getItem(`lumikids_completed_${lib.id}`) === 'true';
                    if (completado) {
                        librosLeidos++;
                        piezasGanadas += lib.piezas;
                    }
                });
                data.progreso = totalLibros > 0 ? Math.round((librosLeidos / totalLibros) * 100) : 0;
                data.piezas = `${piezasGanadas}/${maxPiezasPosibles}`;
                data.historias = totalLibros;
            } else {
                let count = 0;
                for (let i = 0; i < localStorage.length; i++) {
                    const lKey = localStorage.key(i);
                    if (lKey && lKey.startsWith(`lumikids_completed_${key}_`) && localStorage.getItem(lKey) === 'true') {
                        count++;
                    }
                }
                const totalLibrosMundo = key === 'bosque' ? 6 : (key === 'pirata' ? 8 : (key === 'letras' ? 12 : (key === 'dragones' ? 15 : 20)));
                const piezasPorLibro = key === 'bosque' ? 4 : (key === 'pirata' ? 5 : (key === 'letras' ? 6 : (key === 'dragones' ? 7 : 8)));
                
                data.progreso = Math.round((count / totalLibrosMundo) * 100);
                data.piezas = `${count * piezasPorLibro}/${totalLibrosMundo * piezasPorLibro}`;
            }

            // Determinar estado de desbloqueo
            let lockRequired = 0;
            if (key === 'bosque') {
                data.estado = 'activo';
            } else {
                lockRequired = key === 'pirata' ? 20 : (key === 'letras' ? 40 : (key === 'dragones' ? 70 : 100));
                if (totalPiezasCompletadas >= lockRequired) {
                    data.estado = 'activo';
                } else {
                    data.estado = 'bloqueado';
                }
            }

            // Actualizar el DOM
            const nodo = document.getElementById(`mundo-${key}`);
            if (nodo) {
                nodo.dataset.desbloqueado = data.estado === 'activo' ? 'true' : 'false';
                const isla = nodo.querySelector('.mundo-isla');
                if (isla) {
                    if (data.estado === 'activo') {
                        isla.classList.remove('bloqueado');
                        const candado = isla.querySelector('.mundo-candado');
                        if (candado) candado.remove();
                    } else {
                        isla.classList.add('bloqueado');
                        if (!isla.querySelector('.mundo-candado')) {
                            const candadoWrap = document.createElement('div');
                            candadoWrap.className = 'mundo-candado';
                            candadoWrap.innerHTML = '<div class="candado-icono">🔒</div>';
                            const wrap = isla.querySelector('.mundo-imagen-wrap');
                            if (wrap) wrap.appendChild(candadoWrap);
                        }
                    }
                }
            }
        });

        // 3. Sincronizar nivel y barra de XP del jugador en el HUD inferior
        const bar = document.getElementById('barra-inferior');
        if (bar) {
            const xpText = bar.querySelector('.nav-perfil-xp-texto');
            const xpRelleno = bar.querySelector('.nav-perfil-xp-relleno');
            const levelBadge = bar.querySelector('.nav-perfil-nivel');
            
            if (xpText && xpRelleno && levelBadge) {
                const level = 1 + Math.floor(totalPiezasCompletadas / 15);
                levelBadge.textContent = `Nv.${level}`;
                
                const currentXP = (totalPiezasCompletadas * 50) % 1000;
                xpText.textContent = `${currentXP} / 1000 XP`;
                xpRelleno.style.width = `${(currentXP / 1000) * 100}%`;
            }
        }
    } catch (error) {
        console.error("Error en renderizarMundosDOM:", error);
    }
}

/* ─── Calcular fracción de progreso del camino dorado (M 252,342 -> Loop) ─── */
function calcularPorcentajeRuta() {
    try {
        const mundosKeys = ['bosque', 'pirata', 'letras', 'dragones', 'ciudad'];
        const limites = [0.0, 0.38, 0.48, 0.70, 0.90, 1.0];
        let pathFraction = 0.0;
        
        for (let i = 0; i < 5; i++) {
            const key = mundosKeys[i];
            const data = MUNDOS_DATA[key];
            const progresoMundo = (data?.progreso || 0) / 100;
            
            const startVal = limites[i];
            const endVal = limites[i + 1];
            const segmentSize = endVal - startVal;
            
            if (progresoMundo < 1.0) {
                pathFraction = startVal + (progresoMundo * segmentSize);
                break;
            } else {
                pathFraction = endVal;
            }
        }
        return pathFraction;
    } catch (e) {
        console.error("Error en calcularPorcentajeRuta:", e);
        return 0.0;
    }
}

/* ============================================================
   INTERACCIÓN CON MUNDOS
   ============================================================ */
function configurarInteraccionMundos() {
    const nodos = document.querySelectorAll('.mundo-nodo');

    nodos.forEach(nodo => {
        const isla = nodo.querySelector('.mundo-isla');
        const mundoId = nodo.dataset.mundo;
        const data = MUNDOS_DATA[mundoId];
        if (!data) return;

        // Hover: efecto de escala con GSAP
        nodo.addEventListener('mouseenter', () => {
            if (typeof gsap !== 'undefined') {
                gsap.to(isla, {
                    scale: data.estado === 'activo' ? 1.12 : 1.05,
                    duration: 0.35,
                    ease: 'back.out(2)'
                });
            }

            // Generar chispas PixiJS sobre la isla
            const rect = nodo.getBoundingClientRect();
            crearExplosionChispas(rect.left + rect.width / 2, rect.top + rect.height / 2, data.color);
        });

        nodo.addEventListener('mouseleave', () => {
            if (typeof gsap !== 'undefined') {
                gsap.to(isla, {
                    scale: 1, duration: 0.4,
                    ease: 'elastic.out(1, 0.5)'
                });
            }
        });

        // Click: zoom cinematográfico y carga del panel
        nodo.addEventListener('click', (e) => {
            e.stopPropagation();
            zoomAIsla(mundoId);
        });
    });

    // Cierre del panel
    const btnCerrar = document.getElementById('panel-cerrar');
    const btnCerrarSec = document.getElementById('panel-btn-cerrar-secundario');
    if (btnCerrar) btnCerrar.addEventListener('click', restablecerZoom);
    if (btnCerrarSec) btnCerrarSec.addEventListener('click', restablecerZoom);

    // Click en botón Entrar al Mundo
    const btnEntrar = document.getElementById('panel-btn-entrar');
    if (btnEntrar) {
        btnEntrar.addEventListener('click', () => {
            if (mundoSeleccionadoId) {
                const data = MUNDOS_DATA[mundoSeleccionadoId];
                if (data && data.estado !== 'bloqueado') {
                    activarZoom(mundoSeleccionadoId);
                }
            }
        });
    }
}

/* ─── Cámara zoom a isla seleccionada ─────────────────────── */
function zoomAIsla(mundoId) {
    const nodo = document.getElementById(`mundo-${mundoId}`);
    const mapaFondo = document.getElementById('mapa-fondo');
    if (!nodo || !mapaFondo) return;

    document.querySelectorAll('.mundo-nodo').forEach(n => n.classList.remove('seleccionado'));
    
    nodo.classList.add('seleccionado');
    mapaFondo.classList.add('con-seleccionado');

    const leftPercent = parseFloat(nodo.style.left) / 100;
    const topPercent = parseFloat(nodo.style.top) / 100;
    const islaX = 1400 * leftPercent;
    const islaY = 900 * topPercent;

    const contenedor = document.getElementById('mapa-contenedor');
    let S = 1.35;
    let deltaX = 0;
    let deltaY = 0;

    if (contenedor) {
        const W = contenedor.clientWidth;
        const H = contenedor.clientHeight;
        
        // Calcular escala de ajuste base para cubrir toda la pantalla sin espacios vacíos
        const scaleFit = Math.max(W / 1400, H / 900);
        // Zoom es scaleFit * 1.3, mínimo 1.35
        S = Math.max(1.35, scaleFit * 1.3);

        const isMobile = window.innerWidth <= 768;
        const shiftX = isMobile ? 0 : (100 / S); // Desplazar para que no quede detrás del panel lateral (ahora más pequeño, de 260px)
        
        deltaX = (700 - islaX) - shiftX;
        deltaY = 450 - islaY;

        // Límites correctos en píxeles del viewport
        const limitX = Math.max(0, 700 * S - W / 2);
        const limitY = Math.max(0, 450 * S - H / 2);

        deltaX = Math.max(-limitX, Math.min(limitX, deltaX));
        deltaY = Math.max(-limitY, Math.min(limitY, deltaY));
    } else {
        deltaX = 700 - islaX;
        deltaY = 450 - islaY;
    }

    mapaFondo.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${S})`;

    abrirPanelLateral(mundoId);

    const data = MUNDOS_DATA[mundoId];
    if (data && data.estado === 'bloqueado') {
        animarCandadoBloqueado(nodo);
    }
}

function restablecerZoom() {
    const mapaFondo = document.getElementById('mapa-fondo');
    if (!mapaFondo) return;

    mapaFondo.style.transform = 'translate(0, 0) scale(1)';
    mapaFondo.classList.remove('con-seleccionado');
    document.querySelectorAll('.mundo-nodo').forEach(n => n.classList.remove('seleccionado'));

    cerrarPanelLateral();
    centrarScrollEnLumi();
}

/* ─── Abrir y cerrar Panel Lateral ────────────────────────── */
function abrirPanelLateral(mundoId) {
    const panel = document.getElementById('panel-lateral');
    const data = MUNDOS_DATA[mundoId];
    if (!panel || !data) return;

    mundoSeleccionadoId = mundoId;

    const imgEl = document.getElementById('panel-mundo-img');
    const tituloEl = document.getElementById('panel-mundo-titulo');
    const descEl = document.getElementById('panel-mundo-descripcion');
    const historiasEl = document.getElementById('panel-stat-historias');
    const piezasEl = document.getElementById('panel-stat-piezas');
    const porcentajeEl = document.getElementById('panel-progreso-porcentaje');
    const rellenoEl = document.getElementById('panel-progreso-relleno');
    const alertaEl = document.getElementById('panel-alerta-bloqueo');
    const alertaTextoEl = document.getElementById('panel-alerta-texto');
    const btnEntrar = document.getElementById('panel-btn-entrar');

    panel.className = 'panel-lateral';
    panel.classList.add(data.tema);

    imgEl.src = `imagenes/${data.imagen}`;
    imgEl.alt = data.nombre;
    tituloEl.textContent = data.nombre;
    descEl.textContent = data.descripcion;
    historiasEl.textContent = data.historias;
    piezasEl.textContent = data.piezas;
    porcentajeEl.textContent = `${data.progreso}%`;
    rellenoEl.style.width = `${data.progreso}%`;

    if (data.estado === 'bloqueado') {
        alertaEl.style.display = 'flex';
        alertaTextoEl.textContent = data.reqTexto;
        btnEntrar.disabled = true;
        btnEntrar.querySelector('span').textContent = '🔒 Bloqueado';
    } else {
        alertaEl.style.display = 'none';
        btnEntrar.disabled = false;
        btnEntrar.querySelector('span').textContent = 'Entrar al Mundo';
    }

    panel.classList.add('abierto');
}

function cerrarPanelLateral() {
    const panel = document.getElementById('panel-lateral');
    if (panel) {
        panel.classList.remove('abierto');
    }
    mundoSeleccionadoId = null;
}

/* ─── Zoom al entrar a mundo desbloqueado ─────────────────── */
function activarZoom(mundoId) {
    const config  = MUNDOS_DATA[mundoId];
    if (!config) return;

    const overlay = document.getElementById('zoom-overlay');
    const emojiEl = document.getElementById('zoom-emoji');
    const tituloEl= document.getElementById('zoom-titulo');

    emojiEl.textContent  = config.emoji;
    tituloEl.textContent = config.nombre;

    overlay.classList.add('activo');

    setTimeout(() => {
        window.location.href = config.url;
    }, 2200);
}

/* ─── Candado: sacudir al intentar entrar ─────────────────── */
function animarCandadoBloqueado(nodo) {
    const candado = nodo.querySelector('.mundo-candado');
    const isla    = nodo.querySelector('.mundo-isla');

    if (typeof gsap !== 'undefined') {
        gsap.timeline()
            .to(isla, { x: -10, duration: 0.07, ease: 'power2.inOut' })
            .to(isla, { x:  12, duration: 0.07 })
            .to(isla, { x:  -8, duration: 0.07 })
            .to(isla, { x:   8, duration: 0.07 })
            .to(isla, { x:   0, duration: 0.1, ease: 'elastic.out(1, 0.4)' });

        if (candado) {
            gsap.from(candado, { scale: 1.3, duration: 0.3, ease: 'back.out(2)' });
        }
    }
}



/* ============================================================
   EXPLOSIÓN DE PARTÍCULAS PIXI.JS
   ============================================================ */
function crearExplosionChispas(x, y, colorHex) {
    if (!pixiApp || !pixiApp.stage) return;

    const NUM_CHISPAS = 18;
    for (let i = 0; i < NUM_CHISPAS; i++) {
        const chispa = new PIXI.Graphics();
        const radio = Math.random() * 2 + 1;
        chispa.beginFill(colorHex || 0xffffff, 0.95);
        chispa.drawCircle(0, 0, radio);
        chispa.endFill();

        const angulo = Math.random() * Math.PI * 2;
        const velocidad = 1.0 + Math.random() * 3.0;

        const datos = {
            x: x,
            y: y,
            vx: Math.cos(angulo) * velocidad,
            vy: Math.sin(angulo) * velocidad - 0.5,
            alpha: 1.0,
            fade: 0.025 + Math.random() * 0.025
        };

        chispa.x = datos.x;
        chispa.y = datos.y;
        pixiApp.stage.addChild(chispa);

        const animTick = () => {
            datos.x += datos.vx;
            datos.y += datos.vy;
            datos.vy += 0.08; // Efecto gravedad sutil
            datos.alpha -= datos.fade;

            chispa.x = datos.x;
            chispa.y = datos.y;
            chispa.alpha = Math.max(0, datos.alpha);

            if (datos.alpha <= 0) {
                pixiApp.stage.removeChild(chispa);
                chispa.destroy();
                pixiApp.ticker.remove(animTick);
            }
        };

        pixiApp.ticker.add(animTick);
    }
}

/* ============================================================
   FUNCIÓN PÚBLICA — Entrar a un mundo
   ============================================================ */
window.entrarMundo = function(mundoId) {
    activarZoom(mundoId);
};

/* ============================================================
   OVERLAY DE ZOOM — Configuración
   ============================================================ */
function configurarZoomOverlay() {
    const overlay = document.getElementById('zoom-overlay');
    if (!overlay) return;

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('activo');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            overlay.classList.remove('activo');
            restablecerZoom();
        }
    });
}

/* ============================================================
   PIXI.JS — Sistema de partículas mágicas
   ============================================================ */
function initPixiParticulas() {
    const canvas = document.getElementById('canvas-particulas');
    if (!canvas || typeof PIXI === 'undefined') {
        // Fallback: partículas CSS si PixiJS no carga
        crearParticulasCSS();
        return;
    }

    try {
        pixiApp = new PIXI.Application({
            view: canvas,
            width:  window.innerWidth,
            height: window.innerHeight,
            transparent: true,
            antialias: true,
            resolution: Math.min(window.devicePixelRatio || 1, 2),
            autoDensity: true
        });

        crearLuciernagas(pixiApp);
        crearChispas(pixiApp);
        crearEstrellas(pixiApp);

        // Redimensionar con la ventana
        window.addEventListener('resize', () => {
            pixiApp.renderer.resize(window.innerWidth, window.innerHeight);
        });

    } catch (err) {
        console.warn('PixiJS no disponible, usando fallback CSS:', err.message);
        crearParticulasCSS();
    }
}

/* ─── Luciérnagas con PixiJS ─────────────────────────────── */
function crearLuciernagas(app) {
    const NUM_LUCIERNGAS = 28;

    for (let i = 0; i < NUM_LUCIERNGAS; i++) {
        const luc = new PIXI.Graphics();
        luc.beginFill(0xbbff44, 1);
        luc.drawCircle(0, 0, Math.random() * 2.5 + 1.5);
        luc.endFill();

        const glow = new PIXI.Graphics();
        glow.beginFill(0x88ff00, 0.3);
        glow.drawCircle(0, 0, Math.random() * 6 + 5);
        glow.endFill();

        const container = new PIXI.Container();
        container.addChild(glow);
        container.addChild(luc);

        const datos = {
            x:   Math.random() * app.screen.width,
            y:   Math.random() * app.screen.height,
            vx:  (Math.random() - 0.5) * 0.5,
            vy:  (Math.random() - 0.5) * 0.5,
            fase: Math.random() * Math.PI * 2,
            vel:  0.6 + Math.random() * 0.8,
            amplX: 20 + Math.random() * 40,
            amplY: 20 + Math.random() * 40,
            tiempoBase: Date.now() / 1000
        };

        container.x = datos.x;
        container.y = datos.y;
        app.stage.addChild(container);

        // Animación en el ticker
        app.ticker.add(() => {
            const t = Date.now() / 1000;
            const dt = t - datos.tiempoBase;

            container.x = datos.x + Math.sin(dt * datos.vel + datos.fase) * datos.amplX;
            container.y = datos.y + Math.cos(dt * datos.vel * 0.7 + datos.fase) * datos.amplY;

            // Parpadeo
            const brillo = 0.3 + 0.7 * Math.abs(Math.sin(dt * (1.5 + Math.random() * 0.5)));
            container.alpha = brillo;
            glow.scale.set(0.8 + 0.4 * brillo);

            // Wrapping de pantalla
            if (container.x < -20) container.x = app.screen.width  + 20;
            if (container.x > app.screen.width  + 20) container.x = -20;
            if (container.y < -20) container.y = app.screen.height + 20;
            if (container.y > app.screen.height + 20) container.y = -20;
        });
    }
}

/* ─── Chispas mágicas ────────────────────────────────────── */
function crearChispas(app) {
    const chispas = [];
    const NUM_CHISPAS = 45;

    for (let i = 0; i < NUM_CHISPAS; i++) {
        const chispa = new PIXI.Graphics();
        const radio = Math.random() * 2 + 0.5;
        const color = [0xffd700, 0x88ccff, 0xff88aa, 0xaaffaa][Math.floor(Math.random() * 4)];

        chispa.beginFill(color, 0.9);
        chispa.drawCircle(0, 0, radio);
        chispa.endFill();

        const datos = {
            x:   Math.random() * app.screen.width,
            y:   Math.random() * app.screen.height,
            vy: -(0.3 + Math.random() * 0.6),
            vx:  (Math.random() - 0.5) * 0.3,
            alpha: Math.random(),
            fade: 0.003 + Math.random() * 0.006
        };

        chispa.x = datos.x;
        chispa.y = datos.y;
        chispa.alpha = datos.alpha;
        app.stage.addChild(chispa);
        chispas.push({ gfx: chispa, datos });

        app.ticker.add(() => {
            datos.y += datos.vy;
            datos.x += datos.vx;
            datos.alpha -= datos.fade;

            chispa.x = datos.x;
            chispa.y = datos.y;
            chispa.alpha = Math.max(0, datos.alpha);

            // Renacer al morir
            if (datos.alpha <= 0) {
                datos.x     = Math.random() * app.screen.width;
                datos.y     = app.screen.height + 10;
                datos.alpha = 0.8 + Math.random() * 0.2;
                datos.vy    = -(0.3 + Math.random() * 0.6);
                datos.vx    = (Math.random() - 0.5) * 0.3;
            }
        });
    }
}

/* ─── Estrellas de fondo ─────────────────────────────────── */
function crearEstrellas(app) {
    const NUM_ESTRELLAS = 60;

    for (let i = 0; i < NUM_ESTRELLAS; i++) {
        const estrella = new PIXI.Graphics();
        const radio = Math.random() * 1.5 + 0.3;

        estrella.beginFill(0xffffff, 1);
        estrella.drawCircle(0, 0, radio);
        estrella.endFill();

        estrella.x = Math.random() * app.screen.width;
        estrella.y = Math.random() * app.screen.height * 0.6; // Solo en la parte superior
        estrella.alpha = Math.random() * 0.7 + 0.1;

        const faseParpadeo = Math.random() * Math.PI * 2;
        const velParpadeo  = 0.5 + Math.random() * 1.5;
        app.stage.addChild(estrella);

        app.ticker.add(() => {
            const t = Date.now() / 1000;
            estrella.alpha = 0.1 + 0.5 * Math.abs(Math.sin(t * velParpadeo + faseParpadeo));
        });
    }
}

/* ─── Fallback: partículas CSS si PixiJS falla ──────────── */
function crearParticulasCSS() {
    const contenedor = document.querySelector('.mapa-fondo');
    if (!contenedor) return;

    for (let i = 0; i < 20; i++) {
        const p = document.createElement('div');
        p.style.cssText = `
            position: absolute;
            width: ${4 + Math.random() * 6}px;
            height: ${4 + Math.random() * 6}px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(255,215,0,0.9), transparent);
            left: ${Math.random() * 100}%;
            top:  ${Math.random() * 100}%;
            pointer-events: none;
            z-index: 3;
            animation: flotar-particula ${5 + Math.random() * 5}s ${Math.random() * 5}s infinite ease-in-out;
        `;
        contenedor.appendChild(p);
    }

    // Agregar keyframes si no existen
    if (!document.getElementById('kf-particulas')) {
        const style = document.createElement('style');
        style.id = 'kf-particulas';
        style.textContent = `
            @keyframes flotar-particula {
                0%, 100% { transform: translateY(0) scale(1); opacity: 0.4; }
                50%       { transform: translateY(-30px) scale(1.4); opacity: 0.9; }
            }
        `;
        document.head.appendChild(style);
    }
}

/* ============================================================
   ENLACE DESDE PÁGINA PRINCIPAL
   Si venimos con ?mundo=X en la URL, hacemos highlight del mundo
   ============================================================ */
(function detectarMundoURL() {
    const params  = new URLSearchParams(window.location.search);
    const mundoId = params.get('mundo');
    if (!mundoId) return;

    const nodo = document.getElementById(`mundo-${mundoId}`);
    if (!nodo) return;

    setTimeout(() => {
        zoomAIsla(mundoId);
    }, 1500);
})();

/* ============================================================
   DRAG SCROLL & AUTOFOCUS DE MAPA
   ============================================================ */
function configurarDragScroll() {
    const contenedor = document.getElementById('mapa-contenedor');
    if (!contenedor) return;

    let isDown = false;
    let startX;
    let startY;
    let scrollLeft;
    let scrollTop;

    contenedor.addEventListener('mousedown', (e) => {
        // Solo arrastrar con clic izquierdo y que no sea clic en un botón o enlace interactivo
        if (e.button !== 0 || e.target.closest('.mundo-nodo') || e.target.closest('.panel-lateral') || e.target.closest('.barra-inferior')) return;
        isDown = true;
        contenedor.style.cursor = 'grabbing';
        startX = e.pageX - contenedor.offsetLeft;
        startY = e.pageY - contenedor.offsetTop;
        scrollLeft = contenedor.scrollLeft;
        scrollTop = contenedor.scrollTop;
    });

    contenedor.addEventListener('mouseleave', () => {
        isDown = false;
        contenedor.style.cursor = 'default';
    });

    contenedor.addEventListener('mouseup', () => {
        isDown = false;
        contenedor.style.cursor = 'default';
    });

    contenedor.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - contenedor.offsetLeft;
        const y = e.pageY - contenedor.offsetTop;
        const walkX = (x - startX) * 1.5; // Multiplicador de velocidad de scroll
        const walkY = (y - startY) * 1.5;
        contenedor.scrollLeft = scrollLeft - walkX;
        contenedor.scrollTop = scrollTop - walkY;
    });
}

function centrarScrollEnLumi() {
    const contenedor = document.getElementById('mapa-contenedor');
    const lumi = document.getElementById('lumi-personaje');
    if (!contenedor || !lumi) return;

    setTimeout(() => {
        const x = lumi.offsetLeft - (contenedor.clientWidth / 2);
        const y = lumi.offsetTop - (contenedor.clientHeight / 2);
        contenedor.scrollTo({
            left: x,
            top: y,
            behavior: 'smooth'
        });
    }, 500); // Pequeño retraso para dar sensación de paneo inicial cinemático
}
