/* ============================================
   LIBRO MÁGICO — St.PageFlip Integration
   ============================================ */

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

    // Caché dinámica de contenidos generados por la IA de Gemini para los libros
    const datosHistorias = {};

    // ─── Estado global ────────────────────────────────────────────────────────
    let flipBook    = null;
    let mundoActual = 'bosque';
    // Número de páginas totales en el flipbook (12)
    const TOTAL_PAGES = 12;

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

            // Cargar todas las páginas hijas del flipbook-div
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
        // Proporción A4-like (~3:4)
        const ratio = 0.72;
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

    // ─── Cargar datos de la historia en el DOM ────────────────────────────────
    function cargarHistoriaEnDOM(mundo) {
        const d = datosHistorias[mundo];
        if (!d) return;

        // ── Portada ──────────────────────────────────────────────────────────
        setHTML('cover-badge-mundo',    `<span>${d.emojis}</span> ${d.mundo}`);
        setHTML('cover-titulo',          d.titulo);
        setSrc ('#cover-ilustracion img', d.imagen);

        // ── Fondo del overlay ────────────────────────────────────────────────
        const fondo = document.getElementById('libro-fondo-magico');
        if (fondo) fondo.style.backgroundImage = `url('${d.imagen}')`;

        // ── Páginas de stats (clases dinámicas) ──────────────────────────────
        document.querySelectorAll('.badge-mundo-val').forEach(el => {
            el.innerHTML = `<span>${d.emojis}</span> ${d.mundo}`;
        });
        document.querySelectorAll('.titulo-historia-val').forEach(el => {
            el.innerHTML = d.titulo;
        });
        document.querySelectorAll('.ilustracion-principal-val').forEach(el => {
            el.src = d.imagen;
        });
        document.querySelectorAll('.info-mundo-val').forEach(el => {
            el.textContent = d.mundo;
        });
        document.querySelectorAll('.info-dificultad-val').forEach(el => {
            el.textContent = d.dificultad;
        });
        document.querySelectorAll('.info-capitulos-val').forEach(el => {
            el.textContent = d.capitulos;
        });
        document.querySelectorAll('.info-piezas-total-val').forEach(el => {
            el.textContent = d.piezasTotal;
        });
        document.querySelectorAll('.progreso-numero-val').forEach(el => {
            el.textContent = `${d.piezasObtenidas}/${d.piezasTotal}`;
        });
        document.querySelectorAll('.progreso-barra-val').forEach(el => {
            el.style.width = `${(d.piezasObtenidas / d.piezasTotal) * 100}%`;
        });

        // ── Capítulos 1–4 ────────────────────────────────────────────────────
        for (let i = 1; i <= 4; i++) {
            const cap = d.contenido[i - 1];
            if (!cap) continue;
            setTxt(`cap-titulo-${i}`,      cap.tituloCapitulo);
            setSrc(`#cap-ilustracion-${i} img`, d.imagen);
            setHTML(`cap-texto-${i}`,       cap.texto);
            setTxt(`dialogo-nombre-${i}`,   cap.dialogo.nombre);
            setTxt(`dialogo-texto-${i}`,    cap.dialogo.texto);
        }

        // ── Página final ─────────────────────────────────────────────────────
        const estrellas = document.getElementById('final-recompensa-estrellas');
        if (estrellas) {
            estrellas.innerHTML = '';
            for (let i = 0; i < d.piezasTotal; i++) {
                estrellas.innerHTML += i < d.piezasObtenidas ? '⭐' : '☆';
            }
        }
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────
    function setTxt(id, txt) {
        const el = document.getElementById(id);
        if (el) el.textContent = txt;
    }
    function setHTML(id, html) {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
    }
    function setSrc(selector, src) {
        const el = document.querySelector(selector);
        if (el) el.src = src;
    }

    // ─── Actualizar indicadores inferiores ────────────────────────────────────
    function actualizarNavegacion(pageIdx) {
        if (pageIdx === undefined || pageIdx === null) return;

        // Indicador de texto
        let label = 'Portada';
        if (pageIdx === 0 || pageIdx === 1) {
            label = 'Portada';
        } else if (pageIdx >= 2 && pageIdx <= 3) {
            label = 'Capítulo 1';
        } else if (pageIdx >= 4 && pageIdx <= 5) {
            label = 'Capítulo 2';
        } else if (pageIdx >= 6 && pageIdx <= 7) {
            label = 'Capítulo 3';
        } else if (pageIdx >= 8 && pageIdx <= 9) {
            label = 'Capítulo 4';
        } else if (pageIdx >= 10) {
            label = '¡Fin! 🎉';
        }
        if (indicador) indicador.textContent = label;

        // Barra de progreso (0 – 100%)
        const porcentaje = Math.min(((pageIdx) / (TOTAL_PAGES - 1)) * 100, 100);
        if (barraProgCap) barraProgCap.style.width = `${porcentaje}%`;

        // Estrellas de capítulo
        if (estrellasBar) {
            estrellasBar.innerHTML = '';
            const capActivo = pageIdx < 2 ? 0 : Math.ceil((pageIdx - 1) / 2);
            for (let i = 1; i <= 4; i++) {
                const span = document.createElement('span');
                span.className = `estrella-cap${i <= capActivo ? ' activa' : ''}`;
                span.textContent = i <= capActivo ? '⭐' : '☆';
                estrellasBar.appendChild(span);
            }
        }

        // Visibilidad botones flotantes
        if (btnFlotAnt) btnFlotAnt.style.opacity = pageIdx <= 0 ? '0' : '1';
        if (btnFlotSig) btnFlotSig.style.opacity = pageIdx >= TOTAL_PAGES - 1 ? '0' : '1';
    }

    // ─── Botones flotantes ────────────────────────────────────────────────────
    btnFlotAnt?.addEventListener('click', () => {
        if (flipBook) flipBook.flipPrev();
    });

    btnFlotSig?.addEventListener('click', () => {
        if (flipBook) flipBook.flipNext();
    });

    // ─── Botón "Abrir Libro" en la portada ───────────────────────────────────
    btnAbrirPortada?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (flipBook) flipBook.flip(1);
    });

    // ─── Botón Finalizar Aventura ─────────────────────────────────────────────
    btnFinal?.addEventListener('click', () => {
        if (mundoActual) {
            localStorage.setItem(`lumikids_completed_${mundoActual}`, 'true');
            window.dispatchEvent(new CustomEvent('libroCompletado', { detail: { libroId: mundoActual } }));
        }
        cerrarLibro();
    });

    // ─── Botón Volver en barra superior ──────────────────────────────────────
    btnVolver?.addEventListener('click', () => cerrarLibro());

    // API KEY de Gemini
    const GEMINI_API_KEY = 'AQ.Ab8RN6JH5iVKxopMRgUu-4lVlH9TFI0s3nZXOUTOn09dmCxIoA';

    // Generar historia con IA de Gemini
    async function generarHistoriaConAI(mundo, libroId) {
        const loader = document.getElementById('libro-cargando');
        if (loader) loader.classList.remove('oculto');

        const mundoData = window.LUMIKIDS_BIBLIOTECA[mundo];
        const libroData = mundoData?.libros.find(l => l.id === libroId) || {
            titulo: 'El Tesoro del Bosque',
            imagen: 'imagenes/bosque.png',
            piezas: 4
        };

        const base = {
            mundo: mundoData?.mundo || 'Mundo Mágico',
            emojis: mundoData?.emojis || '✨',
            dificultad: mundoData?.dificultad || 'Fácil',
            imagen: libroData.imagen,
            titulo: libroData.titulo,
            piezasTotal: libroData.piezas
        };

        if (datosHistorias[libroId]) {
            cargarHistoriaEnDOM(libroId);
            if (loader) loader.classList.add('oculto');
            return;
        }

        const prompt = `Crea una historia infantil educativa corta y mágica titulada "${base.titulo}" dividida en exactamente 4 capítulos sobre el mundo "${base.mundo}" (representado por el emoji ${base.emojis}).
La historia tiene como protagonistas a "Lumi" (un simpático zorrito aventurero) y su ayudante "Pixel" (un sabio búho pixelado).
Cada capítulo debe tener:
- Un título de capítulo corto con emojis.
- Un texto narrativo de fantasía dividido en 2 párrafos cortos (con etiquetas HTML <p>...</p>).
- Un diálogo corto de una frase expresada por "Lumi" relacionado con lo que ocurre en el capítulo.

Debes responder ÚNICAMENTE en formato JSON con la siguiente estructura, sin bloques de código markdown, sin \`\`\`json ni texto adicional:
{
  "titulo": "Título Creativo e Infantil del Libro",
  "dificultad": "${base.dificultad}",
  "contenido": [
    {
      "tituloCapitulo": "Título del Capítulo",
      "texto": "Texto narrativo en HTML con <p>",
      "dialogo": {
        "nombre": "Lumi",
        "texto": "Diálogo del personaje con emojis"
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
                capitulos: 4,
                piezasTotal: base.piezasTotal,
                piezasObtenidas: base.piezasTotal,
                imagen: base.imagen,
                contenido: storyJson.contenido
            };

            cargarHistoriaEnDOM(libroId);

        } catch (error) {
            console.error('Error generando historia con IA:', error);
            datosHistorias[libroId] = {
                mundo: base.mundo,
                emojis: base.emojis,
                titulo: base.titulo,
                dificultad: base.dificultad,
                capitulos: 4,
                piezasTotal: base.piezasTotal,
                piezasObtenidas: Math.floor(base.piezasTotal / 2),
                imagen: base.imagen,
                contenido: [
                    {
                        tituloCapitulo: `${base.emojis} El inicio del misterio ${base.emojis}`,
                        texto: `<p>Lumi y Pixel decidieron adentrarse en esta nueva aventura para explorar "${base.titulo}". Encontraron huellas misteriosas que indicaban que estaban en el camino correcto.</p>`,
                        dialogo: { nombre: 'Lumi', texto: '¡Vaya aventura nos espera con este libro! 🌟' }
                    },
                    {
                        tituloCapitulo: '🗺️ Siguiendo las pistas 🗺️',
                        texto: `<p>El mapa les indicaba que debían resolver problemas en su camino. Poco a poco descifraron los códigos del mundo.</p>`,
                        dialogo: { nombre: 'Lumi', texto: '¡Mira Pixel, aquí hay otra pista! 🔍' }
                    },
                    {
                        tituloCapitulo: '🗝️ El gran desafío 🗝️',
                        texto: `<p>Un gran guardián bloqueaba el paso. Debieron usar todo su ingenio para ganarse su confianza.</p>`,
                        dialogo: { nombre: 'Lumi', texto: '¡Superemos este reto juntos! 💪' }
                    },
                    {
                        tituloCapitulo: '🎉 Victoria mágica 🎉',
                        texto: `<p>Con esfuerzo y sabiduría, completaron la historia y recuperaron las piezas perdidas del mundo.</p>`,
                        dialogo: { nombre: 'Lumi', texto: '¡Qué gran historia! ¡Lo logramos! 🏆' }
                    }
                ]
            };
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

        if (flipBook) {
            try { flipBook.turnToPage(0); } catch (_) {}
            actualizarNavegacion(0);
        } else {
            setTimeout(() => {
                initFlipBook();
                actualizarNavegacion(0);
            }, 80);
        }
    });

    // ─── Cerrar overlay ───────────────────────────────────────────────────────
    function cerrarLibro() {
        overlay.classList.add('oculto');
        document.body.style.overflow = '';
        // No llamamos destroy() porque elimina el elemento del DOM
        // Solo reseteamos el estado del flipbook para la próxima vez
        if (flipBook) {
            try { flipBook.turnToPage(0); } catch (_) {}
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
