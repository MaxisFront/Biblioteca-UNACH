import { CONFIG } from "../js/config.js";

const API_LIBROS = `${CONFIG.API_URL}/libros`;
const API_AUTORES = `${CONFIG.API_URL}/autores`;
const API_EDITORIALES = `${CONFIG.API_URL}/editoriales`;

let librosCache = [];

// Helper con timeout para evitar peticiones infinitas
async function fetchConTimeout(resource, options = {}, timeout = 5000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(resource, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
}

// ==========================================
// 1. CARGAR Y RENDERIZAR TABLA DE LIBROS (Adaptado a tu DTO de Java)
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
        librosCache = libros; // Actualizamos la caché general

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
            // Mapeo exacto basado en tu LibroResponseDTO de Spring Boot:
            const titulo = libro.titulo || "Sin título";
            const autor = libro.autor || "Desconocido"; // Ya viene como String desde Java
            const genero = libro.genero || "Sin género";
            
            // Si tu DTO no tiene año, se evalúa de forma segura
            const anio = libro.anioPublicacion || libro.anio || "N/A"; 
            
            // Cantidades provistas por los count() de tus repositorios en Java
            const ejemplares = libro.cantidadEjemplares ?? 0;
            const disponibles = libro.cantidadDisponibles ?? 0;

            const claseDisponibilidad = disponibles > 0 ? "disponibility--active" : "disponibility--unavailable";

            const row = document.createElement("div");
            row.className = "table__row";

            row.innerHTML = `
                <div class="table__cell table__cell--title">${titulo}</div>
                <div class="table__cell table__cell--author">${autor}</div>
                <div class="table__cell table__cell--genre">${genero}</div>
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
// 2. CARGAR SELECTS DE AUTOR Y EDITORIAL
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
                        selectAutor.innerHTML += `<option value="${a.id}">${a.nombre}</option>`;
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
                        selectEditorial.innerHTML += `<option value="${e.id}">${e.nombre}</option>`;
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
            select.innerHTML += `<option value="${libro.id}">${libro.titulo} (${libro.isbn || 'Sin ISBN'})</option>`;
        });
    } catch (error) {
        console.error('Error al obtener libros:', error);
        select.innerHTML = '<option value="" disabled selected>Error al cargar libros</option>';
    }
}

function autocompletarEdicion(idLibro) {
    const libro = librosCache.find(l => String(l.id) === String(idLibro));
    if (!libro) return;

    document.getElementById('book-edit-name').value = libro.titulo || '';
    document.getElementById('book-edit-isbn').value = libro.isbn || '';
    document.getElementById('book-edit-genre').value = libro.genero || '';
    document.getElementById('book-edit-year').value = libro.anioPublicacion || libro.anio || '';
    document.getElementById('book-edit-copies').value = libro.cantidadEjemplares || libro.ejemplares || '';
    document.getElementById('book-edit-available').value = libro.cantidadDisponibles || libro.disponibles || '';

    const selectAutor = document.getElementById('book-edit-author-select');
    if (selectAutor) selectAutor.value = libro.autor?.id || libro.autorId || '';

    const selectEditorial = document.getElementById('book-edit-editorial-select');
    if (selectEditorial) selectEditorial.value = libro.editorial?.id || libro.editorialId || '';

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

    const payload = {
        titulo: document.getElementById('book-name').value.trim(),
        isbn: document.getElementById('isbn-value').value.trim(),
        genero: document.getElementById('genre-name').value.trim(),
        autorId: Number(autorId),
        editorialId: editorialId ? Number(editorialId) : null,
        anioPublicacion: Number(document.getElementById('year-value').value),
        cantidadEjemplares: Number(document.getElementById('copies-value').value),
        cantidadDisponibles: Number(document.getElementById('available-books-value').value)
    };

    try {
        if (submitBtn) submitBtn.disabled = true;

        const response = await fetch(API_LIBROS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(await procesarErrorBackend(response, payload.titulo));

        const data = await response.json();
        alert(`Libro "${data.titulo || payload.titulo}" guardado exitosamente.`);
        cerrarDialogYResetear(form);
        
        // Recargamos la tabla automáticamente tras crear
        cargarYRenderizarTablaLibros();

    } catch (error) {
        alert(error.message);
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

    const payload = {
        titulo: document.getElementById('book-edit-name').value.trim(),
        isbn: document.getElementById('book-edit-isbn').value.trim(),
        genero: document.getElementById('book-edit-genre').value.trim(),
        autorId: Number(autorId),
        editorialId: editorialId ? Number(editorialId) : null,
        anioPublicacion: Number(document.getElementById('book-edit-year').value),
        cantidadEjemplares: Number(document.getElementById('book-edit-copies').value),
        cantidadDisponibles: Number(document.getElementById('book-edit-available').value)
    };

    try {
        if (submitBtn) submitBtn.disabled = true;

        const response = await fetch(`${API_LIBROS}/${idLibro}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(await procesarErrorBackend(response, payload.titulo));

        const data = await response.json();
        alert(`Libro "${data.titulo || payload.titulo}" actualizado exitosamente.`);
        cerrarDialogYResetear(form);

        // Recargamos la tabla automáticamente tras editar
        cargarYRenderizarTablaLibros();

    } catch (error) {
        alert(error.message);
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}

// Auxiliares
async function procesarErrorBackend(response, titulo) {
    const textoError = await response.text();
    try {
        const jsonError = JSON.parse(textoError);
        if (jsonError.errors && Array.isArray(jsonError.errors)) return jsonError.errors.join(", ");
        return jsonError.message || `Error ${response.status}: Operación fallida.`;
    } catch {
        return textoError || `Error ${response.status} en la API.`;
    }
}

function cerrarDialogYResetear(form) {
    const dialog = form.closest('dialog');
    if (dialog) dialog.close();
    form.reset();
}

// Listeners globales
document.addEventListener('DOMContentLoaded', () => {
    // Cargar la tabla automáticamente al iniciar el dashboard
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
        btn.addEventListener('click', () => cargarDesplegablesFormulario('book-form'));
    });

    document.querySelectorAll('[data-open="book-edit-dialog"]').forEach(btn => {
        btn.addEventListener('click', () => {
            cargarDesplegablesFormulario('book-edit-form');
            cargarSelectLibrosEdicion();
        });
    });
});