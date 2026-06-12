/* ============================================================
   LUMIKIDS — MECÁNICAS DE JUEGOS MÁGICOS — juegos.js
   ============================================================ */

(function() {
    // Namespace global
    const LUMIKIDS_JUEGOS = {
        overlay: null,
        tarjeta: null,
        cuerpo: null,
        audioCtx: null,
        callbackOnComplete: null,
        
        // Estado del juego actual
        estado: {
            mundo: '',
            libroId: '',
            capNum: 1,
            totalCaps: 4,
            pregunta: null,
            ahorcado: null,
            piezaIdx: 0,
            piezasTotal: 4,
            vidas: 6,
            letrasAdivinadas: [],
            pasoActual: 1 // 1: Comprensión, 2: Ahorcado, 3: Recompensa, 4: Rompecabezas, 5: Completado
        }
    };

    // ─── 1. Sintetizador de Sonidos Mágicos (AudioContext) ──────────────────────────
    function playSound(type) {
        try {
            if (!LUMIKIDS_JUEGOS.audioCtx) {
                LUMIKIDS_JUEGOS.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            const ctx = LUMIKIDS_JUEGOS.audioCtx;
            if (ctx.state === 'suspended') {
                ctx.resume();
            }

            if (type === 'success') {
                // Acorde brillante ascendente (Arpegio Mayor)
                const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
                freqs.forEach((freq, idx) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    
                    osc.type = 'sine';
                    osc.frequency.value = freq;
                    
                    const now = ctx.currentTime;
                    const startTime = now + idx * 0.08;
                    
                    gain.gain.setValueAtTime(0, startTime);
                    gain.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
                    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.35);
                    
                    osc.start(startTime);
                    osc.stop(startTime + 0.4);
                });
            } else if (type === 'error') {
                // Zumbido grave descendente
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(160, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.25);
                
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
                
                osc.start();
                osc.stop(ctx.currentTime + 0.3);
            } else if (type === 'complete') {
                // Fanfarria triunfal de trompetas
                const freqs = [392.00, 523.25, 659.25, 783.99]; // G4, C5, E5, G5
                freqs.forEach((freq, idx) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    
                    osc.type = 'sawtooth';
                    osc.frequency.value = freq;
                    
                    const now = ctx.currentTime;
                    gain.gain.setValueAtTime(0, now);
                    gain.gain.linearRampToValueAtTime(0.08, now + 0.08);
                    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
                    
                    osc.start();
                    osc.stop(now + 1.0);
                });
            }
        } catch (e) {
            console.warn("AudioContext no iniciado o bloqueado por política del navegador:", e);
        }
    }

    // ─── 2. Base de Datos Estática de Preguntas y Ahorcados (Fallback) ─────────────
    const TEMPLATES_JUEGOS = [
        {
            pregunta: "¿Qué herramientas utilizaron Lumi y Pixel para orientarse en este capítulo?",
            opciones: ["Un mapa mágico y la lectura", "Un teléfono celular", "Un silbato de madera"],
            correcta: 0,
            explicacion: "Lumi y Pixel usan el mapa mágico y la lectura atenta para encontrar el camino en sus aventuras.",
            ahorcadoPalabra: "MAPA",
            ahorcadoPista: "Es lo que Lumi y Pixel consultan para guiarse en el camino."
        },
        {
            pregunta: "¿Cómo superaron Lumi y Pixel el acertijo de esta sección?",
            opciones: ["Gritando muy fuerte", "Trabajando en equipo y pensando con paciencia", "Dándole dulces al guardián"],
            correcta: 1,
            explicacion: "La paciencia y el trabajo en equipo son las claves de Lumi y Pixel para resolver acertijos.",
            ahorcadoPalabra: "EQUIPO",
            ahorcadoPista: "Lo que forman Lumi y Pixel cuando colaboran para resolver un problema."
        },
        {
            pregunta: "¿Qué nos enseña la aventura de Lumi y Pixel en este capítulo?",
            opciones: ["Que leer nos da sabiduría para superar retos", "Que es mejor viajar solos", "Que las flores mágicas hablan"],
            correcta: 0,
            explicacion: "Leer nos ayuda a comprender mejor el mundo y a solucionar misterios con inteligencia.",
            ahorcadoPalabra: "LECTURA",
            ahorcadoPista: "La actividad favorita de Lumi que le ayuda a resolver misterios."
        },
        {
            pregunta: "¿Qué consiguieron Lumi y Pixel tras resolver el gran misterio?",
            opciones: ["Un cofre lleno de dulces", "Una valiosa pieza y un gran aprendizaje", "Una siesta bajo la lluvia"],
            correcta: 1,
            explicacion: "Cada reto superado les otorga una pieza mágica del rompecabezas y un valioso conocimiento.",
            ahorcadoPalabra: "APRENDER",
            ahorcadoPista: "Lo que Lumi y Pixel logran cada vez que leen una nueva historia."
        },
        {
            pregunta: "¿Quién es Pixel y cuál es su mayor cualidad en la historia?",
            opciones: ["Es un búho sabio que aporta inteligencia y conocimiento", "Es un zorrito travieso que corre rápido", "Es un árbol mágico que duerme mucho"],
            correcta: 0,
            explicacion: "Pixel es el sabio búho pixelado que acompaña a Lumi y le aconseja con su gran intelecto.",
            ahorcadoPalabra: "SABIDURIA",
            ahorcadoPista: "Lo que tiene Pixel y comparte con Lumi para superar los desafíos."
        }
    ];
    LUMIKIDS_JUEGOS.TEMPLATES_JUEGOS = TEMPLATES_JUEGOS;

    // Configuración de cuadrícula del rompecabezas según total de piezas
    const CONFIG_GRID_PUZZLE = {
        4: { cols: 2, rows: 2 },
        5: { cols: 3, rows: 2 },
        6: { cols: 3, rows: 2 },
        7: { cols: 4, rows: 2 },
        8: { cols: 4, rows: 2 }
    };

    // ─── 3. Iniciar el Flujo de Juego ──────────────────────────────────────────────
    LUMIKIDS_JUEGOS.iniciarJuego = function(mundo, libroId, capNum, totalCaps, d, callback) {
        LUMIKIDS_JUEGOS.overlay = document.getElementById('overlay-juegos');
        if (!LUMIKIDS_JUEGOS.overlay) return;

        LUMIKIDS_JUEGOS.callbackOnComplete = callback;

        // Cargar datos en el estado del juego
        LUMIKIDS_JUEGOS.estado.mundo = mundo;
        LUMIKIDS_JUEGOS.estado.libroId = libroId;
        LUMIKIDS_JUEGOS.estado.capNum = capNum;
        LUMIKIDS_JUEGOS.estado.totalCaps = totalCaps;
        LUMIKIDS_JUEGOS.estado.piezasTotal = d.piezasTotal || 4;

        // Calcular qué número de pieza corresponde a este desafío
        // Para i de 0 a (piezasTotal - 1), el capNum de desafío es Math.floor((i+1)*totalCaps/piezasTotal)
        let piezaIndexAsignada = 0;
        for (let i = 0; i < LUMIKIDS_JUEGOS.estado.piezasTotal; i++) {
            const capDesafio = Math.floor((i + 1) * totalCaps / LUMIKIDS_JUEGOS.estado.piezasTotal);
            if (capDesafio === capNum) {
                piezaIndexAsignada = i;
                break;
            }
        }
        LUMIKIDS_JUEGOS.estado.piezaIdx = piezaIndexAsignada;

        // Buscar datos específicos generados por la IA en este capítulo, si existen
        const capData = d.contenido && d.contenido[capNum - 1];
        if (capData && capData.preguntaComprension && capData.ahorcado) {
            LUMIKIDS_JUEGOS.estado.pregunta = capData.preguntaComprension;
            LUMIKIDS_JUEGOS.estado.ahorcado = capData.ahorcado;
        } else {
            // Cargar de las plantillas estáticas usando rotación basada en el capNum
            const tIdx = (capNum - 1) % TEMPLATES_JUEGOS.length;
            const template = TEMPLATES_JUEGOS[tIdx];
            LUMIKIDS_JUEGOS.estado.pregunta = {
                pregunta: template.pregunta,
                opciones: template.opciones,
                correcta: template.correcta,
                explicacion: template.explicacion
            };
            LUMIKIDS_JUEGOS.estado.ahorcado = {
                palabra: template.ahorcadoPalabra,
                pista: template.ahorcadoPista
            };
        }

        // Restablecer el estado
        LUMIKIDS_JUEGOS.estado.vidas = 6;
        LUMIKIDS_JUEGOS.estado.letrasAdivinadas = [];
        LUMIKIDS_JUEGOS.estado.pasoActual = 1;

        // Aplicar clase de tema de mundo para diseño personalizado
        LUMIKIDS_JUEGOS.overlay.setAttribute('data-mundo-tema', mundo);
        LUMIKIDS_JUEGOS.overlay.classList.remove('oculto');
        document.body.style.overflow = 'hidden'; // Bloquear scroll del fondo

        // Construir la tarjeta y renderizar Fase 1
        construirEstructuraBase(d);
        irAlPaso(1, d);
    };

    // Construir la tarjeta principal y añadirla al overlay
    function construirEstructuraBase(d) {
        LUMIKIDS_JUEGOS.overlay.innerHTML = `
            <div class="juegos-tarjeta" id="juegos-tarjeta">
                <!-- Barra de Progreso de Pasos -->
                <div class="juegos-pasos-barra">
                    <div class="juegos-pasos-linea"></div>
                    <div class="juegos-pasos-linea-progreso" id="pasos-progreso-linea"></div>
                    <div class="juegos-paso-nodo" id="paso-nodo-1" title="Comprensión">1</div>
                    <div class="juegos-paso-nodo" id="paso-nodo-2" title="Ahorcado">2</div>
                    <div class="juegos-paso-nodo" id="paso-nodo-3" title="Recompensa">3</div>
                    <div class="juegos-paso-nodo" id="paso-nodo-4" title="Rompecabezas">4</div>
                </div>

                <!-- Cabecera de Lumi -->
                <div class="juegos-cabecera-lumi">
                    <img src="imagenes/zorrito_saludando.png" class="juegos-avatar-lumi" id="lumi-avatar-juego" alt="Lumi" />
                    <div class="juegos-burbuja-lumi">
                        <strong>Lumi</strong>
                        <p id="lumi-texto-juego">¡Hola aventurero! Vamos a resolver el desafío para reconstruir este gran mundo mágico. 🌟</p>
                    </div>
                </div>

                <!-- Contenido Dinámico de cada Fase -->
                <div id="juegos-cuerpo" style="width: 100%;"></div>
            </div>
        `;
        LUMIKIDS_JUEGOS.tarjeta = document.getElementById('juegos-tarjeta');
        LUMIKIDS_JUEGOS.cuerpo = document.getElementById('juegos-cuerpo');
    }

    // Gestionar transiciones de barra de pasos e inyección de vistas
    function irAlPaso(pasoNum, d) {
        LUMIKIDS_JUEGOS.estado.pasoActual = pasoNum;
        
        // Actualizar barra de pasos
        const pct = ((pasoNum - 1) / 3) * 100;
        const linea = document.getElementById('pasos-progreso-linea');
        if (linea) linea.style.width = `${pct}%`;

        for (let i = 1; i <= 4; i++) {
            const nodo = document.getElementById(`paso-nodo-${i}`);
            if (!nodo) continue;
            nodo.classList.remove('activo', 'completado');
            if (i < pasoNum) {
                nodo.classList.add('completado');
            } else if (i === pasoNum) {
                nodo.classList.add('activo');
            }
        }

        // Renderizar cuerpo según paso
        if (pasoNum === 1) {
            renderFaseComprension(d);
        } else if (pasoNum === 2) {
            renderFaseAhorcado(d);
        } else if (pasoNum === 3) {
            renderFaseRecompensa(d);
        } else if (pasoNum === 4) {
            renderFaseRompecabezas(d);
        } else if (pasoNum === 5) {
            renderFaseCelebracionFinal(d);
        }
    }

    // Actualizar el diálogo que dice Lumi en la burbuja superior
    function actualizarDialogoLumi(texto, mood = 'saludando') {
        const p = document.querySelector('#lumi-texto-juego');
        if (p) p.textContent = texto;

        const img = document.querySelector('#lumi-avatar-juego');
        if (img) {
            // Si el proyecto tuviera otros avatares por pose se cambiaría aquí.
            // Para mantener consistencia con los recursos actuales usamos zorrito_saludando.png
            img.src = 'imagenes/zorrito_saludando.png';
        }
    }

    // ─── 4. FASE 1: Comprensión Lectoras ──────────────────────────────────────────
    function renderFaseComprension(d) {
        const q = LUMIKIDS_JUEGOS.estado.pregunta;
        actualizarDialogoLumi("¡Veamos cuánto recuerdas de este capítulo! Lee con atención la pregunta y elige la respuesta correcta. 🔍");

        LUMIKIDS_JUEGOS.cuerpo.innerHTML = `
            <div class="fase-comprension">
                <h3 class="comprension-pregunta">${q.pregunta}</h3>
                <div class="comprension-opciones">
                    ${q.opciones.map((opcion, idx) => `
                        <button class="opcion-btn" data-idx="${idx}">
                            <span class="opcion-badge">${String.fromCharCode(65 + idx)}</span>
                            <span>${opcion}</span>
                        </button>
                    `).join('')}
                </div>
                <div id="comprension-explicacion" class="explicacion-respuesta oculto"></div>
            </div>
        `;

        // Añadir eventos a botones de opción
        const botones = LUMIKIDS_JUEGOS.cuerpo.querySelectorAll('.opcion-btn');
        botones.forEach(btn => {
            btn.addEventListener('click', function() {
                const idxSelected = parseInt(this.getAttribute('data-idx'));
                verificarRespuestaComprension(idxSelected, botones, q, d);
            });
        });
    }

    function verificarRespuestaComprension(idxSelected, botones, q, d) {
        // Bloquear todos los botones
        botones.forEach(b => b.disabled = true);

        const explicacion = document.getElementById('comprension-explicacion');

        if (idxSelected === q.correcta) {
            playSound('success');
            botones[idxSelected].classList.add('correcta');
            actualizarDialogoLumi("¡Eso es totalmente correcto! ¡Tienes una memoria fantástica! 🌟 Siguiente desafío...", 'feliz');

            // Animación de éxito con GSAP en la tarjeta
            gsap.to(LUMIKIDS_JUEGOS.tarjeta, { scale: 1.03, duration: 0.15, yoyo: true, repeat: 1 });

            // Pasar a ahorcado en 2 segundos
            setTimeout(() => {
                irAlPaso(2, d);
            }, 2000);
        } else {
            playSound('error');
            botones[idxSelected].classList.add('incorrecta');
            botones[q.correcta].classList.add('correcta'); // Revelar la correcta
            actualizarDialogoLumi("¡Oh, estuviste cerca! Pero no te preocupes, de los errores se aprende. Inténtalo de nuevo. 🧭", 'triste');

            // Mostrar explicación
            if (explicacion) {
                explicacion.textContent = q.explicacion;
                explicacion.classList.remove('oculto');
            }

            // Animación de shake en la tarjeta
            LUMIKIDS_JUEGOS.tarjeta.classList.remove('shake-animation');
            void LUMIKIDS_JUEGOS.tarjeta.offsetWidth; // Forzar reflujo
            LUMIKIDS_JUEGOS.tarjeta.classList.add('shake-animation');

            // Botón de reintento
            const retryBtn = document.createElement('button');
            retryBtn.className = 'juegos-btn-principal';
            retryBtn.style.marginTop = '25px';
            retryBtn.innerHTML = `<span>Volver a intentar</span> <i class="bi bi-arrow-clockwise"></i>`;
            retryBtn.addEventListener('click', () => {
                irAlPaso(1, d);
            });
            LUMIKIDS_JUEGOS.cuerpo.querySelector('.fase-comprension').appendChild(retryBtn);
        }
    }

    // ─── 5. FASE 2: Juego del Ahorcado ───────────────────────────────────────────
    function renderFaseAhorcado(d) {
        const a = LUMIKIDS_JUEGOS.estado.ahorcado;
        LUMIKIDS_JUEGOS.estado.vidas = 6;
        LUMIKIDS_JUEGOS.estado.letrasAdivinadas = [];

        actualizarDialogoLumi("¡Descifra la palabra oculta para ganar la pieza mágica del rompecabezas! 🧩");

        LUMIKIDS_JUEGOS.cuerpo.innerHTML = `
            <div class="fase-ahorcado">
                <!-- Vidas representadas por corazones -->
                <div class="ahorcado-vidas" id="ahorcado-vidas-caja">
                    ${Array(6).fill('<i class="bi bi-heart-fill ahorcado-vida-corazon"></i>').join('')}
                </div>

                <!-- Caja de Pista -->
                <div class="ahorcado-pista-caja">
                    <strong>Pista:</strong> "${a.pista}"
                </div>

                <!-- Espacios de letras de la palabra -->
                <div class="ahorcado-palabra-caja" id="ahorcado-palabra-letras"></div>

                <!-- Teclado en pantalla (A-Z) -->
                <div class="ahorcado-teclado" id="ahorcado-teclado-letras"></div>
            </div>
        `;

        actualizarEspacioPalabras();
        construirTecladoAhorcado(d);
    }

    // Renderizar las rayitas _ _ _ de la palabra
    function actualizarEspacioPalabras() {
        const container = document.getElementById('ahorcado-palabra-letras');
        if (!container) return;

        const palabra = LUMIKIDS_JUEGOS.estado.ahorcado.palabra.toUpperCase();
        container.innerHTML = '';

        for (let letra of palabra) {
            const span = document.createElement('span');
            span.className = 'ahorcado-letra-espacio';
            
            // Si es un espacio o un carácter especial, revelarlo
            if (letra === ' ' || letra === '-' || letra === '_') {
                span.textContent = letra;
                span.style.borderBottom = 'none';
            } else if (LUMIKIDS_JUEGOS.estado.letrasAdivinadas.includes(letra)) {
                span.textContent = letra;
                span.classList.add('revelada');
            } else {
                span.textContent = '';
            }
            container.appendChild(span);
        }
    }

    // Construir los botones del teclado virtual
    function construirTecladoAhorcado(d) {
        const container = document.getElementById('ahorcado-teclado-letras');
        if (!container) return;

        const letras = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');
        container.innerHTML = '';

        letras.forEach(letra => {
            const btn = document.createElement('button');
            btn.className = 'teclado-letra-btn';
            btn.textContent = letra;
            
            btn.addEventListener('click', function() {
                this.disabled = true;
                procesarIntentoLetra(letra, this, d);
            });
            container.appendChild(btn);
        });
    }

    // Evaluar la letra clickeada
    function procesarIntentoLetra(letra, btn, d) {
        const palabra = LUMIKIDS_JUEGOS.estado.ahorcado.palabra.toUpperCase();

        if (palabra.includes(letra)) {
            playSound('success');
            btn.classList.add('correcto');
            LUMIKIDS_JUEGOS.estado.letrasAdivinadas.push(letra);
            actualizarEspacioPalabras();

            // Comprobar si se ha adivinado la palabra completa
            const letrasUnicas = Array.from(new Set(palabra.replace(/[^A-ZÑ]/g, '')));
            const ganaste = letrasUnicas.every(l => LUMIKIDS_JUEGOS.estado.letrasAdivinadas.includes(l));

            if (ganaste) {
                // Deshabilitar todo el teclado
                document.querySelectorAll('.teclado-letra-btn').forEach(b => b.disabled = true);
                actualizarDialogoLumi("¡Excelente! Adivinaste la palabra. ¡Hemos ganado una pieza mágica! 🏆", 'feliz');

                setTimeout(() => {
                    irAlPaso(3, d);
                }, 1500);
            }
        } else {
            playSound('error');
            btn.classList.add('incorrecto');
            LUMIKIDS_JUEGOS.estado.vidas--;

            // Actualizar corazones visuales
            const corazones = document.querySelectorAll('.ahorcado-vida-corazon');
            const indexCorazonPerdido = LUMIKIDS_JUEGOS.estado.vidas;
            if (corazones[indexCorazonPerdido]) {
                corazones[indexCorazonPerdido].classList.add('perdido');
            }

            if (LUMIKIDS_JUEGOS.estado.vidas <= 0) {
                // Perdió el juego
                document.querySelectorAll('.teclado-letra-btn').forEach(b => b.disabled = true);
                actualizarDialogoLumi(`¡Oh, no! Te quedaste sin intentos. La palabra era "${palabra}". ¡Vamos a intentarlo de nuevo! 🧭`, 'triste');

                // Mostrar botón de reintento en 1.5s
                setTimeout(() => {
                    const retryBtn = document.createElement('button');
                    retryBtn.className = 'juegos-btn-principal';
                    retryBtn.style.marginTop = '20px';
                    retryBtn.innerHTML = `<span>Reintentar Ahorcado</span> <i class="bi bi-arrow-clockwise"></i>`;
                    retryBtn.addEventListener('click', () => {
                        irAlPaso(2, d);
                    });
                    LUMIKIDS_JUEGOS.cuerpo.appendChild(retryBtn);
                }, 1000);
            }
        }
    }

    // ─── 6. FASE 3: Recompensa de Pieza ──────────────────────────────────────────
    function renderFaseRecompensa(d) {
        playSound('success');
        actualizarDialogoLumi("¡Guau, felicidades! Mira qué hermosa pieza hemos ganado. ¡Vamos a colocarla en el rompecabezas de esta aventura! 🧩✨");

        LUMIKIDS_JUEGOS.cuerpo.innerHTML = `
            <div class="fase-pieza-obtenida">
                <div class="pieza-contenedor-efecto">
                    <div class="pieza-destello-fondo"></div>
                    <div class="pieza-rompecabezas-visual" id="puzzle-recompensa-visual"></div>
                </div>
                <h3 class="juegos-mensaje-titulo">¡Nueva pieza conseguida!</h3>
                <p class="juegos-mensaje-subtitulo">Has ganado la pieza número ${LUMIKIDS_JUEGOS.estado.piezaIdx + 1} de la historia "${d.titulo}".</p>
                <button class="juegos-btn-principal" id="btn-ver-puzzle">
                    <span>Ver mi rompecabezas</span>
                    <i class="bi bi-puzzle-fill"></i>
                </button>
            </div>
        `;

        // Renderizar el recorte de la pieza en la previsualización
        recortarPiezaVisual(document.getElementById('puzzle-recompensa-visual'), LUMIKIDS_JUEGOS.estado.piezaIdx, d);

        // Confeti en canvas para celebración
        crearConfetiVisual();

        document.getElementById('btn-ver-puzzle').addEventListener('click', () => {
            irAlPaso(4, d);
        });
    }

    // Cortar el fondo de la imagen dinámicamente usando background-position y size
    function recortarPiezaVisual(element, idx, d) {
        if (!element) return;
        const P = LUMIKIDS_JUEGOS.estado.piezasTotal;
        const grid = CONFIG_GRID_PUZZLE[P] || CONFIG_GRID_PUZZLE[4];

        const cols = grid.cols;
        const rows = grid.rows;

        // Tamaño total de la imagen en el rompecabezas (usaremos un tamaño base de 300x400 para proporciones)
        const puzzleWidth = 300;
        const puzzleHeight = 400;

        const w = puzzleWidth / cols;
        const h = puzzleHeight / rows;

        const c = idx % cols;
        const r = Math.floor(idx / cols);

        const left = c * w;
        const top = r * h;

        element.style.backgroundImage = `url('${d.imagen}')`;
        element.style.backgroundSize = `${puzzleWidth}px ${puzzleHeight}px`;
        element.style.backgroundPosition = `-${left}px -${top}px`;
        element.style.width = `${w}px`;
        element.style.height = `${h}px`;
    }

    // ─── 7. FASE 4: El Rompecabezas (InteractJS) ──────────────────────────────────
    function renderFaseRompecabezas(d) {
        actualizarDialogoLumi("¡Arrastra y encaja la pieza en su lugar correspondiente del tablero! 🧩");

        const P = LUMIKIDS_JUEGOS.estado.piezasTotal;
        const grid = CONFIG_GRID_PUZZLE[P] || CONFIG_GRID_PUZZLE[4];
        const cols = grid.cols;
        const rows = grid.rows;

        const puzzleWidth = 300;
        const puzzleHeight = 400;
        const pieceW = puzzleWidth / cols;
        const pieceH = puzzleHeight / rows;

        LUMIKIDS_JUEGOS.cuerpo.innerHTML = `
            <div class="fase-rompecabezas">
                <!-- Tablero del Rompecabezas -->
                <div class="puzzle-contenedor-tablero" id="puzzle-board" style="width: ${puzzleWidth}px; height: ${puzzleHeight}px;">
                    <!-- Las ranuras vacías se generarán aquí -->
                </div>

                <!-- Bandeja de Piezas Disponibles para arrastrar -->
                <div class="puzzle-bandeja-piezas" id="puzzle-tray">
                    <!-- Si la pieza actual no se ha colocado, se renderiza aquí -->
                </div>

                <!-- Botón de continuación, oculto hasta encajar la pieza -->
                <button class="juegos-btn-principal oculto" id="btn-puzzle-continuar" style="margin-top: 15px;">
                    <span>Continuar lectura</span>
                    <i class="bi bi-arrow-right-circle"></i>
                </button>
            </div>
        `;

        const board = document.getElementById('puzzle-board');
        const tray = document.getElementById('puzzle-tray');

        // Cargar estado de piezas completadas desde localStorage
        const keyPuzzle = `lumikids_puzzle_${LUMIKIDS_JUEGOS.estado.libroId}`;
        let puzzleStatus = JSON.parse(localStorage.getItem(keyPuzzle)) || Array(P).fill(false);

        // 1. Generar las ranuras en el tablero
        for (let i = 0; i < P; i++) {
            const c = i % cols;
            const r = Math.floor(i / cols);
            const slot = document.createElement('div');
            slot.className = `puzzle-ranura-destino puzzle-ranura-${i} ${puzzleStatus[i] ? 'snapped' : 'vacia'}`;
            slot.style.width = `${pieceW}px`;
            slot.style.height = `${pieceH}px`;
            slot.style.left = `${c * pieceW}px`;
            slot.style.top = `${r * pieceH}px`;
            slot.dataset.pieceIdx = i;

            // Si ya estaba completada en el pasado, pintar la pieza directamente adentro
            if (puzzleStatus[i]) {
                const completedPiece = document.createElement('div');
                completedPiece.className = 'puzzle-pieza-drag snapped';
                recortarPiezaVisual(completedPiece, i, d);
                slot.appendChild(completedPiece);
            }

            board.appendChild(slot);
        }

        const currentIdx = LUMIKIDS_JUEGOS.estado.piezaIdx;

        // 2. Si la pieza ganada en este desafío NO ha sido colocada todavía en este tablero:
        if (!puzzleStatus[currentIdx]) {
            const pieceDrag = document.createElement('div');
            pieceDrag.className = 'puzzle-pieza-drag';
            pieceDrag.dataset.pieceIdx = currentIdx;
            recortarPiezaVisual(pieceDrag, currentIdx, d);
            tray.appendChild(pieceDrag);

            // Inicializar InteractJS
            configurarInteractJS(pieceDrag, currentIdx, d);
        } else {
            // Si ya estaba snapped por alguna razón previa, mostrar continuar directamente
            mostrarBotonContinuar(d);
        }
    }

    // Configurar el arrastre con InteractJS
    function configurarInteractJS(element, correctIdx, d) {
        interact(element).draggable({
            listeners: {
                start(event) {
                    event.target.classList.add('dragging');
                },
                move(event) {
                    const target = event.target;
                    const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                    const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

                    target.style.transform = `translate(${x}px, ${y}px) scale(1.08)`;
                    target.setAttribute('data-x', x);
                    target.setAttribute('data-y', y);
                },
                end(event) {
                    event.target.classList.remove('dragging');
                    verificarSnapRompecabezas(event.target, correctIdx, d);
                }
            }
        });
    }

    // Comprobar si la pieza fue arrastrada sobre su ranura correcta
    function verificarSnapRompecabezas(pieceEl, correctIdx, d) {
        const slotEl = document.querySelector(`.puzzle-ranura-${correctIdx}`);
        if (!slotEl) return;

        const pieceRect = pieceEl.getBoundingClientRect();
        const slotRect = slotEl.getBoundingClientRect();

        // Calcular distancia entre centros
        const pieceCenter = { x: pieceRect.left + pieceRect.width / 2, y: pieceRect.top + pieceRect.height / 2 };
        const slotCenter = { x: slotRect.left + slotRect.width / 2, y: slotRect.top + slotRect.height / 2 };

        const dist = Math.hypot(pieceCenter.x - slotCenter.x, pieceCenter.y - slotCenter.y);

        // Umbral de acople: 40 píxeles
        if (dist < 40) {
            // Acoplada con éxito
            playSound('success');
            
            // Remover interact
            interact(pieceEl).unset();

            // Colocar físicamente dentro del slot de destino
            pieceEl.style.transform = 'none';
            pieceEl.style.position = 'absolute';
            pieceEl.style.left = '0';
            pieceEl.style.top = '0';
            pieceEl.classList.add('snapped');
            pieceEl.removeAttribute('data-x');
            pieceEl.removeAttribute('data-y');
            
            slotEl.innerHTML = '';
            slotEl.appendChild(pieceEl);
            slotEl.classList.remove('vacia');
            slotEl.classList.add('snapped');

            // Guardar en localStorage
            const P = LUMIKIDS_JUEGOS.estado.piezasTotal;
            const keyPuzzle = `lumikids_puzzle_${LUMIKIDS_JUEGOS.estado.libroId}`;
            let puzzleStatus = JSON.parse(localStorage.getItem(keyPuzzle)) || Array(P).fill(false);
            puzzleStatus[correctIdx] = true;
            localStorage.setItem(keyPuzzle, JSON.stringify(puzzleStatus));

            // Animación flash y confeti local con GSAP
            gsap.fromTo(pieceEl, { filter: 'brightness(2)' }, { filter: 'brightness(1)', duration: 0.5 });
            crearConfetiVisual();

            actualizarDialogoLumi("¡Excelente! La pieza ha encajado perfectamente en el rompecabezas. 🧩⭐");

            // Comprobar si completó TODO el rompecabezas
            const todoCompletado = puzzleStatus.every(status => status === true);

            if (todoCompletado) {
                // Ir a la Fase 5: Celebración final del libro completado
                setTimeout(() => {
                    irAlPaso(5, d);
                }, 1500);
            } else {
                // Mostrar botón de continuar lectura normal
                mostrarBotonContinuar(d);
            }
        } else {
            // No encajó, regresar a la bandeja con suavidad mediante GSAP
            playSound('error');
            gsap.to(pieceEl, {
                x: 0,
                y: 0,
                scale: 1,
                duration: 0.3,
                onComplete: () => {
                    pieceEl.style.transform = 'none';
                    pieceEl.removeAttribute('data-x');
                    pieceEl.removeAttribute('data-y');
                }
            });
        }
    }

    function mostrarBotonContinuar(d) {
        const btn = document.getElementById('btn-puzzle-continuar');
        if (btn) {
            btn.classList.remove('oculto');
            btn.addEventListener('click', () => {
                // Salvar que resolvió este desafío de capítulo en el localStorage para persistir
                localStorage.setItem(`lumikids_challenge_solved_${LUMIKIDS_JUEGOS.estado.libroId}_${LUMIKIDS_JUEGOS.estado.capNum}`, 'true');

                // Guardar también cuántas piezas ha recolectado del libro para sincronizar la barra de progreso del libro
                const keyPuzzle = `lumikids_puzzle_${LUMIKIDS_JUEGOS.estado.libroId}`;
                const puzzleStatus = JSON.parse(localStorage.getItem(keyPuzzle)) || [];
                const ganadas = puzzleStatus.filter(Boolean).length;
                
                // Actualizar piezas ganadas en caché en memoria y localStorage para el libro actual
                const cachedBook = localStorage.getItem(`lumikids_story_cache_v2_${LUMIKIDS_JUEGOS.estado.libroId}`);
                if (cachedBook) {
                    try {
                        const parsed = JSON.parse(cachedBook);
                        parsed.piezasObtenidas = ganadas;
                        localStorage.setItem(`lumikids_story_cache_v2_${LUMIKIDS_JUEGOS.estado.libroId}`, JSON.stringify(parsed));
                    } catch (e) {}
                }

                cerrarOverlayJuegos();
                if (LUMIKIDS_JUEGOS.callbackOnComplete) {
                    LUMIKIDS_JUEGOS.callbackOnComplete();
                }
            });
        }
    }

    // ─── 8. FASE 5: Celebración Final (Historia Completada) ────────────────────────
    function renderFaseCelebracionFinal(d) {
        playSound('complete');
        actualizarDialogoLumi("¡INCREÍBLE! ¡Has colocado todas las piezas y completado la imagen del rompecabezas! Lumi y Pixel están súper orgullosos de tu lectura. 🏆🌟🎉");

        LUMIKIDS_JUEGOS.cuerpo.innerHTML = `
            <div class="fase-celebracion">
                <!-- Imagen de Portada con marco brillante -->
                <div class="celebracion-imagen-revelada" id="celebracion-img"></div>

                <h3 class="juegos-mensaje-titulo" style="color: #ffd700;">¡Rompecabezas Completado!</h3>
                <p class="juegos-mensaje-subtitulo">Has leído, respondido preguntas y descifrado las palabras mágicas de la aventura: <strong>"${d.titulo}"</strong>.</p>

                <!-- Bloque de Premios -->
                <div class="celebracion-premios-bloque">
                    <div class="premio-item">
                        <span class="premio-icono">⭐</span>
                        <span class="premio-label">Estrella</span>
                        <span class="premio-valor oro">Dorada</span>
                    </div>
                    <div class="premio-item">
                        <span class="premio-icono">🏅</span>
                        <span class="premio-label">Insignia</span>
                        <span class="premio-valor" style="color: #4ade80;">Lector Pro</span>
                    </div>
                    <div class="premio-item">
                        <span class="premio-icono">✨</span>
                        <span class="premio-label">Experiencia</span>
                        <span class="premio-valor" style="color: #60a5fa;">+100 XP</span>
                    </div>
                </div>

                <button class="juegos-btn-principal" id="btn-finalizar-celebracion">
                    <span>Finalizar Aventura</span>
                    <i class="bi bi-trophy-fill"></i>
                </button>
            </div>
        `;

        const img = document.getElementById('celebracion-img');
        if (img) img.style.backgroundImage = `url('${d.imagen}')`;

        // Confeti constante
        crearConfetiVisual(150);

        document.getElementById('btn-finalizar-celebracion').addEventListener('click', () => {
            // 1. Guardar libro como completado en localStorage
            localStorage.setItem(`lumikids_completed_${LUMIKIDS_JUEGOS.estado.libroId}`, 'true');
            localStorage.setItem(`lumikids_challenge_solved_${LUMIKIDS_JUEGOS.estado.libroId}_${LUMIKIDS_JUEGOS.estado.capNum}`, 'true');

            // Sincronizar piezas completas
            const cachedBook = localStorage.getItem(`lumikids_story_cache_v2_${LUMIKIDS_JUEGOS.estado.libroId}`);
            if (cachedBook) {
                try {
                    const parsed = JSON.parse(cachedBook);
                    parsed.piezasObtenidas = LUMIKIDS_JUEGOS.estado.piezasTotal;
                    localStorage.setItem(`lumikids_story_cache_v2_${LUMIKIDS_JUEGOS.estado.libroId}`, JSON.stringify(parsed));
                } catch (e) {}
            }

            // 2. Mostrar alerta de SweetAlert2 anunciando desbloqueo automático
            Swal.fire({
                title: '¡Aventura Completada!',
                text: '¡Has ganado las estrellas mágicas y desbloqueado la siguiente historia!',
                icon: 'success',
                confirmButtonText: '¡Excelente!',
                confirmButtonColor: '#6366f1',
                background: '#1e293b',
                color: '#fff'
            }).then(() => {
                // 3. Disparar el evento global para actualizar la biblioteca en el fondo
                window.dispatchEvent(new CustomEvent('libroCompletado', { detail: { libroId: LUMIKIDS_JUEGOS.estado.libroId } }));

                cerrarOverlayJuegos();
                
                // Ejecutar el callback final para cerrar el libro
                if (LUMIKIDS_JUEGOS.callbackOnComplete) {
                    LUMIKIDS_JUEGOS.callbackOnComplete(true); // Pasar true para indicar que el libro se completó totalmente
                }
            });
        });
    }

    // ─── 9. Cerrar Overlay de Juegos ──────────────────────────────────────────────
    function cerrarOverlayJuegos() {
        if (LUMIKIDS_JUEGOS.overlay) {
            LUMIKIDS_JUEGOS.overlay.classList.add('oculto');
            LUMIKIDS_JUEGOS.overlay.innerHTML = '';
        }
        document.body.style.overflow = ''; // Devolver scroll al fondo
    }

    // ─── 10. Generar Confeti usando Canvas de Confeti temporal ─────────────────────
    function crearConfetiVisual(cantidad = 80) {
        // Creamos un canvas temporal para el confeti
        const canvas = document.createElement('canvas');
        canvas.className = 'canvas-confeti';
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '999';

        LUMIKIDS_JUEGOS.tarjeta.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        let width = canvas.width = canvas.offsetWidth;
        let height = canvas.height = canvas.offsetHeight;

        window.addEventListener('resize', () => {
            if (!canvas.parentElement) return;
            width = canvas.width = canvas.offsetWidth;
            height = canvas.height = canvas.offsetHeight;
        });

        const particles = [];
        const colors = ['#6366f1', '#a855f7', '#2db34a', '#f4791f', '#ffd700', '#ff007f', '#00f0ff'];

        for (let i = 0; i < cantidad; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * -100 - 10,
                size: Math.random() * 6 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                speedX: Math.random() * 3 - 1.5,
                speedY: Math.random() * 4 + 2,
                rotation: Math.random() * 360,
                rotationSpeed: Math.random() * 4 - 2
            });
        }

        let animationFrameId;

        function animateConfeti() {
            ctx.clearRect(0, 0, width, height);
            let active = false;

            particles.forEach(p => {
                p.y += p.speedY;
                p.x += p.speedX;
                p.rotation += p.rotationSpeed;

                if (p.y < height) {
                    active = true;
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate((p.rotation * Math.PI) / 180);
                    ctx.fillStyle = p.color;
                    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                    ctx.restore();
                }
            });

            if (active) {
                animationFrameId = requestAnimationFrame(animateConfeti);
            } else {
                canvas.remove();
            }
        }

        animateConfeti();

        // Cancelar animación si se destruye el contenedor principal
        setTimeout(() => {
            cancelAnimationFrame(animationFrameId);
            canvas.remove();
        }, 6000);
    }

    // Exponer el namespace en el window
    window.LUMIKIDS_JUEGOS = LUMIKIDS_JUEGOS;

})();
