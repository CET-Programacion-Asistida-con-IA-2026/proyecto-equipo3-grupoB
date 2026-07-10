// ============================================
// PIONERAS — interactividad
// 1. Frase del día rotable
// 2. Buscador en vivo + filtro por categoría + favoritas
// 3. Modal con biografía completa
// 4. Favoritas guardadas en localStorage
// 5. Animación de aparición al hacer scroll
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  inicializarFraseDelDia();
  inicializarFiltrosYBusqueda();
  inicializarFavoritas();
  inicializarModal();
  inicializarAnimacionScroll();
});

// --------------------------------------------
// 1. Frase del día
// --------------------------------------------
function inicializarFraseDelDia() {
  const frases = [
    { texto: 'La imaginación es la facultad del descubrimiento', autor: 'Ada Lovelace' },
    { texto: 'En la vida no hay que temer nada, solo hay que entenderlo', autor: 'Marie Curie' },
    { texto: 'No importa cuán despacio vayas, siempre y cuando no te detengas', autor: 'Confucio' },
    { texto: 'La ciencia y la vida cotidiana no pueden ni deben separarse', autor: 'Rosalind Franklin' },
    { texto: 'El futuro pertenece a quienes creen en la belleza de sus sueños', autor: 'Eleanor Roosevelt' },
  ];

  const contenedor = document.querySelector('.frase-del-dia');
  const bloqueFrase = document.getElementById('frase-texto');
  const boton = document.getElementById('btn-frase');
  if (!contenedor || !bloqueFrase || !boton) return;

  let indiceActual = 0;

  function pintarFrase(indice) {
    const frase = frases[indice];
    bloqueFrase.innerHTML = `<p>${frase.texto}</p><footer>${frase.autor}</footer>`;
  }

  boton.addEventListener('click', () => {
    let siguiente = indiceActual;
    // evita repetir la misma frase dos veces seguidas
    while (siguiente === indiceActual && frases.length > 1) {
      siguiente = Math.floor(Math.random() * frases.length);
    }
    indiceActual = siguiente;

    contenedor.classList.add('cambiando');
    window.setTimeout(() => {
      pintarFrase(indiceActual);
      contenedor.classList.remove('cambiando');
    }, 200);
  });
}

// --------------------------------------------
// 2. Buscador + filtro por categoría + favoritas
// --------------------------------------------
function inicializarFiltrosYBusqueda() {
  const buscador = document.getElementById('buscador');
  const chips = document.querySelectorAll('.chip');
  const tarjetas = document.querySelectorAll('.tarjeta');
  const mensajeVacio = document.getElementById('sin-resultados');

  let filtroActivo = 'todas';

  function aplicarFiltros() {
    const texto = buscador.value.trim().toLowerCase();
    let algunaVisible = false;

    tarjetas.forEach(tarjeta => {
      const nombre = tarjeta.dataset.nombre.toLowerCase();
      const categorias = tarjeta.dataset.categorias;

      const coincideTexto = nombre.includes(texto);
      const coincideCategoria = filtroActivo === 'todas' || categorias.includes(filtroActivo);
      const coincideFavorita = filtroActivo !== 'favoritas' || tarjeta.classList.contains('es-favorita');

      const visible = coincideTexto &&
        (filtroActivo === 'favoritas' ? coincideFavorita : coincideCategoria);

      tarjeta.classList.toggle('oculta', !visible);
      if (visible) algunaVisible = true;
    });

    if (mensajeVacio) mensajeVacio.hidden = algunaVisible;
  }

  buscador.addEventListener('input', aplicarFiltros);

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('activo'));
      chip.classList.add('activo');
      filtroActivo = chip.dataset.filtro;
      aplicarFiltros();
    });
  });

  // Se expone para que el módulo de favoritas pueda re-filtrar
  // cuando el usuario marca/desmarca una tarjeta como favorita.
  window.__pioneras_aplicarFiltros = aplicarFiltros;
}

// --------------------------------------------
// 3. Favoritas (persisten en localStorage)
// --------------------------------------------
function inicializarFavoritas() {
  const CLAVE = 'pioneras-favoritas';
  const guardadas = new Set(JSON.parse(localStorage.getItem(CLAVE) || '[]'));

  function guardar() {
    localStorage.setItem(CLAVE, JSON.stringify([...guardadas]));
  }

  document.querySelectorAll('.tarjeta').forEach(tarjeta => {
    const nombre = tarjeta.dataset.nombre;
    const boton = tarjeta.querySelector('.favorito');
    if (!boton) return;

    if (guardadas.has(nombre)) {
      tarjeta.classList.add('es-favorita');
      boton.classList.add('activo');
      boton.setAttribute('aria-pressed', 'true');
      boton.querySelector('span').textContent = '♥';
    }

    boton.addEventListener('click', (evento) => {
      evento.stopPropagation(); // no abrir el modal al tocar el corazón

      const yaEsFavorita = guardadas.has(nombre);
      if (yaEsFavorita) {
        guardadas.delete(nombre);
      } else {
        guardadas.add(nombre);
      }

      tarjeta.classList.toggle('es-favorita', !yaEsFavorita);
      boton.classList.toggle('activo', !yaEsFavorita);
      boton.setAttribute('aria-pressed', String(!yaEsFavorita));
      boton.querySelector('span').textContent = !yaEsFavorita ? '♥' : '♡';

      guardar();

      if (typeof window.__pioneras_aplicarFiltros === 'function') {
        window.__pioneras_aplicarFiltros();
      }
    });
  });
}

// --------------------------------------------
// 4. Modal con biografía completa
// --------------------------------------------
function inicializarModal() {
  const modal = document.getElementById('modal');
  if (!modal) return;

  const modalImg = document.getElementById('modal-img');
  const modalNombre = document.getElementById('modal-nombre');
  const modalPills = document.getElementById('modal-pills');
  const modalBio = document.getElementById('modal-bio');

  let elementoQueAbrio = null;

  function abrirModal(tarjeta) {
    const nombre = tarjeta.dataset.nombre;
    const img = tarjeta.querySelector('.img-tarjeta');
    const pillsOriginales = tarjeta.querySelectorAll('.pill');
    const plantillaBio = tarjeta.querySelector('.bio-completa');

    modalImg.src = img.src;
    modalImg.alt = img.alt;
    modalNombre.textContent = nombre;

    modalPills.innerHTML = '';
    pillsOriginales.forEach(pill => {
      const copia = document.createElement('span');
      copia.className = 'pill';
      copia.textContent = pill.textContent;
      modalPills.appendChild(copia);
    });

    modalBio.innerHTML = plantillaBio ? plantillaBio.innerHTML : '';

    elementoQueAbrio = tarjeta;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    modal.querySelector('.modal-cerrar').focus();
  }

  function cerrarModal() {
    modal.hidden = true;
    document.body.style.overflow = '';
    if (elementoQueAbrio) elementoQueAbrio.focus();
  }

  document.querySelectorAll('.tarjeta').forEach(tarjeta => {
    tarjeta.setAttribute('tabindex', '0');
    tarjeta.setAttribute('role', 'button');

    tarjeta.addEventListener('click', () => abrirModal(tarjeta));
    tarjeta.addEventListener('keydown', (evento) => {
      if (evento.key === 'Enter' || evento.key === ' ') {
        evento.preventDefault();
        abrirModal(tarjeta);
      }
    });
  });

  modal.addEventListener('click', (evento) => {
    if (evento.target.dataset.cerrar) cerrarModal();
  });

  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && !modal.hidden) cerrarModal();
  });
}

// --------------------------------------------
// 5. Animación de aparición al hacer scroll
// --------------------------------------------
function inicializarAnimacionScroll() {
  const tarjetas = document.querySelectorAll('.tarjeta');
  const prefiereMenosMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefiereMenosMovimiento || !('IntersectionObserver' in window)) {
    tarjetas.forEach(t => t.classList.add('visible'));
    return;
  }

  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach(entrada => {
      if (entrada.isIntersecting) {
        entrada.target.classList.add('visible');
        observador.unobserve(entrada.target);
      }
    });
  }, { threshold: 0.15 });

  tarjetas.forEach(tarjeta => observador.observe(tarjeta));
}
