import { CONFIG } from "../js/config.js";
import { escaparHtml, fetchConTimeout, leerError, mensajeError } from "../js/utils.js";

const API_LIBROS = `${CONFIG.API_URL}/libros`;
const API_AUTORES = `${CONFIG.API_URL}/autores`;
const API_EDITORIALES = `${CONFIG.API_URL}/editoriales`;
const API_GENEROS = `${CONFIG.API_URL}/generos`;

let librosCache = [];

// ==========================================
// 1. CARGAR Y RENDERIZAR TABLA DE LIBROS
// ==========================================

async function cargarYRenderizarTablaLibros() {
    const container = document.querySelector(".table");
    if (!container) return;

    // Guardamos la cabecera para no perderla al limpiar
    const headerRow = container.querySelector(".table__header-row");

    try {
        const response = await fetchConTimeout(API_LIBROS);
        if (!response.ok) throw new Error("Error al obtener los libros");

        const libros = await response.json();
        librosCache = libros;

        const descripcion = document.querySelector(".header__description");
        if (descripcion) {
            descripcion.textContent = libros.length === 1 ? "1 libro registrado" : `${libros.length} libros registrados`;
        }

        // Limpiamos el contenedor manteniendo la cabecera
        container.innerHTML = "";
        if (headerRow) {
            container.appendChild(headerRow);
        }

        if (!libros || libros.length === 0) {
            const mensajeVacio = document.createElement("div");
            mensajeVacio.className = "table__row";
            mensajeVacio.innerHTML = `<div class="table__cell" style="grid-column: 1 / -1; text-align: center;">No hay libros registrados.</div>`;
            container.appendChild(mensajeVacio);
            return;
        }

        libros.forEach(libro => {
            const titulo = libro.titulo || "Sin título";
            const autor = libro.autor || "Desconocido";
            const genero = libro.genero || "Sin género";
            const anio = libro.anioPublicacion || "N/A";

            // Ambos valores se calculan en el backend contando filas de Ejemplar
            const ejemplares = libro.totalEjemplares ?? 0;
            const disponibles = libro.ejemplaresDisponibles ?? 0;

            const claseDisponibilidad = disponibles > 0 ? "disponibility--active" : "disponibility--unavailable";

            const row = document.createElement("div");
            row.className = "table__row";

            row.innerHTML = `
                <div class="table__cell table__cell--title">${escaparHtml(titulo)}</div>
                <div class="table__cell table__cell--author">${escaparHtml(autor)}</div>
                <div class="table__cell table__cell--genre">${escaparHtml(genero)}</div>
                <div class="table__cell table__cell--year">${anio}</div>
                <div class="table__cell table__cell--copies">${ejemplares}</div>
                <div class="table__cell table__cell--disponibility">
                    <span class="${claseDisponibilidad}">${disponibles}</span>
                </div>
            `;

            container.appendChild(row);
        });

    } catch (error) {
        console.error("Error al cargar la tabla de libros:", error);
    }
}

// ==========================================
// 2. CARGAR SELECTS DE AUTOR Y EDITORIAL, Y SUGERENCIAS DE GÉNERO
// ==========================================

async function cargarDesplegablesFormulario(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    const selectAutor = form.querySelector('#book-author-select, #book-edit-author-select');
    const selectEditorial = form.querySelector('#book-editorial-select, #book-edit-editorial-select');

    // Estado inicial visual
    if (selectAutor) selectAutor.innerHTML = '<option value="" disabled selected>Cargando autores...</option>';
    if (selectEditorial) selectEditorial.innerHTML = '<option value="" disabled selected>Cargando editoriales...</option>';

    // Ejecutar ambas peticiones a la vez
    const [resAutores, resEditoriales] = await Promise.allSettled([
        selectAutor ? fetchConTimeout(API_AUTORES) : Promise.resolve(null),
        selectEditorial ? fetchConTimeout(API_EDITORIALES) : Promise.resolve(null)
    ]);

    // Procesar Autores
    if (selectAutor) {
        if (resAutores.status === "fulfilled" && resAutores.value && resAutores.value.ok) {
            try {
                const autores = await resAutores.value.json();
                if (autores.length === 0) {
                    selectAutor.innerHTML = '<option value="" disabled selected>No hay autores registrados</option>';
                } else {
                    selectAutor.innerHTML = '<option value="" disabled selected>Seleccionar autor...</option>';
                    autores.forEach(a => {
                        selectAutor.innerHTML += `<option value="${a.id}">${escaparHtml(a.nombre)}</option>`;
                    });
                }
            } catch (e) {
                selectAutor.innerHTML = '<option value="" disabled selected>Error al procesar datos</option>';
            }
        } else {
            console.error("Error al cargar autores:", resAutores.reason || resAutores.value?.statusText);
            selectAutor.innerHTML = '<option value="" disabled selected>Error al cargar autores</option>';
        }
    }

    // Procesar Editoriales
    if (selectEditorial) {
        if (resEditoriales.status === "fulfilled" && resEditoriales.value && resEditoriales.value.ok) {
            try {
                const editoriales = await resEditoriales.value.json();
                if (editoriales.length === 0) {
                    selectEditorial.innerHTML = '<option value="" disabled selected>No hay editoriales registradas</option>';
                } else {
                    selectEditorial.innerHTML = '<option value="" disabled selected>Seleccionar editorial...</option>';
                    editoriales.forEach(e => {
                        selectEditorial.innerHTML += `<option value="${e.id}">${escaparHtml(e.nombre)}</option>`;
                    });
                }
            } catch (e) {
                selectEditorial.innerHTML = '<option value="" disabled selected>Error al procesar datos</option>';
            }
        } else {
            console.error("Error al cargar editoriales:", resEditoriales.reason || resEditoriales.value?.statusText);
            selectEditorial.innerHTML = '<option value="" disabled selected>Error al cargar editoriales</option>';
        }
    }
}

async function cargarSugerenciasGenero() {
    const lista = document.getElementById('genre-options');
    if (!lista) return;

    try {
        const response = await fetchConTimeout(API_GENEROS);
        if (!response.ok) throw new Error("No se pudieron cargar los géneros");

        const generos = await response.json();
        lista.innerHTML = generos.map(g => `<option value="${escaparHtml(g.nombre)}"></option>`).join("");
    } catch (error) {
        console.error("Error al cargar géneros:", error);
    }
}

// El género se escribe como texto libre: si ya existe se reutiliza, si no se crea
async function obtenerOCrearGenero(nombre) {
    const response = await fetchConTimeout(API_GENEROS);
    if (!response.ok) throw new Error(await leerError(response));

    const generos = await response.json();
    const existente = generos.find(g => g.nombre.toLowerCase() === nombre.toLowerCase());
    if (existente) return existente.id;

    const creado = await fetchConTimeout(API_GENEROS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre })
    });
    if (!creado.ok) throw new Error(await leerError(creado));

    return (await creado.json()).id;
}

// ==========================================
// 3. CARGAR Y AUTOCOMPLETAR EDICIÓN
// ==========================================

async function cargarSelectLibrosEdicion() {
    const select = document.getElementById('book-edit-select');
    if (!select) return;

    try {
        select.innerHTML = '<option value="" disabled selected>Cargando libros...</option>';
        const response = await fetchConTimeout(API_LIBROS);
        if (!response.ok) throw new Error("No se pudieron cargar los libros");

        librosCache = await response.json();
        select.innerHTML = '<option value="" disabled selected>Seleccionar libro...</option>';

        librosCache.forEach(libro => {
            select.innerHTML += `<option value="${libro.id}">${escaparHtml(libro.titulo)} (${escaparHtml(libro.isbn || 'Sin ISBN')})</option>`;
        });
    } catch (error) {
        console.error('Error al obtener libros:', error);
        select.innerHTML = '<option value="" disabled selected>Error al cargar libros</option>';
    }
}

// La respuesta trae autor y editorial como nombre, así que se selecciona la opción con ese texto
function seleccionarPorTexto(select, texto) {
    if (!select) return;
    const opcion = Array.from(select.options).find(o => o.textContent === texto);
    select.value = opcion ? opcion.value : '';
}

function autocompletarEdicion(idLibro) {
    const libro = librosCache.find(l => String(l.id) === String(idLibro));
    if (!libro) return;

    document.getElementById('book-edit-name').value = libro.titulo || '';
    document.getElementById('book-edit-isbn').value = libro.isbn || '';
    document.getElementById('book-edit-genre').value = libro.genero || '';
    document.getElementById('book-edit-year').value = libro.anioPublicacion || '';
    document.getElementById('book-edit-copies').value = libro.totalEjemplares ?? 0;

    seleccionarPorTexto(document.getElementById('book-edit-author-select'), libro.autor);
    seleccionarPorTexto(document.getElementById('book-edit-editorial-select'), libro.editorial);

    const submitBtn = document.querySelector('#book-edit-form button[type="submit"]');
    if (submitBtn) submitBtn.disabled = false;
}

// ==========================================
// 4. ENVÍO DE FORMULARIOS (POST Y PUT)
// ==========================================

async function manejarSubmitCrear(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');

    const autorId = document.getElementById('book-author-select')?.value;
    const editorialId = document.getElementById('book-editorial-select')?.value;
    const cantidadEjemplares = Number(document.getElementById('copies-value').value);
    const titulo = document.getElementById('book-name').value.trim();

    try {
        if (submitBtn) submitBtn.disabled = true;

        const payload = {
            titulo,
            isbn: document.getElementById('isbn-value').value.trim(),
            anioPublicacion: Number(document.getElementById('year-value').value),
            idAutor: Number(autorId),
            idGenero: await obtenerOCrearGenero(document.getElementById('genre-name').value.trim()),
            idEditorial: editorialId ? Number(editorialId) : null
        };

        const response = await fetchConTimeout(API_LIBROS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(await leerError(response));

        const libro = await response.json();

        // Cada ejemplar es una fila en la tabla Ejemplar; la disponibilidad se calcula con los préstamos
        const respuestaEjemplares = await fetchConTimeout(`${API_LIBROS}/${libro.id}/ejemplares`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cantidad: cantidadEjemplares })
        });

        if (!respuestaEjemplares.ok) {
            const motivo = await leerError(respuestaEjemplares);
            alert(`El libro "${libro.titulo}" se guardó, pero no se pudieron crear sus ejemplares: ${motivo}`);
        } else {
            alert(`Libro "${libro.titulo}" guardado exitosamente con ${cantidadEjemplares} ejemplar(es).`);
        }

        cerrarDialogYResetear(form);
        cargarYRenderizarTablaLibros();

    } catch (error) {
        alert(mensajeError(error));
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}

async function manejarSubmitEditar(e) {
    e.preventDefault();
    const form = e.target;
    const select = document.getElementById('book-edit-select');
    const submitBtn = form.querySelector('button[type="submit"]');

    const idLibro = select?.value;
    if (!idLibro) return;

    const autorId = document.getElementById('book-edit-author-select')?.value;
    const editorialId = document.getElementById('book-edit-editorial-select')?.value;

    try {
        if (submitBtn) submitBtn.disabled = true;

        const payload = {
            titulo: document.getElementById('book-edit-name').value.trim(),
            isbn: document.getElementById('book-edit-isbn').value.trim(),
            anioPublicacion: Number(document.getElementById('book-edit-year').value),
            idAutor: Number(autorId),
            idGenero: await obtenerOCrearGenero(document.getElementById('book-edit-genre').value.trim()),
            idEditorial: editorialId ? Number(editorialId) : null
        };

        const response = await fetchConTimeout(`${API_LIBROS}/${idLibro}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(await leerError(response));

        const data = await response.json();
        alert(`Libro "${data.titulo || payload.titulo}" actualizado exitosamente.`);
        cerrarDialogYResetear(form);

        cargarYRenderizarTablaLibros();

    } catch (error) {
        alert(mensajeError(error));
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}

// Auxiliares
function cerrarDialogYResetear(form) {
    const dialog = form.closest('dialog');
    if (dialog) dialog.close();
    form.reset();
}

// Listeners globales
document.addEventListener('DOMContentLoaded', () => {
    // Cargar la tabla automáticamente al iniciar
    cargarYRenderizarTablaLibros();

    const addForm = document.getElementById('book-form');
    if (addForm) addForm.addEventListener('submit', manejarSubmitCrear);

    const editForm = document.getElementById('book-edit-form');
    if (editForm) editForm.addEventListener('submit', manejarSubmitEditar);

    const editSelect = document.getElementById('book-edit-select');
    if (editSelect) {
        editSelect.addEventListener('change', (e) => autocompletarEdicion(e.target.value));
    }

    // Escuchadores de apertura de modales
    document.querySelectorAll('[data-open="book-add-dialog"]').forEach(btn => {
        btn.addEventListener('click', () => {
            cargarDesplegablesFormulario('book-form');
            cargarSugerenciasGenero();
        });
    });

    document.querySelectorAll('[data-open="book-edit-dialog"]').forEach(btn => {
        btn.addEventListener('click', () => {
            cargarDesplegablesFormulario('book-edit-form');
            cargarSelectLibrosEdicion();
            cargarSugerenciasGenero();
        });
    });
});
