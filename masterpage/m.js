document.addEventListener('DOMContentLoaded', () => {

    // --- 1. NAVEGACIÓN ACTIVA ---
    const enlacesNavegacion = document.querySelectorAll('.enlace-navegacion');
    
    // Resalta el enlace activo según la página actual o al hacer clic
    enlacesNavegacion.forEach(enlace => {
        enlace.addEventListener('click', () => {
            enlacesNavegacion.forEach(link => link.classList.remove('activo'));
            enlace.classList.add('activo');
        });
    });

    // Detectar página actual en la URL para marcar el enlace correspondiente
    const rutaActual = window.location.pathname;
    enlacesNavegacion.forEach(enlace => {
        const href = enlace.getAttribute('href');
        if (href && href !== '#' && rutaActual.includes(href)) {
            enlacesNavegacion.forEach(link => link.classList.remove('activo'));
            enlace.classList.add('activo');
        }
    });
});
