/* ================================================
   PANEL PARA PADRES — LUMIKIDS
   padres.js
   ================================================ */

document.addEventListener('DOMContentLoaded', () => {

    // ── 1. FECHA HOY ──────────────────────────────
    const fechaEl = document.getElementById('fecha-hoy');
    if (fechaEl) {
        const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const hoy = new Date().toLocaleDateString('es-ES', opciones);
        fechaEl.textContent = hoy.charAt(0).toUpperCase() + hoy.slice(1);
    }

    // ── 2. ANIMACIÓN CONTADORES KPI ───────────────
    const kpiValores = document.querySelectorAll('.pd-kpi-valor');
    const animarContador = (el) => {
        const meta = parseInt(el.dataset.meta, 10);
        const duracion = 1400;
        const pasos = 60;
        const incremento = meta / pasos;
        let actual = 0;
        const timer = setInterval(() => {
            actual += incremento;
            if (actual >= meta) {
                el.textContent = meta;
                clearInterval(timer);
            } else {
                el.textContent = Math.floor(actual);
            }
        }, duracion / pasos);
    };

    // Usar IntersectionObserver para disparar la animación al entrar en vista
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animarContador(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.4 });

    kpiValores.forEach(el => observer.observe(el));


    // ── 3. GRÁFICO DE PROGRESO SEMANAL ───────────
    const ctxProgreso = document.getElementById('grafico-progreso');
    if (ctxProgreso) {
        const datosSemana = {
            labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
            correctas: [10, 15, 8, 18, 12, 14, 10],
            incorrectas: [3, 2, 5, 1, 4, 2, 6],
        };
        const datosMes = {
            labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
            correctas: [45, 62, 58, 72],
            incorrectas: [12, 8, 15, 10],
        };

        let graficoProgreso = new Chart(ctxProgreso, {
            type: 'bar',
            data: {
                labels: datosSemana.labels,
                datasets: [
                    {
                        label: 'Correctas',
                        data: datosSemana.correctas,
                        backgroundColor: 'rgba(76, 175, 80, 0.85)',
                        borderRadius: 8,
                        borderSkipped: false,
                    },
                    {
                        label: 'Incorrectas',
                        data: datosSemana.incorrectas,
                        backgroundColor: 'rgba(233, 30, 99, 0.75)',
                        borderRadius: 8,
                        borderSkipped: false,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            pointStyle: 'circle',
                            font: { family: "'Plus Jakarta Sans', sans-serif", size: 12, weight: '600' },
                            color: '#37474F'
                        }
                    },
                    tooltip: {
                        backgroundColor: '#1A237E',
                        titleFont: { family: "'Outfit', sans-serif", size: 13 },
                        bodyFont: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
                        cornerRadius: 10,
                        padding: 12,
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            font: { family: "'Plus Jakarta Sans', sans-serif", size: 12, weight: '600' },
                            color: '#90A4AE'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.04)' },
                        ticks: {
                            font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 },
                            color: '#90A4AE',
                            stepSize: 5
                        }
                    }
                }
            }
        });

        // Selector Semana / Mes
        const periodos = document.querySelectorAll('.pd-periodo-btn');
        periodos.forEach(btn => {
            btn.addEventListener('click', () => {
                periodos.forEach(b => b.classList.remove('activo'));
                btn.classList.add('activo');

                const datos = btn.dataset.periodo === 'mes' ? datosMes : datosSemana;
                graficoProgreso.data.labels = datos.labels;
                graficoProgreso.data.datasets[0].data = datos.correctas;
                graficoProgreso.data.datasets[1].data = datos.incorrectas;
                graficoProgreso.update();
            });
        });
    }


    // ── 4. GRÁFICO DONUT — PRECISIÓN ─────────────
    const ctxPrecision = document.getElementById('grafico-precision');
    if (ctxPrecision) {
        new Chart(ctxPrecision, {
            type: 'doughnut',
            data: {
                labels: ['Correctas', 'Incorrectas'],
                datasets: [{
                    data: [87, 23],
                    backgroundColor: ['#4CAF50', '#E91E63'],
                    borderWidth: 0,
                    hoverOffset: 6,
                }]
            },
            options: {
                cutout: '70%',
                responsive: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1A237E',
                        titleFont: { family: "'Outfit', sans-serif" },
                        bodyFont: { family: "'Plus Jakarta Sans', sans-serif" },
                        cornerRadius: 10,
                        padding: 10,
                    }
                }
            }
        });
    }


    // ── 5. TOOLTIPS EN BARRAS DE LECTURA ─────────
    const barrasDia = document.querySelectorAll('.pd-dia-barra');
    barrasDia.forEach(barra => {
        barra.addEventListener('mouseenter', (e) => {
            const min = barra.dataset.min;
            const tooltip = document.createElement('div');
            tooltip.className = 'pd-tooltip-dinamico';
            tooltip.textContent = `${min} min`;
            document.body.appendChild(tooltip);

            const rect = barra.getBoundingClientRect();
            tooltip.style.cssText = `
                position: fixed;
                top: ${rect.top - 32}px;
                left: ${rect.left + rect.width / 2}px;
                transform: translateX(-50%);
                background: #37474F;
                color: white;
                font-size: 0.72rem;
                font-weight: 700;
                padding: 4px 8px;
                border-radius: 6px;
                pointer-events: none;
                z-index: 9999;
                font-family: 'Plus Jakarta Sans', sans-serif;
            `;

            barra.addEventListener('mouseleave', () => tooltip.remove(), { once: true });
        });
    });


    // ── 6. ANIMACIÓN BARRAS DE PROGRESO ──────────
    const barras = document.querySelectorAll('.pd-barra-llena, .pd-libro-barra, .pd-precision-barra');
    const obsBarra = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const ancho = entry.target.style.width;
                entry.target.style.width = '0%';
                setTimeout(() => {
                    entry.target.style.transition = 'width 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                    entry.target.style.width = ancho;
                }, 100);
                obsBarra.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    barras.forEach(b => obsBarra.observe(b));


    // ── 7. BOTÓN NOTIFICACIONES ───────────────────
    const btnNotif = document.getElementById('btn-notificaciones');
    if (btnNotif) {
        btnNotif.addEventListener('click', () => {
            alert('📬 Notificaciones:\n\n• Mateo completó el Capítulo 2 del Bosque Encantado\n• ¡Nuevo logro desbloqueado: Racha de 7 días!');
        });
    }

});
