import { CONFIG } from "../js/config.js";

const API_URL = `${CONFIG.API_URL}/users`;

let usuariosCache = [];

// ==========================================
// 1. CARGAR Y RENDERIZAR LISTA DE USUARIOS
// ==========================================

async function cargarYRenderizarUsuarios() {
    const container = document.querySelector('.users__list');
    const description = document.querySelector('.users__description');
    if (!container) return;

    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("No se pudieron cargar los usuarios.");

        usuariosCache = await response.json();

        if (description) {
            description.textContent = `${usuariosCache.length} Usuarios registrados`;
        }

        container.innerHTML = "";

        if (usuariosCache.length === 0) {
            container.innerHTML = `<p style="text-align: center; padding: 2rem; color: #666;">No hay usuarios registrados.</p>`;
            return;
        }

        usuariosCache.forEach(user => {
            const nombreCompleto = `${user.nombre || ""} ${user.apellido || ""}`.trim() || "Sin nombre";
            const correo = user.email || "Sin correo";
            const telefono = user.telefono || "Sin teléfono";
            const estado = (user.estado || "activo").toLowerCase();
            const fechaRegistro = user.fechaRegistro || "Reciente";

            const statusClass = estado === "activo" ? "user__status--activo" : "user__status--desactivado";

            const userCard = document.createElement('div');
            userCard.className = 'user';
            userCard.innerHTML = `
                <div class="user__info">
                    <div class="user__title">
                        <p class="user__name">${nombreCompleto}</p>
                        <span class="user__status ${statusClass}">${estado.charAt(0).toUpperCase() + estado.slice(1)}</span>
                    </div>

                    <div class="user__contact">
                        <p class="user__mail">${correo}</p>
                        <p class="user__tel">${telefono}</p>
                    </div>
                </div>

                <p class="user__fecha-registro">Desde ${fechaRegistro}</p>

                <div class="user__actions">
                    <button class="icon icon--edit" title="Editar usuario" aria-label="Editar">
                        <img src="../assets/icons/Edit.svg" alt="">
                    </button>
                    <button class="icon icon--delete" title="Eliminar usuario" aria-label="Eliminar">
                        <img src="../assets/icons/Trash.svg" alt="">
                    </button>
                </div>
            `;

            // Listeners para eliminar y editar
            userCard.querySelector('.icon--delete').addEventListener('click', () => eliminarUsuario(user.id, nombreCompleto));
            userCard.querySelector('.icon--edit').addEventListener('click', () => abrirModalEdicion(user.id));

            container.appendChild(userCard);
        });

    } catch (error) {
        console.error('Error al cargar usuarios:', error);
    }
}

// ==========================================
// 2. CARGAR SELECT EN MODAL DE EDICIÓN
// ==========================================

async function cargarSelectUsuarios() {
    const select = document.getElementById('user-edit-select');
    if (!select) return;

    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Error al obtener los usuarios para edición");

        const usuarios = await response.json();
        usuariosCache = usuarios;

        select.innerHTML = '<option value="" disabled selected>Seleccionar usuario...</option>';

        usuarios.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = `${user.nombre || ""} ${user.apellido || ""}`.trim();
            select.appendChild(option);
        });

    } catch (error) {
        console.error('Error al poblar select de edición:', error);
    }
}

// ==========================================
// 3. REGISTRAR NUEVO USUARIO (POST)
// ==========================================

async function manejarSubmitCrear(e) {
    e.preventDefault();
    const form = e.target;
    const inputNombre = form.querySelector('#user-name');
    const inputApellido = form.querySelector('#user-lastname');
    const selectSexo = form.querySelector('#user-sex');
    const inputMail = form.querySelector('#user-mail');
    const inputTel = form.querySelector('#user-tel');
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!inputNombre || !inputApellido || !selectSexo || !inputMail || !inputTel) return;

    const payload = {
        nombre: inputNombre.value.trim(),
        apellido: inputApellido.value.trim(),
        sexo: selectSexo.value,
        email: inputMail.value.trim(),
        telefono: inputTel.value.trim()
    };

    try {
        if (submitBtn) submitBtn.disabled = true;

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const mensajeError = await procesarErrorBackend(response);
            throw new Error(mensajeError);
        }

        alert(`Usuario "${payload.nombre} ${payload.apellido}" creado con éxito.`);
        cerrarDialogYResetear(form);
        await cargarYRenderizarUsuarios();

    } catch (error) {
        console.error('Error al guardar usuario:', error);
        alert(error.message);
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}

// ==========================================
// 4. EDITAR USUARIO EXISTENTE (PUT)
// ==========================================

async function manejarSubmitEditar(e) {
    e.preventDefault();
    const form = e.target;
    const select = form.querySelector('#user-edit-select');
    const inputNombre = form.querySelector('#user-edit-name');
    const inputApellido = form.querySelector('#user-edit-lastname');
    const selectSexo = form.querySelector('#user-edit-sex');
    const inputMail = form.querySelector('#user-edit-mail');
    const inputTel = form.querySelector('#user-edit-tel');
    const selectStatus = form.querySelector('#user-edit-status');
    const submitBtn = form.querySelector('button[type="submit"]');

    const idUsuario = select?.value;
    if (!idUsuario) {
        alert("Debes seleccionar un usuario.");
        return;
    }

    const payload = {
        nombre: inputNombre?.value.trim(),
        apellido: inputApellido?.value.trim(),
        sexo: selectSexo?.value,
        email: inputMail?.value.trim(),
        telefono: inputTel?.value.trim(),
        estado: selectStatus?.value
    };

    try {
        if (submitBtn) submitBtn.disabled = true;

        const response = await fetch(`${API_URL}/${idUsuario}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const mensajeError = await procesarErrorBackend(response);
            throw new Error(mensajeError);
        }

        alert(`Usuario actualizado con éxito.`);
        cerrarDialogYResetear(form);
        await cargarYRenderizarUsuarios();

    } catch (error) {
        console.error('Error al editar usuario:', error);
        alert(error.message);
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}

// ==========================================
// 5. ELIMINAR USUARIO (DELETE)
// ==========================================

async function eliminarUsuario(id, nombre) {
    if (!confirm(`¿Estás seguro de que deseas eliminar al usuario "${nombre}"?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error("No se pudo eliminar el usuario.");

        alert(`Usuario eliminado correctamente.`);
        await cargarYRenderizarUsuarios();

    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        alert(error.message);
    }
}

// ==========================================
// FUNCIONES AUXILIARES Y LISTENERS
// ==========================================

function abrirModalEdicion(id) {
    const dialog = document.getElementById('user-edit-dialog');
    const select = document.getElementById('user-edit-select');
    if (select && dialog) {
        select.value = id;
        select.dispatchEvent(new Event('change'));
        dialog.showModal();
    }
}

async function procesarErrorBackend(response) {
    const textoError = await response.text();
    try {
        const jsonError = JSON.parse(textoError);
        if (jsonError.errors && Array.isArray(jsonError.errors)) {
            return jsonError.errors.map(err => `- [${err.field}]: ${err.defaultMessage}`).join('\n');
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
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
}

// Inicialización de eventos al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    cargarYRenderizarUsuarios();

    // Formulario de creación
    const addForm = document.getElementById('user-form');
    if (addForm) {
        addForm.addEventListener('submit', manejarSubmitCrear);
    }

    // Formulario de edición
    const editForm = document.getElementById('user-edit-form');
    if (editForm) {
        editForm.addEventListener('submit', manejarSubmitEditar);
    }

    // Autocompletar campos al seleccionar un usuario en el <select> de edición
    const editSelect = document.getElementById('user-edit-select');
    const inputNombre = document.getElementById('user-edit-name');
    const inputApellido = document.getElementById('user-edit-lastname');
    const selectSexo = document.getElementById('user-edit-sex');
    const inputMail = document.getElementById('user-edit-mail');
    const inputTel = document.getElementById('user-edit-tel');
    const selectStatus = document.getElementById('user-edit-status');
    const editSubmitBtn = editForm?.querySelector('button[type="submit"]');

    if (editSelect) {
        editSelect.addEventListener('change', (e) => {
            const selectedId = e.target.value;
            const userEncontrado = usuariosCache.find(u => String(u.id) === String(selectedId));

            if (userEncontrado) {
                if (inputNombre) inputNombre.value = userEncontrado.nombre || '';
                if (inputApellido) inputApellido.value = userEncontrado.apellido || '';
                if (selectSexo) selectSexo.value = userEncontrado.sexo || '';
                if (inputMail) inputMail.value = userEncontrado.email || '';
                if (inputTel) inputTel.value = userEncontrado.telefono || '';
                if (selectStatus) selectStatus.value = (userEncontrado.estado || 'activo').toLowerCase();
                if (editSubmitBtn) editSubmitBtn.disabled = false;
            }
        });
    }

    // Abrir modal de edición y cargar usuarios
    document.querySelectorAll('[data-open="user-edit-dialog"]').forEach(btn => {
        btn.addEventListener('click', () => {
            cargarSelectUsuarios();
        });
    });

    // Búsqueda en tiempo real
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const termino = e.target.value.toLowerCase().trim();
            const usuariosFiltrados = usuariosCache.filter(u => 
                (`${u.nombre || ""} ${u.apellido || ""}`.toLowerCase()).includes(termino) ||
                (u.telefono || '').toLowerCase().includes(termino)
            );
            
            const container = document.querySelector('.users__list');
            if (!container) return;
            container.innerHTML = "";

            if (usuariosFiltrados.length === 0) {
                container.innerHTML = `<p style="text-align: center; padding: 2rem; color: #666;">No se encontraron usuarios.</p>`;
                return;
            }

            usuariosFiltrados.forEach(user => {
                const nombreCompleto = `${user.nombre || ""} ${user.apellido || ""}`.trim() || "Sin nombre";
                const correo = user.email || "Sin correo";
                const telefono = user.telefono || "Sin teléfono";
                const estado = (user.estado || "activo").toLowerCase();
                const fechaRegistro = user.fechaRegistro || "Reciente";
                const statusClass = estado === "activo" ? "user__status--activo" : "user__status--desactivado";

                const userCard = document.createElement('div');
                userCard.className = 'user';
                userCard.innerHTML = `
                    <div class="user__info">
                        <div class="user__title">
                            <p class="user__name">${nombreCompleto}</p>
                            <span class="user__status ${statusClass}">${estado.charAt(0).toUpperCase() + estado.slice(1)}</span>
                        </div>
                        <div class="user__contact">
                            <p class="user__mail">${correo}</p>
                            <p class="user__tel">${telefono}</p>
                        </div>
                    </div>
                    <p class="user__fecha-registro">Desde ${fechaRegistro}</p>
                    <div class="user__actions">
                        <button class="icon icon--edit" title="Editar usuario" aria-label="Editar"><img src="../assets/icons/Edit.svg" alt=""></button>
                        <button class="icon icon--delete" title="Eliminar usuario" aria-label="Eliminar"><img src="../assets/icons/Trash.svg" alt=""></button>
                    </div>
                `;
                userCard.querySelector('.icon--delete').addEventListener('click', () => eliminarUsuario(user.id, nombreCompleto));
                userCard.querySelector('.icon--edit').addEventListener('click', () => abrirModalEdicion(user.id));
                container.appendChild(userCard);
            });
        });
    }
});