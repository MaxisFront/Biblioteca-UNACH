import { CONFIG } from "../js/config.js";
import {
    ESTADOS_PRESTAMO,
    escaparHtml,
    estadoPrestamo,
    fetchConTimeout,
    formatearFecha,
    ordenarRecientes
} from "../js/utils.js";

const MAX_PRESTAMOS_RECIENTES = 10;

async function obtenerLista(ruta) {
    const response = await fetchConTimeout(`${CONFIG.API_URL}/${ruta}`);
    if (!response.ok) throw new Error(`Error ${response.status} al consultar /${ruta}`);
    return response.json();
}

function mostrarNumero(selector, valor) {
    const elemento = document.querySelector(selector);
    if (elemento) elemento.textContent = valor;
}

function pintarPrestamosRecientes(prestamos) {
    const tabla = document.querySelector(".table");
    if (!tabla) return;

    tabla.querySelectorAll(".table__row").forEach(fila => fila.remove());

    if (prestamos.length === 0) {
        const fila = document.createElement("div");
        fila.className = "table__row";
        fila.innerHTML = `<div class="table__cell" style="grid-column: 1 / -1; text-align: center;">No hay préstamos registrados.</div>`;
        tabla.appendChild(fila);
        return;
    }

    prestamos.forEach(prestamo => {
        const estado = ESTADOS_PRESTAMO[estadoPrestamo(prestamo)];

        const fila = document.createElement("div");
        fila.className = "table__row";
        fila.innerHTML = `
            <div class="table__cell table__cell--title">${escaparHtml(prestamo.tituloLibro)}</div>
            <div class="table__cell table__cell--username">${escaparHtml(prestamo.nombreUsuario)}</div>
            <div class="table__cell table__cell--expiration">${formatearFecha(prestamo.fechaDevolucionAsignada)}</div>
            <div class="table__cell table__cell--status">
                <span class="status ${estado.clase}">${estado.texto}</span>
            </div>
        `;
        tabla.appendChild(fila);
    });
}

async function cargarDashboard() {
    const [libros, usuarios, prestamos] = await Promise.allSettled([
        obtenerLista("libros"),
        obtenerLista("users"),
        obtenerLista("prestamos")
    ]);

    mostrarNumero(".card__number--books", libros.status === "fulfilled" ? libros.value.length : "–");
    mostrarNumero(".card__number--users", usuarios.status === "fulfilled" ? usuarios.value.length : "–");

    if (prestamos.status !== "fulfilled") {
        console.error("Error al cargar los préstamos:", prestamos.reason);
        mostrarNumero(".card__number--loans", "–");
        return;
    }

    const recientes = ordenarRecientes(prestamos.value);
    const activos = recientes.filter(p => estadoPrestamo(p) !== "DEVUELTO").length;

    mostrarNumero(".card__number--loans", activos);
    pintarPrestamosRecientes(recientes.slice(0, MAX_PRESTAMOS_RECIENTES));
}

document.addEventListener("DOMContentLoaded", cargarDashboard);

░▒▓ ~/De/ca/src  ccat services/dashboard.js                      ✔ │ 12:29:39  ▓▒░
░▒▓ ~/De/ca/src  ccat services/dashboard.js                      ✔ │ 12:29:39  ▓▒░
import { CONFIG } from "../js/config.js";
import {
    ESTADOS_PRESTAMO,
    escaparHtml,
    estadoPrestamo,
    fetchConTimeout,
    formatearFecha,
    ordenarRecientes
} from "../js/utils.js";

const MAX_PRESTAMOS_RECIENTES = 10;

async function obtenerLista(ruta) {
    const response = await fetchConTimeout(`${CONFIG.API_URL}/${ruta}`);
    if (!response.ok) throw new Error(`Error ${response.status} al consultar /${ruta}`);
    return response.json();
}

function mostrarNumero(selector, valor) {
    const elemento = document.querySelector(selector);
    if (elemento) elemento.textContent = valor;
}

function pintarPrestamosRecientes(prestamos) {
    const tabla = document.querySelector(".table");
    if (!tabla) return;

    tabla.querySelectorAll(".table__row").forEach(fila => fila.remove());

    if (prestamos.length === 0) {
        const fila = document.createElement("div");
        fila.className = "table__row";
        fila.innerHTML = `<div class="table__cell" style="grid-column: 1 / -1; text-align: center;">No hay préstamos registrados.</div>`;
        tabla.appendChild(fila);
        return;
    }

    prestamos.forEach(prestamo => {
        const estado = ESTADOS_PRESTAMO[estadoPrestamo(prestamo)];

        const fila = document.createElement("div");
        fila.className = "table__row";
        fila.innerHTML = `
            <div class="table__cell table__cell--title">${escaparHtml(prestamo.tituloLibro)}</div>
            <div class="table__cell table__cell--username">${escaparHtml(prestamo.nombreUsuario)}</div>
            <div class="table__cell table__cell--expiration">${formatearFecha(prestamo.fechaDevolucionAsignada)}</div>
            <div class="table__cell table__cell--status">
                <span class="status ${estado.clase}">${estado.texto}</span>
            </div>
        `;
        tabla.appendChild(fila);
    });
}

async function cargarDashboard() {
    const [libros, usuarios, prestamos] = await Promise.allSettled([
        obtenerLista("libros"),
        obtenerLista("users"),
        obtenerLista("prestamos")
    ]);

    mostrarNumero(".card__number--books", libros.status === "fulfilled" ? libros.value.length : "–");
    mostrarNumero(".card__number--users", usuarios.status === "fulfilled" ? usuarios.value.length : "–");

    if (prestamos.status !== "fulfilled") {
        console.error("Error al cargar los préstamos:", prestamos.reason);
        mostrarNumero(".card__number--loans", "–");
        return;
    }

    const recientes = ordenarRecientes(prestamos.value);
    const activos = recientes.filter(p => estadoPrestamo(p) !== "DEVUELTO").length;

    mostrarNumero(".card__number--loans", activos);
    pintarPrestamosRecientes(recientes.slice(0, MAX_PRESTAMOS_RECIENTES));
}

document.addEventListener("DOMContentLoaded", cargarDashboard);
