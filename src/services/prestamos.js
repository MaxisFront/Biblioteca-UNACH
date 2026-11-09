import { CONFIG } from "../js/config.js";
import {
  ESTADOS_PRESTAMO,
  escaparHtml,
  estadoPrestamo,
  fetchConTimeout,
  formatearFecha,
  leerError,
  mensajeError,
  ordenarRecientes,
} from "../js/utils.js";

const API_PRESTAMOS = `${CONFIG.API_URL}/prestamos`;
const API_LIBROS = `${CONFIG.API_URL}/libros`;
const API_USUARIOS = `${CONFIG.API_URL}/users`;
const ESTADOS_USUARIO_INACTIVO = ["desactivado", "inactivo"];

// ==========================================
// 1. CARGAR Y RENDERIZAR TABLA DE PRÉSTAMOS
// ==========================================

function pintarMensaje(tabla, texto) {
  tabla.querySelectorAll(".table__row").forEach((fila) => fila.remove());

  const fila = document.createElement("div");
  fila.className = "table__row";
  fila.innerHTML = `<div class="table__cell" style="grid-column: 1 / -1; text-align: center;">${texto}</div>`;
  tabla.appendChild(fila);
}

function actualizarContador(prestamos) {
  const descripcion = document.querySelector(".header__description");
  if (!descripcion) return;

  const activos = prestamos.filter(
    (p) => estadoPrestamo(p) !== "DEVUELTO",
  ).length;
  descripcion.textContent =
    activos === 1 ? "1 préstamo activo" : `${activos} préstamos activos`;
}

function crearFila(prestamo) {
  const estado = ESTADOS_PRESTAMO[estadoPrestamo(prestamo)];
  const botonDevolver = prestamo.fechaDevolucionReal
    ? ""
    : `<button type="button" class="icon icon--return" title="Devolver libro" aria-label="Devolver">
               <img src="../assets/icons/Return.svg" alt="">
           </button>`;

  const fila = document.createElement("div");
  fila.className = "table__row";
  fila.innerHTML = `
        <div class="table__cell table__cell--title">${escaparHtml(prestamo.tituloLibro)}</div>
        <div class="table__cell table__cell--username">${escaparHtml(prestamo.nombreUsuario)}</div>
        <div class="table__cell table__cell--loan-date">${formatearFecha(prestamo.fechaPrestamo)}</div>
        <div class="table__cell table__cell--due-date">${formatearFecha(prestamo.fechaDevolucionAsignada)}</div>
        <div class="table__cell table__cell--return-date">${formatearFecha(prestamo.fechaDevolucionReal)}</div>
        <div class="table__cell table__cell--status">
            <span class="status ${estado.clase}">${estado.texto}</span>
        </div>
        <div class="table__row-actions">${botonDevolver}</div>
    `;

  const boton = fila.querySelector(".icon--return");
  if (boton)
    boton.addEventListener("click", () => registrarDevolucion(prestamo));

  return fila;
}

async function cargarTablaPrestamos() {
  const tabla = document.querySelector(".table");
  if (!tabla) return;

  let prestamos;
  try {
    const response = await fetchConTimeout(API_PRESTAMOS);
    if (!response.ok) throw new Error(await leerError(response));
    prestamos = ordenarRecientes(await response.json());
  } catch (error) {
    console.error("Error al cargar los préstamos:", error);
    pintarMensaje(tabla, "No se pudieron cargar los préstamos.");
    return;
  }

  actualizarContador(prestamos);

  if (prestamos.length === 0) {
    pintarMensaje(tabla, "No hay préstamos registrados.");
    return;
  }

  tabla.querySelectorAll(".table__row").forEach((fila) => fila.remove());
  prestamos.forEach((prestamo) => tabla.appendChild(crearFila(prestamo)));
}

// ==========================================
// 2. DEVOLUCIÓN
// ==========================================

async function registrarDevolucion(prestamo) {
  const confirmado = confirm(
    `¿Registrar la devolución de "${prestamo.tituloLibro}" de ${prestamo.nombreUsuario}?`,
  );
  if (!confirmado) return;

  try {
    const response = await fetchConTimeout(
      `${API_PRESTAMOS}/${prestamo.idPrestamo}/devolucion`,
      { method: "PUT" },
    );
    if (!response.ok) throw new Error(await leerError(response));

    alert("Devolución registrada correctamente.");
    cargarTablaPrestamos();
  } catch (error) {
    alert(mensajeError(error));
  }
}

// ==========================================
// 3. FORMULARIO DE NUEVO PRÉSTAMO
// ==========================================

async function obtenerLista(url) {
  const response = await fetchConTimeout(url);
  if (!response.ok) throw new Error(await leerError(response));
  return response.json();
}

function llenarSelect(
  select,
  resultado,
  textoVacio,
  textoSeleccion,
  convertirAOpcion,
) {
  if (resultado.status !== "fulfilled") {
    console.error("Error al cargar el desplegable:", resultado.reason);
    select.innerHTML =
      '<option value="" disabled selected>Error al cargar datos</option>';
    return;
  }

  const opciones = resultado.value.map(convertirAOpcion).filter(Boolean);
  if (opciones.length === 0) {
    select.innerHTML = `<option value="" disabled selected>${textoVacio}</option>`;
    return;
  }

  select.innerHTML = `<option value="" disabled selected>${textoSeleccion}</option>${opciones.join("")}`;
}

async function cargarSelectsPrestamo() {
  const selectLibro = document.getElementById("loan-book");
  const selectUsuario = document.getElementById("loan-user");

  selectLibro.innerHTML =
    '<option value="" disabled selected>Cargando libros...</option>';
  selectUsuario.innerHTML =
    '<option value="" disabled selected>Cargando usuarios...</option>';

  const [libros, usuarios] = await Promise.allSettled([
    obtenerLista(API_LIBROS),
    obtenerLista(API_USUARIOS),
  ]);

  llenarSelect(
    selectLibro,
    libros,
    "No hay libros disponibles",
    "Seleccionar libro...",
    (libro) => {
      if (!(libro.ejemplaresDisponibles > 0)) return null;
      return `<option value="${libro.id}">${escaparHtml(libro.titulo)} — ${escaparHtml(libro.autor)}</option>`;
    },
  );

  llenarSelect(
    selectUsuario,
    usuarios,
    "No hay usuarios activos",
    "Seleccionar usuario...",
    (usuario) => {
      const estado = (
        usuario.estado ??
        usuario.estatus ??
        "activo"
      ).toLowerCase();
      if (ESTADOS_USUARIO_INACTIVO.includes(estado)) return null;

      const nombre =
        `${usuario.nombre ?? ""} ${usuario.apellidos ?? usuario.apellido ?? ""}`.trim();
      return `<option value="${usuario.id}">${escaparHtml(nombre)}</option>`;
    },
  );
}

function fechaLocalISO(diasDesdeHoy) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + diasDesdeHoy);
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

function configurarFechaLimite() {
  const inputFecha = document.getElementById("loan-date");
  inputFecha.min = fechaLocalISO(1);
  inputFecha.max = fechaLocalISO(21);
}

async function buscarEjemplarDisponible(idLibro) {
  const ejemplares = await obtenerLista(`${API_LIBROS}/${idLibro}/ejemplares`);
  const disponible = ejemplares.find((ejemplar) => !ejemplar.prestado);
  if (!disponible)
    throw new Error("Ya no hay ejemplares disponibles de este libro.");
  return disponible.id;
}

async function manejarSubmitPrestamo(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');

  const idLibro = document.getElementById("loan-book").value;
  const idUsuario = document.getElementById("loan-user").value;
  const fechaLimite = document.getElementById("loan-date").value;
  if (!idLibro || !idUsuario || !fechaLimite) return;

  try {
    if (submitBtn) submitBtn.disabled = true;

    const payload = {
      idUsuario: Number(idUsuario),
      idEjemplar: await buscarEjemplarDisponible(idLibro),
      fechaDevolucionAsignada: `${fechaLimite}T23:59:59`,
    };

    const response = await fetchConTimeout(API_PRESTAMOS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await leerError(response));

    const prestamo = await response.json();
    alert(
      `Préstamo de "${prestamo.tituloLibro}" registrado para ${prestamo.nombreUsuario}.`,
    );

    form.closest("dialog")?.close();
    form.reset();
    cargarTablaPrestamos();
  } catch (error) {
    alert(mensajeError(error));
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

// Listeners globales
document.addEventListener("DOMContentLoaded", () => {
  cargarTablaPrestamos();

  const form = document.getElementById("loan-form");
  if (form) form.addEventListener("submit", manejarSubmitPrestamo);

  document.querySelectorAll('[data-open="loan-add-dialog"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      cargarSelectsPrestamo();
      configurarFechaLimite();
    });
  });
});
