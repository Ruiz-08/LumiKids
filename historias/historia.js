/* ============================================================
   LUMI — BIBLIOTECA DE HISTORIAS — historias.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. RENDERIZADO DE LA BIBLIOTECA ---
    const bibliotecaData = window.LUMIKIDS_BIBLIOTECA;
    const contenedor = document.getElementById('contenedor-biblioteca');
    
    // Variables globales de filtro
    let filtroActivo = 'todas';
    let consultaBusqueda = '';

    function renderizarBiblioteca() {
        if (!contenedor || !bibliotecaData) return;
        contenedor.innerHTML = '';

        let totalPiezasPosibles = 0;
        let totalPiezasGanadas = 0;

        // Definir orden secuencial de mundos
        const ordenMundos = ['bosque', 'pirata', 'letras', 'dragones', 'ciudad'];
        let mundoAnteriorCompletado = true; // El primer mundo (bosque) siempre se puede desbloquear

        ordenMundos.forEach((mundoKey) => {
            const mundoObj = bibliotecaData[mundoKey];
            if (!mundoObj) return;

            // Determinar si este mundo está desbloqueado
            const mundoDesbloqueado = mundoAnteriorCompletado;

            // Contar libros completados en este mundo
            let librosCompletadosEnMundo = 0;
            let librosHTML = '';
            let librosVisiblesCount = 0;

            let libroAnteriorCompletado = true; // El primer libro de cada mundo desbloqueado está desbloqueado por defecto

            mundoObj.libros.forEach((libro, index) => {
                totalPiezasPosibles += libro.piezas;
                
                const completado = localStorage.getItem(`lumikids_completed_${libro.id}`) === 'true';
                if (completado) {
                    librosCompletadosEnMundo++;
                    totalPiezasGanadas += libro.piezas;
                }

                // Un libro está bloqueado si el mundo está bloqueado O si el anterior libro de esta categoría no se ha completado
                const libroBloqueado = !mundoDesbloqueado || !libroAnteriorCompletado;

                // Preparar para el siguiente libro en la secuencia
                libroAnteriorCompletado = completado;

                // Filtrar según filtros de UI
                const dificultadNorm = normalizarDificultad(mundoObj.dificultad);
                const coincideFiltro = (filtroActivo === 'todas' || dificultadNorm === filtroActivo);
                const coincideBusqueda = libro.titulo.toLowerCase().includes(consultaBusqueda);

                if (coincideFiltro && coincideBusqueda) {
                    librosVisiblesCount++;
                    
                    librosHTML += `
                        <div class="tarjeta-historia-item ${libroBloqueado ? 'bloqueada' : ''}" 
                             data-libro-id="${libro.id}" 
                             data-mundo="${mundoKey}">
                            <div class="tarjeta-historia-imagen" 
                                 style="background-image: linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.85)), url('${libro.imagen}');">
                                ${libroBloqueado 
                                    ? `<div class="capa-bloqueo-libro"><span class="icono-candado">🔒</span><span class="texto-bloqueo">Bloqueado</span></div>` 
                                    : (completado ? `<span class="badge-completado">✓ Completado</span>` : `<span class="badge-activo">Disponible</span>`)
                                }
                                <h3 class="titulo-tarjeta-historia">${libro.titulo}</h3>
                            </div>
                            <div class="tarjeta-historia-info">
                                <div class="progreso-piezas-info">
                                    <i class="bi bi-puzzle-fill ${completado ? 'icono-puzzle-verde' : 'icono-puzzle-naranja'}"></i>
                                    <span class="texto-piezas">${completado ? libro.piezas : '0'}/${libro.piezas} piezas</span>
                                </div>
                                <button class="boton-leer-historia ${libroBloqueado ? 'disabled' : 'abrir-libro'}" 
                                        aria-label="Leer historia" 
                                        ${libroBloqueado ? 'disabled' : ''}>
                                    <i class="bi ${completado ? 'bi-check2-circle' : 'bi-book-half'}"></i>
                                </button>
                            </div>
                        </div>
                    `;
                }
            });

            // El mundo actual se considera completado si se terminaron todos sus libros
            const mundoCompletamenteTerminado = (librosCompletadosEnMundo === mundoObj.libros.length);
            // Establecer el estado para el siguiente mundo
            mundoAnteriorCompletado = mundoDesbloqueado && mundoCompletamenteTerminado;

            // Renderizar la sección de la categoría del mundo si tiene libros visibles tras el filtrado
            if (librosVisiblesCount > 0) {
                const totalLibros = mundoObj.libros.length;
                const porcentajeProgreso = (librosCompletadosEnMundo / totalLibros) * 100;

                const categoriaHTML = `
                    <div class="categoria-seccion ${!mundoDesbloqueado ? 'mundo-bloqueado-categoria' : ''}" data-categoria="${mundoKey}">
                        <div class="categoria-cabecera" style="border-left-color: ${mundoObj.color}">
                            <div class="categoria-info">
                                <span class="categoria-emoji">${mundoObj.emojis}</span>
                                <h2 class="categoria-titulo">${mundoObj.mundo}</h2>
                                <span class="dificultad-badge" style="background-color: ${mundoObj.color}">${mundoObj.dificultad}</span>
                            </div>
                            <div class="categoria-progreso">
                                <span class="categoria-progreso-texto">${librosCompletadosEnMundo}/${totalLibros} Libros Completados</span>
                                <div class="categoria-progreso-barra">
                                    <div class="categoria-progreso-relleno" style="width: ${porcentajeProgreso}%; background-color: ${mundoObj.color}"></div>
                                </div>
                            </div>
                        </div>
                        <div class="grid-historias">
                            ${librosHTML}
                        </div>
                    </div>
                `;
                contenedor.insertAdjacentHTML('beforeend', categoriaHTML);
            }
        });

        // Actualizar barra de progreso total lateral
        const totalPiezasTexto = document.getElementById('total-piezas-progreso');
        const totalPiezasBarra = document.querySelector('.barra-progreso-total-llena');
        if (totalPiezasTexto && totalPiezasBarra) {
            totalPiezasTexto.textContent = `${totalPiezasGanadas}/${totalPiezasPosibles}`;
            const pctTotal = totalPiezasPosibles > 0 ? (totalPiezasGanadas / totalPiezasPosibles) * 100 : 0;
            totalPiezasBarra.style.width = `${pctTotal}%`;
            
            // Actualizar el wrapper de la barra para guardar consistencia
            const wrapper = totalPiezasBarra.parentElement;
            if (wrapper) wrapper.title = `${pctTotal.toFixed(0)}% completado`;
        }
    }

    // Normalizar texto de dificultad para filtros
    function normalizarDificultad(dif) {
        switch (dif.toLowerCase()) {
            case 'muy fácil': return 'facil';
            case 'fácil': return 'facil';
            case 'intermedia': return 'intermedia';
            case 'avanzada': return 'avanzada';
            case 'experta': return 'avanzada'; // Agrupar experta con avanzada en filtros básicos
            default: return 'todas';
        }
    }

    // --- 2. FILTRADO DE DIFICULTAD Y BÚSQUEDA ---
    const botonesFiltro = document.querySelectorAll('.filtro-btn');
    const buscadorInput = document.getElementById('buscador-historias');

    // Eventos de Filtro por Botón
    botonesFiltro.forEach(boton => {
        boton.addEventListener('click', () => {
            botonesFiltro.forEach(btn => btn.classList.remove('activo'));
            boton.classList.add('activo');
            filtroActivo = boton.getAttribute('data-dificultad');
            renderizarBiblioteca();
        });
    });

    // Eventos de Buscador (Input)
    if (buscadorInput) {
        buscadorInput.addEventListener('input', (e) => {
            consultaBusqueda = e.target.value.toLowerCase().trim();
            renderizarBiblioteca();
        });
    }

    // --- 3. INTERACCIÓN DE BLOQUEOS (SACUDIDA Y ALERTAS) ---
    if (contenedor) {
        contenedor.addEventListener('click', (e) => {
            const card = e.target.closest('.tarjeta-historia-item.bloqueada');
            if (card) {
                e.stopPropagation();
                e.preventDefault();

                // Animación de sacudida
                card.classList.remove('shake-animation');
                void card.offsetWidth; // Forzar reflujo
                card.classList.add('shake-animation');

                // Mostrar mensaje explicativo
                const mundoKey = card.dataset.mundo;
                const section = card.closest('.categoria-seccion');
                
                if (section && section.classList.contains('mundo-bloqueado-categoria')) {
                    const ordenMundos = ['bosque', 'pirata', 'letras', 'dragones', 'ciudad'];
                    const currentIdx = ordenMundos.indexOf(mundoKey);
                    const prevMundoKey = currentIdx > 0 ? ordenMundos[currentIdx - 1] : '';
                    const prevMundoName = prevMundoKey && bibliotecaData[prevMundoKey] ? bibliotecaData[prevMundoKey].mundo : 'el mundo anterior';
                    
                    alert(`🔒 ¡Este mundo está bloqueado! Debes completar todos los libros de "${prevMundoName}" para poder desbloquearlo.`);
                } else {
                    alert(`🔒 ¡Este libro está bloqueado! Completa el libro anterior de este mismo mundo para poder continuar.`);
                }
            }
        });
    }

    // --- 4. EVENTOS DE ACTUALIZACIÓN ---
    window.addEventListener('libroCompletado', (e) => {
        console.log('Refrescando biblioteca por libro completado:', e.detail.libroId);
        renderizarBiblioteca();
    });

    // Inicializar renderizado
    renderizarBiblioteca();

    // Añadir estilo CSS de animación dinámicamente si no existe
    if (!document.getElementById('keyframes-fadein')) {
        const estilo = document.createElement('style');
        estilo.id = 'keyframes-fadein';
        estilo.innerHTML = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;
        document.head.appendChild(estilo);
    }
});
