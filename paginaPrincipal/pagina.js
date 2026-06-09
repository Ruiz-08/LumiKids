document.addEventListener('DOMContentLoaded', () => {

    // --- 1. NAVEGACIÓN ACTIVA ---
    const enlacesNavegacion = document.querySelectorAll('.enlace-navegacion');
    
    enlacesNavegacion.forEach(enlace => {
        enlace.addEventListener('click', (e) => {
            enlacesNavegacion.forEach(link => link.classList.remove('activo'));
            enlace.classList.add('activo');
        });
    });

    // --- 2. MODAL DE AUTENTICACIÓN ---
    const modal = document.getElementById('modal-autenticacion');
    const botonIniciarSesion = document.getElementById('boton-iniciar-sesion');
    const botonRegistrarse = document.getElementById('boton-registrarse');
    const botonCerrarModal = document.getElementById('cerrar-modal');
    const modalTitulo = document.getElementById('modal-titulo');
    const campoNombre = document.getElementById('campo-nombre-registro');
    const botonEnviar = document.getElementById('boton-modal-enviar');
    const enlaceAlternativo = document.getElementById('enlace-alternativo-modal');
    const textoAlternativo = document.getElementById('texto-alternativo-modal');

    function abrirModal(modo) {
        modal.classList.add('visible');
        actualizarModalModo(modo);
    }

    function cerrarModalFunc() {
        modal.classList.remove('visible');
    }

    function actualizarModalModo(modo) {
        if (modo === 'iniciar') {
            modalTitulo.textContent = 'Iniciar Sesión';
            campoNombre.style.display = 'none';
            botonEnviar.textContent = 'Entrar';
            textoAlternativo.textContent = '¿No tienes cuenta?';
            enlaceAlternativo.textContent = 'Regístrate';
        } else {
            modalTitulo.textContent = 'Crear Cuenta';
            campoNombre.style.display = 'flex';
            botonEnviar.textContent = 'Registrarse';
            textoAlternativo.textContent = '¿Ya tienes cuenta?';
            enlaceAlternativo.textContent = 'Inicia sesión';
        }
    }

    botonIniciarSesion.addEventListener('click', () => abrirModal('iniciar'));
    botonRegistrarse.addEventListener('click', () => abrirModal('registro'));
    botonCerrarModal.addEventListener('click', cerrarModalFunc);
    
    // Cerrar al hacer clic fuera del modal
    modal.addEventListener('click', (e) => {
        if (e.target === modal) cerrarModalFunc();
    });

    enlaceAlternativo.addEventListener('click', (e) => {
        e.preventDefault();
        const esInicio = modalTitulo.textContent === 'Iniciar Sesión';
        actualizarModalModo(esInicio ? 'registro' : 'iniciar');
    });


    // --- 3. ROMPECABEZAS INTERACTIVO ---
    const ranurasPiezas = document.querySelectorAll('.pieza-ranura');
    const progresoLinea = document.getElementById('progreso-linea');
    const progresoContador = document.getElementById('progreso-contador-texto');
    const contadorEstrellas = document.getElementById('contador-estrellas');
    const contadorMonedas = document.getElementById('contador-monedas');
    
    let piezasColocadas = 8;
    const piezasTotales = 20;

    ranurasPiezas.forEach(ranura => {
        ranura.addEventListener('click', () => {
            if (ranura.classList.contains('bloqueada')) {
                // Desbloquear pieza
                ranura.classList.remove('bloqueada');
                ranura.classList.add('desbloqueada');
                
                // Eliminar icono de bloqueo
                const icono = ranura.querySelector('.icono-bloqueo');
                if (icono) icono.remove();

                // Actualizar progreso
                piezasColocadas++;
                const porcentaje = (piezasColocadas / piezasTotales) * 100;
                progresoLinea.style.width = `${porcentaje}%`;
                progresoContador.textContent = `${piezasColocadas}/${piezasTotales}`;

                // Incrementar estadísticas con animación visual
                animarIncrementoEstadisticas();

                // Crear partículas de celebración
                crearParticulas(ranura);
            }
        });
    });

    function animarIncrementoEstadisticas() {
        // Estrellas +5
        let estrellasActuales = parseInt(contadorEstrellas.textContent);
        let metaEstrellas = estrellasActuales + 5;
        let intervaloEstrellas = setInterval(() => {
            if (estrellasActuales < metaEstrellas) {
                estrellasActuales++;
                contadorEstrellas.textContent = estrellasActuales;
            } else {
                clearInterval(intervaloEstrellas);
            }
        }, 40);

        // Monedas +15
        let monedasActuales = parseInt(contadorMonedas.textContent);
        let metaMonedas = monedasActuales + 15;
        let intervaloMonedas = setInterval(() => {
            if (monedasActuales < metaMonedas) {
                monedasActuales++;
                contadorMonedas.textContent = monedasActuales;
            } else {
                clearInterval(intervaloMonedas);
            }
        }, 20);
    }

    function crearParticulas(elemento) {
        const rect = elemento.getBoundingClientRect();
        const centroX = rect.left + rect.width / 2;
        const centroY = rect.top + rect.height / 2;

        for (let i = 0; i < 12; i++) {
            const particula = document.createElement('div');
            particula.style.position = 'fixed';
            particula.style.left = `${centroX}px`;
            particula.style.top = `${centroY}px`;
            particula.style.width = '12px';
            particula.style.height = '12px';
            particula.style.borderRadius = '50%';
            
            // Colores festivos
            const colores = ['#FFD54F', '#EC407A', '#29B6F6', '#81C784', '#FF9100'];
            particula.style.backgroundColor = colores[Math.floor(Math.random() * colores.length)];
            particula.style.pointerEvents = 'none';
            particula.style.zIndex = '9999';
            
            // Ángulo y velocidad aleatoria
            const angulo = Math.random() * Math.PI * 2;
            const velocidad = 3 + Math.random() * 5;
            const vx = Math.cos(angulo) * velocidad;
            const vy = Math.sin(angulo) * velocidad - 2; // Añadir empuje hacia arriba

            document.body.appendChild(particula);

            let posX = centroX;
            let posY = centroY;
            let opacidad = 1;

            const animacionParticula = setInterval(() => {
                posX += vx;
                posY += vy + 0.15; // Simular gravedad suave
                opacidad -= 0.03;

                particula.style.left = `${posX}px`;
                particula.style.top = `${posY}px`;
                particula.style.opacity = opacidad;

                if (opacidad <= 0) {
                    clearInterval(animacionParticula);
                    particula.remove();
                }
            }, 16);
        }
    }


    // --- 4. CARRUSEL DE MUNDOS ---
    const carril = document.getElementById('carrusel-carril');
    const botonAnt = document.getElementById('carrusel-ant');
    const botonSig = document.getElementById('carrusel-sig');

    if (carril && botonAnt && botonSig) {
        const distanciaDesplazamiento = 250; // Pixeles a desplazar por clic

        botonAnt.addEventListener('click', () => {
            carril.scrollBy({ left: -distanciaDesplazamiento, behavior: 'smooth' });
        });

        botonSig.addEventListener('click', () => {
            carril.scrollBy({ left: distanciaDesplazamiento, behavior: 'smooth' });
        });
    }


    // --- 5. CONTADORES DE ESTADÍSTICAS ANIMADOS (SCROLL) ---
    const valoresNumeros = document.querySelectorAll('.numero-valor');
    let contadoresIniciados = false;

    const animarNumeros = () => {
        valoresNumeros.forEach(contador => {
            const meta = parseInt(contador.getAttribute('data-meta'));
            let valorActual = 0;
            const duracion = 1500; // ms
            const paso = Math.ceil(meta / (duracion / 16));

            const temporizador = setInterval(() => {
                valorActual += paso;
                if (valorActual >= meta) {
                    contador.textContent = meta.toLocaleString('es-ES') + (meta === 500 || meta === 100 || meta === 20 ? '+' : '');
                    clearInterval(temporizador);
                } else {
                    contador.textContent = valorActual.toLocaleString('es-ES');
                }
            }, 16);
        });
    };

    // Usar IntersectionObserver para activar la animación al hacer scroll
    const observadorNumeros = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !contadoresIniciados) {
                contadoresIniciados = true;
                animarNumeros();
            }
        });
    }, { threshold: 0.3 });

    const seccionNumeros = document.querySelector('.numeros-seccion');
    if (seccionNumeros) {
        observadorNumeros.observe(seccionNumeros);
    }


    // --- 6. MICRO-ANIMACIONES EN AMIGOS ---
    const tarjetasAmigos = document.querySelectorAll('.amigo-tarjeta');
    tarjetasAmigos.forEach(tarjeta => {
        tarjeta.addEventListener('mouseenter', () => {
            const avatar = tarjeta.querySelector('.amigo-avatar-wrapper');
            avatar.style.transform = 'scale(1.15) rotate(7deg)';
        });
        
        tarjeta.addEventListener('mouseleave', () => {
            const avatar = tarjeta.querySelector('.amigo-avatar-wrapper');
            avatar.style.transform = 'scale(1) rotate(0deg)';
        });
    });

    // --- 7. CONTROL DE PARÁMETROS URL PARA MODAL DE AUTENTICACIÓN ---
    const params = new URLSearchParams(window.location.search);
    const authAction = params.get('auth');
    if (authAction === 'iniciar') {
        abrirModal('iniciar');
    } else if (authAction === 'registro') {
        abrirModal('registro');
    }

});
