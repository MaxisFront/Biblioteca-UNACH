import { CONFIG } from "../js/config.js";

const API_URL = `${CONFIG.API_URL}/autores`;

// ==========================================
// 1. CARGAR AUTORES EN EL SELECT
// ==========================================

/**
 * Consulta la API y llena el <select> de edición con los autores registrados.
 */
async function cargarSelectAutores() {
    const select = document.getElementById('author-edit-select');
    if (!select) return;

    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("No se pudieron cargar los autores");

        const autores = await response.json();

        // Limpiamos y mantenemos la opción por defecto
        select.innerHTML = '<option value="" disabled selected>Seleccionar autor...</option>';

        autores.forEach(autor => {
            const option = document.createElement('option');
            option.value = autor.id;
            option.textContent = autor.nombre;
            // Guardamos el nombre en un data-attribute para acceder rápido al seleccionar
            option.dataset.nombre = autor.nombre; 
            select.appendChild(option);
        });

    } catch (error) {
        console.error('Error al cargar catálogo de autores:', error);
    }
}

// ==========================================
// 2. REGISTRAR NUEVO AUTOR (POST)
// ==========================================

async function manejarSubmitCrear(e) {
    e.preventDefault();
    const form = e.target;
    const inputNombre = form.querySelector('#author-add-name');
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!inputNombre || !inputNombre.value.trim()) return;

    const payload = { nombre: inputNombre.value.trim() };

    try {
        if (submitBtn) submitBtn.disabled = true;

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const mensajeError = await procesarErrorBackend(response, payload.nombre);
            throw new Error(mensajeError);
        }

        const data = response.status !== 204 ? await response.json() : payload;
        alert(`Autor "${data.nombre || payload.nombre}" creado con éxito.`);

        cerrarDialogYResetear(form);

    } catch (error) {
        console.error('Error al guardar autor:', error);
        alert(error.message);
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}

// ==========================================
// 3. EDITAR AUTOR EXISTENTE (PUT)
// ==========================================

async function manejarSubmitEditar(e) {
    e.preventDefault();
    const form = e.target;
    const select = form.querySelector('#author-edit-select');
    const inputNombre = form.querySelector('#author-edit-name');
    const submitBtn = form.querySelector('button[type="submit"]');

    const idAutor = select?.value;
    const nuevoNombre = inputNombre?.value.trim();

    if (!idAutor || !nuevoNombre) {
        alert("Debes seleccionar un autor e ingresar un nuevo nombre.");
        return;
    }

    const payload = { nombre: nuevoNombre };

    try {
        if (submitBtn) submitBtn.disabled = true;

        // Petición PUT al endpoint individual /autores/{id}
        const response = await fetch(`${API_URL}/${idAutor}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const mensajeError = await procesarErrorBackend(response, nuevoNombre);
            throw new Error(mensajeError);
        }

        alert(`Autor actualizado con éxito a "${nuevoNombre}".`);

        cerrarDialogYResetear(form);

    } catch (error) {
        console.error('Error al editar autor:', error);
        alert(error.message);
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}

// ==========================================
// FUNCIONES AUXILIARES Y LISTENERS
// ==========================================

/**
 * Procesa mensajes de error de Spring Boot (duplicados, restricciones, etc.)
 */
async function procesarErrorBackend(response, nombre) {
    const textoError = await response.text();
    try {
        const jsonError = JSON.parse(textoError);
        const msjTecnico = (jsonError.message || "").toLowerCase();

        if (msjTecnico.includes("duplicate") || msjTecnico.includes("unique") || msjTecnico.includes("ya existe")) {
            return `El autor "${nombre}" ya se encuentra registrado en el sistema.`;
        }
        return jsonError.message || "No se pudo realizar la operación.";
    } catch {
        return textoError || "Error en el servidor.";
    }
}

function cerrarDialogYResetear(form) {
    const dialog = form.closest('dialog');
    if (dialog) dialog.close();
    form.reset();
}

// Inicialización de eventos al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    // Formulario de creación
    const addForm = document.getElementById('author-add-form');
    if (addForm) addForm.addEventListener('submit', manejarSubmitCrear);

    // Formulario de edición
    const editForm = document.getElementById('author-edit-form');
    if (editForm) editForm.addEventListener('submit', manejarSubmitEditar);

    // Autocompletar el input y habilitar el botón cuando el usuario selecciona un autor
    const editSelect = document.getElementById('author-edit-select');
    const editInput = document.getElementById('author-edit-name');
    const editSubmitBtn = editForm?.querySelector('button[type="submit"]');

    if (editSelect) {
        editSelect.addEventListener('change', (e) => {
            const selectedOption = e.target.options[e.target.selectedIndex];
            if (editInput) {
                editInput.value = selectedOption.dataset.nombre || selectedOption.textContent;
            }
            if (editSubmitBtn) {
                editSubmitBtn.disabled = false; // Habilitamos el botón al seleccionar
            }
        });
    }

    // Detectar cuando se abre el menú/modal de editar para cargar la lista actualizada
    const editOpenButtons = document.querySelectorAll('[data-open="author-edit-dialog"]');
    editOpenButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            cargarSelectAutores();
        });
    });
});