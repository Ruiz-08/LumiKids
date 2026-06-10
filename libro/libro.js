/* ============================================================
   LIBRO MÁGICO — St.PageFlip Integration — libro.js
   Dynamic page generation & tailored reading complexity
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    const overlay    = document.getElementById('overlay-libro');
    if (!overlay) return;

    const flipbookEl = document.getElementById('libro-flipbook');
    const btnVolver  = document.getElementById('btn-volver-aventuras');
    const btnFinal   = document.getElementById('btn-finalizar-historia');
    const btnAbrirPortada = document.getElementById('cover-btn-abrir');
    const btnFlotAnt = document.getElementById('btn-flotante-anterior');
    const btnFlotSig = document.getElementById('btn-flotante-siguiente');
    const indicador  = document.getElementById('capitulo-indicador');
    const barraProgCap = document.getElementById('progreso-capitulo');
    const estrellasBar = document.getElementById('progreso-estrellas-bar');

    // ─── Configuración de mundos (Páginas, Capítulos y Complejidad) ───
    const CONFIG_MUNDOS_LIBRO = {
        bosque: {
            paginasTotales: 20,
            numCapitulos: 8, // (8 capítulos * 2 páginas/sección) + 4 páginas (portada, intro, final, contraportada) = 20
            dificultad: 'Muy Fácil',
            indicacionesPrompt: "Dificultad: MUY FÁCIL. La redacción debe ser extremadamente sencilla, con un tono dulce, mágico y motivador. Frases cortas y directas, estructura lineal simple, sin oraciones subordinadas complejas. Vocabulario básico y amigable para niños que están empezando a leer (5-6 años). Cada párrafo narrativo debe constar estrictamente de 2 o máximo 3 líneas muy cortas de texto. El objetivo central es motivar el hábito de lectura a través del entusiasmo, la magia y el juego."
        },
        pirata: {
            paginasTotales: 30,
            numCapitulos: 13, // 13 capítulos * 2 + 4 = 30 páginas
            dificultad: 'Fácil',
            indicacionesPrompt: "Dificultad: FÁCIL. La redacción debe ser emocionante y aventurera, estimulando la curiosidad y la lectura fluida. Introduce oraciones compuestas muy sencillas y un vocabulario pirata básico y divertido (isla, mapa, brújula, tesoro, olas, viento). Cada párrafo narrativo debe constar estrictamente de 3 a 4 líneas de longitud media. El texto debe incluir pequeñas preguntas retóricas sutiles para invitar al niño a pensar sobre la historia y fomentar la comprensión lectora."
        },
        letras: {
            paginasTotales: 40,
            numCapitulos: 18, // 18 capítulos * 2 + 4 = 40 páginas
            dificultad: 'Intermedia',
            indicacionesPrompt: "Dificultad: INTERMEDIA. La redacción debe ser rica en descripciones imaginativas, espaciales y de exploración de misterios. Introduce oraciones más elaboradas y de estructura variada. El vocabulario debe ser más amplio e incorporar palabras educativas y de ciencia/fantasía básica (gravedad, nebulosa, constelación, satélite, órbita) explicadas en el contexto de manera sencilla y clara. Cada párrafo narrativo debe tener estrictamente entre 4 y 5 líneas de longitud, estimulando la concentración sostenida y el gusto por descubrir palabras nuevas."
        },
        dragones: {
            paginasTotales: 50,
            numCapitulos: 23, // 23 capítulos * 2 + 4 = 50 páginas
            dificultad: 'Avanzada',
            indicacionesPrompt: "Dificultad: AVANZADA. La redacción debe ser de estilo fantástico y épico, con descripciones detalladas de paisajes y criaturas. Se deben emplear oraciones más complejas, cláusulas subordinadas y figuras literarias simples (símiles, metáforas sencillas). Cada párrafo narrativo debe tener una longitud de 5 a 7 líneas, desafiando gradualmente al lector a asimilar textos más largos y estructurados sin perder la fluidez. El foco es afianzar el hábito de lectura mediante la inmersión profunda en la trama."
        },
        ciudad: {
            paginasTotales: 60,
            numCapitulos: 28, // 28 capítulos * 2 + 4 = 60 páginas
            dificultad: 'Experta',
            indicacionesPrompt: "Dificultad: EXPERTA. La redacción debe ser literaria, elegante y sofisticada, utilizando descripciones minuciosas de arquitectura histórica y misterios antiguos de la civilización perdida. Emplea un vocabulario enriquecido con sinónimos precisos y términos abstractos relativos a la sabiduría y el conocimiento (escriba, obelisco, vestigio, ancestral, enigma, esfinge). Cada párrafo narrativo debe tener una longitud de 6 a 8 líneas complejas. La historia debe abordar o sugerir temas sobre el valor de los libros, la lectura y el aprendizaje constante, coronando el hábito de lectura independiente."
        }
    };

    // Caché dinámica de contenidos generados por la IA de Gemini para los libros
    const datosHistorias = {};

    // ─── Estado global ────────────────────────────────────────────────────────
    let flipBook    = null;
    let mundoActual = 'bosque';

    // ─── Inicializar St.PageFlip ──────────────────────────────────────────────
    function initFlipBook() {
        if (!flipbookEl) return;

        // Calcular dimensiones responsivas
        const { w, h } = calcularDimensiones();

        try {
            flipBook = new St.PageFlip(flipbookEl, {
                width:  w,
                height: h,
                size: 'fixed',
                minWidth:  200,
                maxWidth:  550,
                minHeight: 300,
                maxHeight: 750,
                drawShadow: true,
                flippingTime: 850,
                usePortrait: false,
                startZIndex: 0,
                autoSize: false,
                maxShadowOpacity: 0.5,
                showCover: true,
                mobileScrollSupport: false,
                swipeDistance: 30,
                clickEventForward: true,
                useMouseEvents: true,
                renderOnlyPageLengthChange: false,
                startPage: 0
            });

            // Cargar todas las páginas del DOM dinámico recién creado
            flipBook.loadFromHTML(flipbookEl.querySelectorAll('.pagina-libro-flip'));

            // Escuchar eventos de cambio de página
            flipBook.on('flip', (e) => {
                actualizarNavegacion(e.data);
            });

            flipBook.on('changeState', () => {
                actualizarNavegacion(flipBook.getCurrentPageIndex());
            });

        } catch (err) {
            console.error('Error iniciando PageFlip:', err);
        }
    }

    // ─── Calcular dimensiones del libro en función de la pantalla ─────────────
    function calcularDimensiones() {
        const maxW = Math.min(window.innerWidth  * 0.44, 520);
        const maxH = Math.min(window.innerHeight * 0.72, 680);
        const ratio = 0.72; // Proporción ~3:4
        const h = Math.min(maxH, maxW / ratio);
        const w = Math.min(maxW, h  * ratio);
        return { w: Math.floor(w), h: Math.floor(h) };
    }

    // ─── Ajustar tamaño del libro al cambiar el viewport ─────────────────────
    function ajustarTamanio() {
        if (!flipBook) return;
        try { flipBook.update(); } catch (_) {}
    }

    window.addEventListener('resize', ajustarTamanio);

    // ─── Cargar datos de la historia y reconstruir el DOM dinámicamente ──────
    function cargarHistoriaEnDOM(libroId) {
        const d = datosHistorias[libroId];
        if (!d) return;

        // 1. Destruir flipbook anterior si existe para evitar duplicados y liberar memoria
        if (flipBook) {
            try {
                flipBook.destroy();
            } catch (e) {
                console.error("Error destruyendo flipbook anterior:", e);
            }
            flipBook = null;
        }

        // 2. Limpiar el contenedor del flipbook
        if (flipbookEl) {
            flipbookEl.innerHTML = '';
        }

        // 3. Crear Portada (Página 0 - Tapa dura)
        const frontCover = document.createElement('div');
        frontCover.className = 'pagina-libro-flip cover-front';
        frontCover.dataset.density = 'hard';
        frontCover.innerHTML = `
            <div class="cover-decoracion-borde">
                <span class="cover-estrella-dec dec-tl">✦</span>
                <span class="cover-estrella-dec dec-tr">✦</span>
                <span class="cover-estrella-dec dec-bl">✦</span>
                <span class="cover-estrella-dec dec-br">✦</span>
                <div class="cover-titulo-contenedor">
                    <span class="cover-badge-mundo"><span>${d.emojis}</span> ${d.mundo}</span>
                    <h1 class="cover-titulo">${d.titulo}</h1>
                    <div class="cover-divisor"></div>
                </div>
                <div class="cover-ilustracion">
                    <img src="${d.imagen}" alt="Ilustración Portada">
                </div>
                <button class="cover-btn-abrir" id="cover-btn-abrir-dinamico">
                    <span>Abrir Libro Mágico</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="20" height="20"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z"/></svg>
                </button>
            </div>
        `;
        flipbookEl.appendChild(frontCover);

        // Vincular clic del botón de portada
        setTimeout(() => {
            const btn = document.getElementById('cover-btn-abrir-dinamico');
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (flipBook) flipBook.flip(1);
                });
            }
        }, 80);

        // Función auxiliar para generar el HTML de la página de estadísticas
        function generarHTMLPaginaStats(d) {
            return `
                <div class="pagina-contenido">
                    <div class="pagina-header">
                        <span class="pagina-estrella">⭐</span>
                        <div class="pagina-mundo-badge"><span>${d.emojis}</span> ${d.mundo}</div>
                    </div>
                    <h2 class="pagina-titulo-historia">${d.titulo}</h2>
                    <div class="pagina-ilustracion-principal">
                        <img src="${d.imagen}" alt="Ilustración Principal">
                    </div>
                    <div class="pagina-info-historia">
                        <ul class="info-lista">
                            <li><span class="info-icono">🌍</span> Mundo: <strong>${d.mundo}</strong></li>
                            <li><span class="info-icono">⭐</span> Dificultad: <strong>${d.dificultad}</strong></li>
                            <li><span class="info-icono">📖</span> Secciones: <strong>${d.contenido.length}</strong></li>
                            <li><span class="info-icono">🧩</span> Piezas: <strong>${d.piezasTotal}</strong></li>
                        </ul>
                    </div>
                    <div class="pagina-footer-stats">
                        <div class="pagina-rompecabezas">
                            <span class="rompecabezas-label">Rompecabezas</span>
                            <div class="rompecabezas-preview">🧩</div>
                        </div>
                        <div class="pagina-progreso">
                            <span class="progreso-label">Piezas obtenidas:</span>
                            <span class="progreso-numero">${d.piezasObtenidas}/${d.piezasTotal}</span>
                            <div class="progreso-barra">
                                <div class="progreso-barra-relleno" style="width: ${(d.piezasObtenidas / d.piezasTotal) * 100}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // 4. Crear páginas de cada sección (Izquierda: Stats / Derecha: Contenido de la Sección)
        d.contenido.forEach((cap, index) => {
            const capNum = index + 1;
            
            // Página de Estadísticas (Izquierda)
            const statsPage = document.createElement('div');
            statsPage.className = 'pagina-libro-flip pagina-intro';
            statsPage.dataset.density = 'soft';
            statsPage.innerHTML = generarHTMLPaginaStats(d);
            flipbookEl.appendChild(statsPage);

            // Página de Contenido (Derecha): Título del capítulo, Imagen, Texto y Diálogo
            const rightPage = document.createElement('div');
            rightPage.className = 'pagina-libro-flip';
            rightPage.dataset.density = 'soft';
            rightPage.innerHTML = `
                <div class="pagina-contenido">
                    <div class="capitulo-header">
                        <span class="capitulo-badge">Sección ${capNum} de ${d.contenido.length}</span>
                    </div>
                    <h3 class="capitulo-titulo">${cap.tituloCapitulo}</h3>
                    <div class="capitulo-ilustracion">
                        <img src="${d.imagen}" alt="Ilustración Sección ${capNum}">
                    </div>
                    <div class="capitulo-texto">${cap.texto}</div>
                    <div class="capitulo-dialogo">
                        <div class="dialogo-avatar"><img src="imagenes/zorrito_saludando.png" alt="Lumi"></div>
                        <div class="dialogo-burbuja">
                            <strong class="dialogo-nombre">${cap.dialogo.nombre}</strong>
                            <p>${cap.dialogo.texto}</p>
                        </div>
                    </div>
                </div>
            `;
            flipbookEl.appendChild(rightPage);
        });

        // 5. Crear Página Final del Epílogo (Página N-2: Izquierda Stats / Derecha Epílogo)
        const statsFinalPage = document.createElement('div');
        statsFinalPage.className = 'pagina-libro-flip pagina-intro';
        statsFinalPage.dataset.density = 'soft';
        statsFinalPage.innerHTML = generarHTMLPaginaStats(d);
        flipbookEl.appendChild(statsFinalPage);

        const epiloguePage = document.createElement('div');
        epiloguePage.className = 'pagina-libro-flip pagina-final';
        epiloguePage.dataset.density = 'soft';
        
        let estrellasHTML = '';
        for (let i = 0; i < d.piezasTotal; i++) {
            estrellasHTML += i < d.piezasObtenidas ? '⭐' : '☆';
        }
        
        epiloguePage.innerHTML = `
            <div class="pagina-contenido">
                <div class="final-decoracion">🏆</div>
                <h2 class="final-titulo">¡Felicidades!</h2>
                <div class="final-mensaje">
                    <p>Has completado con éxito la historia de este mundo mágico con Lumi y Pixel.</p>
                    <p>Sigue explorando otros mundos para encontrar nuevas piezas mágicas y potenciar tu hábito de lectura.</p>
                </div>
                <div class="final-rompecabezas-completo">
                    <span>Rompecabezas Completado:</span>
                    <div class="recompensa-estrellas">${estrellasHTML}</div>
                </div>
                <button class="final-btn-cerrar" id="btn-finalizar-historia-dinamico">
                    <span>Finalizar Aventura</span>
                </button>
            </div>
        `;
        flipbookEl.appendChild(epiloguePage);

        // Vincular evento del botón de finalizar aventura
        setTimeout(() => {
            const btn = document.getElementById('btn-finalizar-historia-dinamico');
            if (btn) {
                btn.addEventListener('click', () => {
                    if (mundoActual) {
                        localStorage.setItem(`lumikids_completed_${mundoActual}`, 'true');
                        window.dispatchEvent(new CustomEvent('libroCompletado', { detail: { libroId: mundoActual } }));
                    }
                    cerrarLibro();
                });
            }
        }, 80);

        // 6. Crear Contraportada (Página N-1 - Tapa dura)
        const backCover = document.createElement('div');
        backCover.className = 'pagina-libro-flip cover-back';
        backCover.dataset.density = 'hard';
        backCover.innerHTML = `
            <div class="cover-back-diseno">
                <div class="cover-back-emblema">LUMIKIDS</div>
                <p>Libros Mágicos Interactivos</p>
            </div>
        `;
        flipbookEl.appendChild(backCover);

        // Establecer el fondo del overlay
        const fondo = document.getElementById('libro-fondo-magico');
        if (fondo) fondo.style.backgroundImage = `url('${d.imagen}')`;

        // 8. Inicializar la biblioteca PageFlip con el nuevo árbol HTML
        initFlipBook();

        // 9. Forzar navegación inicial al inicio del libro
        if (flipBook) {
            try { flipBook.turnToPage(0); } catch (_) {}
            actualizarNavegacion(0);
        }
    }

    // ─── Actualizar indicadores inferiores dinámicamente ─────────────────────
    function actualizarNavegacion(pageIdx) {
        if (pageIdx === undefined || pageIdx === null || !mundoActual) return;

        const d = datosHistorias[mundoActual];
        if (!d) return;

        const totalPages = d.paginasTotales;
        const totalCaps = d.capitulos;

        // 1. Indicador de texto superior/inferior
        let label = 'Portada';
        if (pageIdx === 0) {
            label = 'Portada';
        } else if (pageIdx >= 1 && pageIdx <= totalPages - 3) {
            label = `Sección ${Math.ceil(pageIdx / 2)} de ${totalCaps}`;
        } else if (pageIdx >= totalPages - 2) {
            label = '¡Fin! 🎉';
        }
        if (indicador) indicador.textContent = label;

        // 2. Barra de progreso lineal (0 – 100%)
        const porcentaje = Math.min(((pageIdx) / (totalPages - 1)) * 100, 100);
        if (barraProgCap) barraProgCap.style.width = `${porcentaje}%`;

        // 3. Estrellas de secciones en el pie del libro (agrupadas si son muchas)
        if (estrellasBar) {
            estrellasBar.innerHTML = '';
            const capActivo = pageIdx < 1 ? 0 : Math.ceil(pageIdx / 2);
            
            // Si el número de capítulos es superior a 8, mostramos un resumen de 5 estrellas para evitar romper la UI
            const step = totalCaps > 8 ? Math.ceil(totalCaps / 5) : 1;
            const numIndicators = totalCaps > 8 ? 5 : totalCaps;
            
            for (let i = 1; i <= numIndicators; i++) {
                const checkedCap = totalCaps > 8 ? i * step : i;
                const span = document.createElement('span');
                span.className = `estrella-cap${checkedCap <= capActivo ? ' activa' : ''}`;
                span.textContent = checkedCap <= capActivo ? '⭐' : '☆';
                estrellasBar.appendChild(span);
            }
        }

        // 4. Visibilidad de las flechas flotantes laterales
        if (btnFlotAnt) btnFlotAnt.style.opacity = pageIdx <= 0 ? '0' : '1';
        if (btnFlotSig) btnFlotSig.style.opacity = pageIdx >= totalPages - 1 ? '0' : '1';
    }

    // ─── Botones flotantes laterales ──────────────────────────────────────────
    btnFlotAnt?.addEventListener('click', () => {
        if (flipBook) flipBook.flipPrev();
    });

    btnFlotSig?.addEventListener('click', () => {
        if (flipBook) flipBook.flipNext();
    });

    // ─── Botón Volver en la barra superior ───────────────────────────────────
    btnVolver?.addEventListener('click', () => cerrarLibro());

    // API KEY de Gemini
    const GEMINI_API_KEY = 'AQ.Ab8RN6JH5iVKxopMRgUu-4lVlH9TFI0s3nZXOUTOn09dmCxIoA';

    // Generar historia con IA de Gemini adaptada dinámicamente al mundo
    async function generarHistoriaConAI(mundo, libroId) {
        const loader = document.getElementById('libro-cargando');
        if (loader) loader.classList.remove('oculto');

        const mundoData = window.LUMIKIDS_BIBLIOTECA[mundo];
        const config = CONFIG_MUNDOS_LIBRO[mundo] || CONFIG_MUNDOS_LIBRO.bosque;

        const libroData = mundoData?.libros.find(l => l.id === libroId) || {
            titulo: 'El Tesoro del Bosque',
            imagen: 'imagenes/bosque.png',
            piezas: 4
        };

        const base = {
            mundo: mundoData?.mundo || 'Mundo Mágico',
            emojis: mundoData?.emojis || '✨',
            dificultad: config.dificultad,
            imagen: libroData.imagen,
            titulo: libroData.titulo,
            piezasTotal: libroData.piezas
        };

        // 1. Intentar cargar desde el caché en memoria o desde localStorage para persistir historias únicas
        if (datosHistorias[libroId]) {
            cargarHistoriaEnDOM(libroId);
            if (loader) loader.classList.add('oculto');
            return;
        }

        const cachedStory = localStorage.getItem(`lumikids_story_cache_v2_${libroId}`);
        if (cachedStory) {
            try {
                datosHistorias[libroId] = JSON.parse(cachedStory);
                cargarHistoriaEnDOM(libroId);
                if (loader) loader.classList.add('oculto');
                return;
            } catch (e) {
                console.warn("Error parseando la historia guardada, se regenerará:", e);
            }
        }

        const prompt = `Crea una historia infantil educativa y mágica titulada "${base.titulo}" dividida en exactamente ${config.numCapitulos} secciones/capítulos sobre el mundo "${base.mundo}" (representado por el emoji ${base.emojis}).
La historia tiene como protagonistas a "Lumi" (un simpático zorrito aventurero) y su ayudante "Pixel" (un sabio búho pixelado).

INSTRUCCIONES CRÍTICAS DE REDACCIÓN Y COMPLEJIDAD LECTORA:
1. Sigue al pie de la letra estas directrices de estilo para esta isla:
${config.indicacionesPrompt}
2. La historia debe estar directamente inspirada y centrada en el título del libro: "${base.titulo}". Toda la trama, retos y descubrimientos deben girar en torno a este concepto del título para que el libro sea verdaderamente único y temático.
3. Asegúrate de que el estilo de escritura sea infantil pero literariamente pulido y cautivador, con una narrativa fluida que mantenga el interés del lector y promueva el amor y el hábito por la lectura.
4. Cada sección/capítulo debe continuar la trama del anterior de manera natural, formando una aventura completa y con sentido de inicio a fin.
5. Los diálogos deben ser breves, expresivos, interactivos y con emojis acordes al tema.

Cada sección/capítulo debe tener exactamente:
- Un título de capítulo corto con emojis.
- Un texto narrativo (con etiquetas HTML <p>...</p>).
- Un diálogo corto de una frase expresada por "Lumi" relacionado con lo que ocurre en el capítulo.

Debes responder ÚNICAMENTE en formato JSON con la siguiente estructura, sin bloques de código markdown, sin \`\`\`json ni texto adicional:
{
  "titulo": "Título de la Historia",
  "dificultad": "${config.dificultad}",
  "contenido": [
    {
      "tituloCapitulo": "Título de la sección con emojis",
      "texto": "Texto narrativo en HTML con <p>...</p>",
      "dialogo": {
        "nombre": "Lumi",
        "texto": "Diálogo corto de Lumi con emojis"
      }
    }
  ]
}`;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`Error en API de Gemini: ${response.status}`);
            }

            const resData = await response.json();
            let rawText = resData.candidates[0].content.parts[0].text;
            
            rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
            const storyJson = JSON.parse(rawText);

            datosHistorias[libroId] = {
                mundo: base.mundo,
                emojis: base.emojis,
                titulo: storyJson.titulo || base.titulo,
                dificultad: storyJson.dificultad || base.dificultad,
                capitulos: config.numCapitulos,
                paginasTotales: config.paginasTotales,
                piezasTotal: base.piezasTotal,
                piezasObtenidas: base.piezasTotal,
                imagen: base.imagen,
                contenido: storyJson.contenido
            };

            // Persistir la historia en localStorage para que el libro sea único y permanente
            localStorage.setItem(`lumikids_story_cache_v2_${libroId}`, JSON.stringify(datosHistorias[libroId]));

            cargarHistoriaEnDOM(libroId);

        } catch (error) {
            console.error('Error generando historia con IA, aplicando fallback robusto:', error);
            
            // Generar contenido de fallback dinámico con el número exacto de capítulos configurado (Inicio, Nudo y Desenlace)
            const contenidoFallback = [];
            const N = config.numCapitulos;
            
            // Fases de la historia
            const inicioTextos = [
                `Lumi, el pequeño zorrito, y Pixel, el sabio búho, se preparaban para una nueva aventura en el reino de ${base.mundo}. Fue entonces cuando encontraron un mapa brillante que marcaba la ubicación de <strong>"${base.titulo}"</strong>.`,
                `Pixel ajustó sus lentes y analizó el mapa antiguo. "Este camino nos llevará a descubrir los secretos de <strong>"${base.titulo}"</strong>", susurró con entusiasmo. Lumi dio un salto de alegría.`,
                `Comenzaron su viaje adentrándose por senderos mágicos de ${base.mundo}. El viento soplaba suavemente y las flores del camino parecían susurrar pistas sobre el paradero de <strong>"${base.titulo}"</strong>.`,
                `Liegando a una bifurcación dorada, Pixel sugirió consultar las páginas del gran libro de las leyendas. Gracias a la lectura atenta de Lumi, descubrieron qué dirección tomar para seguir buscando <strong>"${base.titulo}"</strong>.`
            ];
            
            const nudoTextos = [
                `El camino se volvió más misterioso y empinado. De pronto, un pequeño duendecillo travieso bloqueó el paso. "Para cruzar, deben resolver el acertijo de <strong>"${base.titulo}"</strong>", les dijo con una sonrisa astuta.`,
                `Lumi usó su ingenio y Pixel su sabiduría para descifrar las palabras ocultas. El duendecillo, asombrado por su inteligencia, les entregó una llave mágica relacionada con <strong>"${base.titulo}"</strong>.`,
                `Cruzar el puente de cristal fue un gran desafío en ${base.mundo}. Cada paso que daban brillaba con una letra diferente, deletreando palabras que hacían referencia a la gran leyenda de <strong>"${base.titulo}"</strong>.`,
                `Pixel divisó una cueva iluminada con gemas de colores. Dentro de la cueva, encontraron antiguos grabados que detallaban el origen e historia de <strong>"${base.titulo}"</strong>. Lumi leyó cada inscripción con mucha curiosidad.`,
                `El cielo de ${base.mundo} se llenó de constelaciones brillantes. Pixel le enseñó a Lumi a leer las estrellas, las cuales formaban la silueta de lo que buscaban: el misterio de <strong>"${base.titulo}"</strong>.`
            ];
            
            const desenlaceTextos = [
                `¡Finalmente estaban muy cerca! Lumi divisó un resplandor dorado detrás de los grandes árboles de ${base.mundo}. La llave mágica comenzó a brillar con fuerza, indicando la presencia de <strong>"${base.titulo}"</strong>.`,
                `Al colocar la llave en el pedestal de piedra, un cofre de luz se abrió lentamente. En su interior descansaba el gran conocimiento de <strong>"${base.titulo}"</strong>, esparciendo polvo de estrellas por todo el lugar.`,
                `Lumi y Pixel celebraron con gran alegría. Habían resuelto los enigmas de <strong>"${base.titulo}"</strong> gracias a su perseverancia y a todo lo que habían aprendido leyendo en el camino.`,
                `Con las piezas del rompecabezas en sus manos y la satisfacción de haber completado la lectura de esta fantástica historia en ${base.mundo}, Lumi y Pixel regresaron a casa listos para su siguiente gran libro mágico.`
            ];

            for (let i = 1; i <= N; i++) {
                let fase = "Aventura";
                let textoCap = "";
                let dialogoCap = "";
                
                if (i <= Math.ceil(N * 0.3)) {
                    fase = "Inicio 🌟";
                    const idx = (i - 1) % inicioTextos.length;
                    textoCap = `<p>${inicioTextos[idx]}</p> <p>Lumi y Pixel saben que el inicio de cada viaje requiere paciencia y observación. Con sus mochilas listas, se adentran en el corazón del reino, decididos a descifrar el primer gran misterio del libro.</p>`;
                    dialogoCap = `¡Mira Pixel, el mapa brilla cuando leemos en voz alta! ¡Vamos por "${base.titulo}"! 🗺️✨`;
                } else if (i <= Math.ceil(N * 0.7)) {
                    fase = "Nudo 🔍";
                    const idx = (i - 1 - Math.ceil(N * 0.3)) % nudoTextos.length;
                    textoCap = `<p>${nudoTextos[idx]}</p> <p>Afrontar los acertijos en equipo hace que la aventura sea más divertida. Lumi lee atentamente las pistas y Pixel aporta su sabiduría para superar cada obstáculo en ${base.mundo}.</p>`;
                    dialogoCap = `¡Este acertijo de "${base.titulo}" es difícil, pero con lectura y paciencia lo resolveremos! 🧭🧩`;
                } else {
                    fase = "Desenlace 🏆";
                    const idx = (i - 1 - Math.ceil(N * 0.7)) % desenlaceTextos.length;
                    textoCap = `<p>${desenlaceTextos[idx]}</p> <p>Completar un libro es como alcanzar la cima de una gran montaña. Lumi y Pixel guardan este valioso aprendizaje en sus corazones, listos para la próxima gran lectura.</p>`;
                    dialogoCap = `¡Lo logramos, Pixel! Descubrimos el secreto de "${base.titulo}". ¡Qué gran final! 🎉📚`;
                }
                
                contenidoFallback.push({
                    tituloCapitulo: `${base.emojis} Capítulo ${i}: ${fase} ${base.emojis}`,
                    texto: textoCap,
                    dialogo: { nombre: 'Lumi', texto: dialogoCap }
                });
            }

            datosHistorias[libroId] = {
                mundo: base.mundo,
                emojis: base.emojis,
                titulo: base.titulo,
                dificultad: config.dificultad,
                capitulos: config.numCapitulos,
                paginasTotales: config.paginasTotales,
                piezasTotal: base.piezasTotal,
                piezasObtenidas: base.piezasTotal,
                imagen: base.imagen,
                contenido: contenidoFallback
            };

            // Persistir la historia de fallback para evitar llamadas repetidas fallidas
            localStorage.setItem(`lumikids_story_cache_v2_${libroId}`, JSON.stringify(datosHistorias[libroId]));

            cargarHistoriaEnDOM(libroId);
        } finally {
            if (loader) {
                setTimeout(() => {
                    loader.classList.add('oculto');
                }, 400);
            }
        }
    }

    // ─── Abrir overlay desde botones .abrir-libro usando delegación ───────────
    document.addEventListener('click', async (e) => {
        const btn = e.target.closest('.abrir-libro');
        if (!btn) return;

        e.stopPropagation();
        e.preventDefault();

        const tarjeta = btn.closest('[data-libro-id]');
        const libroId = tarjeta?.dataset.libroId;
        const mundo = tarjeta?.dataset.mundo;
        if (!libroId || !mundo) return;

        mundoActual = libroId; // Guardar el libro activo en la variable global mundoActual

        // Mostrar overlay
        overlay.classList.remove('oculto');
        document.body.style.overflow = 'hidden';

        // Iniciar llamada a la IA de Gemini para cargar la historia
        await generarHistoriaConAI(mundo, libroId);
    });

    // ─── Cerrar overlay ───────────────────────────────────────────────────────
    function cerrarLibro() {
        overlay.classList.add('oculto');
        document.body.style.overflow = '';
        
        // Destruir el objeto flipbook al cerrar para reiniciar su estado completo
        if (flipBook) {
            try {
                flipBook.destroy();
            } catch (_) {}
            flipBook = null;
        }
        if (flipbookEl) {
            flipbookEl.innerHTML = '';
        }
    }

    // Clic en fondo oscuro para cerrar
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) cerrarLibro();
    });

    // Tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !overlay.classList.contains('oculto')) {
            cerrarLibro();
        }
    });
});
