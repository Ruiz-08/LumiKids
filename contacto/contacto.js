/* ================================================
   CONTACTO — LUMIKIDS
   contacto.js
   ================================================ */

document.addEventListener('DOMContentLoaded', () => {

    // ── 1. FORMULARIO DE CONTACTO ─────────────────
    const form       = document.getElementById('formulario-contacto');
    const inputNombre    = document.getElementById('ct-nombre');
    const inputCorreo    = document.getElementById('ct-correo');
    const inputAsunto    = document.getElementById('ct-asunto');
    const inputMensaje   = document.getElementById('ct-mensaje');
    const inputPriv      = document.getElementById('ct-privacidad');
    const contador       = document.getElementById('ct-contador');
    const seccionExito   = document.getElementById('ct-exito');
    const correoConf     = document.getElementById('correo-confirmado');
    const btnOtro        = document.getElementById('btn-otro-mensaje');
    const btnEnviar      = document.getElementById('btn-enviar-correo');

    // Contador de caracteres del mensaje
    if (inputMensaje && contador) {
        inputMensaje.addEventListener('input', () => {
            const len = inputMensaje.value.length;
            contador.textContent = `${len} / 500`;
            if (len > 450) contador.style.color = '#E91E63';
            else if (len > 350) contador.style.color = '#F59E0B';
            else contador.style.color = '#90A4AE';
            if (len > 500) inputMensaje.value = inputMensaje.value.slice(0, 500);
        });
    }

    // Validación de campos individuales
    const validar = (input, errorId, regla) => {
        const errEl = document.getElementById(errorId);
        const mensaje = regla(input.value.trim());
        if (mensaje) {
            input.classList.add('invalido');
            input.classList.remove('valido');
            errEl.innerHTML = `<i class="bi bi-exclamation-circle-fill"></i> ${mensaje}`;
            return false;
        } else {
            input.classList.remove('invalido');
            input.classList.add('valido');
            errEl.textContent = '';
            return true;
        }
    };

    const reglas = {
        nombre:  v => !v ? 'El nombre es obligatorio.' : v.length < 2 ? 'Escribe al menos 2 caracteres.' : '',
        correo:  v => !v ? 'El correo es obligatorio.' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Ingresa un correo válido.' : '',
        asunto:  v => !v ? 'Selecciona un asunto.' : '',
        mensaje: v => !v ? 'Escribe tu mensaje.' : v.length < 10 ? 'El mensaje debe tener al menos 10 caracteres.' : '',
    };

    // Validación en tiempo real (blur)
    if (inputNombre)  inputNombre.addEventListener('blur',  () => validar(inputNombre, 'err-nombre', reglas.nombre));
    if (inputCorreo)  inputCorreo.addEventListener('blur',  () => validar(inputCorreo, 'err-correo', reglas.correo));
    if (inputAsunto)  inputAsunto.addEventListener('blur',  () => validar(inputAsunto, 'err-asunto', reglas.asunto));
    if (inputMensaje) inputMensaje.addEventListener('blur', () => validar(inputMensaje, 'err-mensaje', reglas.mensaje));

    // Envío del formulario
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const okNombre  = validar(inputNombre, 'err-nombre', reglas.nombre);
            const okCorreo  = validar(inputCorreo, 'err-correo', reglas.correo);
            const okAsunto  = validar(inputAsunto, 'err-asunto', reglas.asunto);
            const okMensaje = validar(inputMensaje, 'err-mensaje', reglas.mensaje);

            const errPriv = document.getElementById('err-privacidad');
            let okPriv = true;
            if (!inputPriv.checked) {
                okPriv = false;
                errPriv.innerHTML = '<i class="bi bi-exclamation-circle-fill"></i> Debes aceptar la política de privacidad.';
            } else {
                errPriv.textContent = '';
            }

            if (!okNombre || !okCorreo || !okAsunto || !okMensaje || !okPriv) return;

            // Simulación de envío
            btnEnviar.disabled = true;
            btnEnviar.innerHTML = '<i class="bi bi-hourglass-split"></i> <span>Enviando…</span>';
            btnEnviar.style.opacity = '0.8';

            setTimeout(() => {
                form.style.display = 'none';
                correoConf.textContent = inputCorreo.value;
                seccionExito.style.display = 'flex';
            }, 1800);
        });
    }

    // Efecto ripple en botón enviar
    if (btnEnviar) {
        btnEnviar.addEventListener('click', function(e) {
            const ripple = this.querySelector('.ct-btn-ripple');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
            ripple.style.top  = (e.clientY - rect.top  - size / 2) + 'px';
            ripple.style.opacity = '1';
            ripple.style.width = size * 2 + 'px';
            ripple.style.height = size * 2 + 'px';
            setTimeout(() => { ripple.style.opacity = '0'; }, 500);
        });
    }

    // Botón "enviar otro mensaje"
    if (btnOtro) {
        btnOtro.addEventListener('click', () => {
            form.reset();
            form.style.display = 'flex';
            seccionExito.style.display = 'none';
            btnEnviar.disabled = false;
            btnEnviar.innerHTML = '<i class="bi bi-send-fill"></i><span>Enviar mensaje</span><div class="ct-btn-ripple"></div>';
            btnEnviar.style.opacity = '1';
            // limpiar estados de validación
            [inputNombre, inputCorreo, inputAsunto, inputMensaje].forEach(i => {
                i.classList.remove('valido', 'invalido');
            });
        });
    }

    // ── 2. MAPA — ACTIVAR AL HACER CLIC ──────────
    const mapaOverlay = document.getElementById('ct-mapa-overlay');
    const btnActivar  = document.getElementById('btn-activar-mapa');

    if (btnActivar && mapaOverlay) {
        btnActivar.addEventListener('click', () => {
            mapaOverlay.classList.add('oculto');
        });
    }

    // ── 3. COPIAR AL PORTAPAPELES ─────────────────
    const toast = document.getElementById('ct-toast');
    let toastTimer;

    document.querySelectorAll('.ct-btn-copiar').forEach(btn => {
        btn.addEventListener('click', async () => {
            const valor = btn.dataset.valor;
            try {
                await navigator.clipboard.writeText(valor);
            } catch {
                // fallback
                const ta = document.createElement('textarea');
                ta.value = valor;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                ta.remove();
            }

            // Mostrar toast
            clearTimeout(toastTimer);
            toast.classList.add('visible');
            // Feedback visual en el botón
            btn.innerHTML = '<i class="bi bi-check2-all"></i>';
            btn.style.background = '#E8F5E9';
            btn.style.color = '#2E7D32';
            btn.style.borderColor = '#A5D6A7';

            toastTimer = setTimeout(() => {
                toast.classList.remove('visible');
                btn.innerHTML = '<i class="bi bi-copy"></i>';
                btn.style.background = '';
                btn.style.color = '';
                btn.style.borderColor = '';
            }, 2500);
        });
    });

    // ── 4. FAQ ACORDEÓN ───────────────────────────
    document.querySelectorAll('.ct-faq-pregunta').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.closest('.ct-faq-item');
            const estaAbierto = item.classList.contains('abierto');

            // Cerrar todos
            document.querySelectorAll('.ct-faq-item').forEach(i => i.classList.remove('abierto'));
            document.querySelectorAll('.ct-faq-pregunta').forEach(b => b.setAttribute('aria-expanded', 'false'));

            // Si no estaba abierto, abrir este
            if (!estaAbierto) {
                item.classList.add('abierto');
                btn.setAttribute('aria-expanded', 'true');
            }
        });
    });

    // ── 5. CHIPS — SCROLL SUAVE ───────────────────
    document.querySelectorAll('.ct-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
            const href = chip.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const destino = document.querySelector(href);
                if (destino) {
                    const offset = 140; // header + chips
                    const y = destino.getBoundingClientRect().top + window.scrollY - offset;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                }
            }
        });
    });

    // ── 6. BOTÓN WHATSAPP — TRACKING VISUAL ──────
    const btnWa = document.getElementById('btn-whatsapp');
    if (btnWa) {
        btnWa.addEventListener('click', () => {
            btnWa.style.transform = 'scale(0.97)';
            setTimeout(() => { btnWa.style.transform = ''; }, 200);
        });
    }

});
