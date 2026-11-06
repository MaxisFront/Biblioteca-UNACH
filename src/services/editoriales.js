import { CONFIG } from "../js/config.js";

const API_URL = `${CONFIG.API_URL}/editoriales`;

// ==========================================
// 1. CARGAR EDITORIALES EN EL SELECT
// ==========================================

/**
 * Consulta la API y llena el <select> de edición con las editoriales registradas.
 */
async function cargarSelectEditoriales() {
    const select = document.getElementById('editorial-edit-select');
    if (!select) return;

    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("No se pudieron cargar las editoriales");

        const editoriales = await response.json();

        // Limpiamos y mantenemos la opción por defecto
        select.innerHTML = '<option value="" disabled selected>Seleccionar editorial...</option>';

        editoriales.forEach(editorial => {
            const option = document.createElement('option');
            option.value = editorial.id; // Asegúrate de que coincida con la clave id de tu backend
            option.textContent = editorial.nombre;
            // Guardamos el nombre en un data-attribute para acceder rápido al seleccionar
            option.dataset.nombre = editorial.nombre; 
            select.appendChild(option);
        });

    } catch (error) {
        console.error('Error al cargar catálogo de editoriales:', error);
    }
}

// ==========================================
// 2. REGISTRAR NUEVA EDITORIAL (POST)
// ==========================================

async function manejarSubmitCrear(e) {
    e.preventDefault();
    const form = e.target;
    const inputNombre = form.querySelector('#editorial-add-name');
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
        alert(`Editorial "${data.nombre || payload.nombre}" creada con éxito.`);

        cerrarDialogYResetear(form);

    } catch (error) {
        console.error('Error al guardar editorial:', error);
        alert(error.message);
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}

// ==========================================
// 3. EDITAR EDITORIAL EXISTENTE (PUT)
// ==========================================

async function manejarSubmitEditar(e) {
    e.preventDefault();
    const form = e.target;
    const select = form.querySelector('#editorial-edit-select');
    const inputNombre = form.querySelector('#editorial-edit-name');
    const submitBtn = form.querySelector('button[type="submit"]');

    const idEditorial = select?.value;
    const nuevoNombre = inputNombre?.value.trim();

    if (!idEditorial || !nuevoNombre) {
        alert("Debes seleccionar una editorial e ingresar un nuevo nombre.");
        return;
    }

    const payload = { nombre: nuevoNombre };

    try {
        if (submitBtn) submitBtn.disabled = true;

        // Petición PUT al endpoint individual /editoriales/{id}
        const response = await fetch(`${API_URL}/${idEditorial}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const mensajeError = await procesarErrorBackend(response, nuevoNombre);
            throw new Error(mensajeError);
        }

        alert(`Editorial actualizada con éxito a "${nuevoNombre}".`);

        cerrarDialogYResetear(form);

    } catch (error) {
        console.error('Error al editar editorial:', error);
        alert(error.message);
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}

// ==========================================
// FUNCIONES AUXILIARES Y LISTENERS
// ==========================================

/**
 * Procesa mensajes de error de Spring Boot (duplicados, resticciones, etc.)
 */
async function procesarErrorBackend(response, nombre) {
    const textoError = await response.text();
    try {
        const jsonError = JSON.parse(textoError);
        const msjTecnico = (jsonError.message || "").toLowerCase();

        if (msjTecnico.includes("duplicate") || msjTecnico.includes("unique") || msjTecnico.includes("ya existe")) {
            return `La editorial "${nombre}" ya se encuentra registrada en el sistema.`;
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
    const addForm = document.getElementById('editorial-add-form');
    if (addForm) addForm.addEventListener('submit', manejarSubmitCrear);

    // Formulario de edición
    const editForm = document.getElementById('editorial-edit-form');
    if (editForm) editForm.addEventListener('submit', manejarSubmitEditar);

    // Autocompletar el input y habilitar el botón cuando el usuario selecciona una editorial
    const editSelect = document.getElementById('editorial-edit-select');
    const editInput = document.getElementById('editorial-edit-name');
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
    const editOpenButtons = document.querySelectorAll('[data-open="editorial-edit-dialog"]');
    editOpenButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            cargarSelectEditoriales();
        });
    });
});