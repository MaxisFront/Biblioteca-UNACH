/* Modales: cualquier elemento con data-open="id-del-dialog" abre ese <dialog> */
document.querySelectorAll("[data-open]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
        /** @type {HTMLDialogElement | null} */
        const dialog = document.getElementById(trigger.dataset.open);
        if (dialog) dialog.showModal();
    });
});

/* Cierre de todos los <dialog>: botón X, botón Cancelar y clic en el fondo */
document.querySelectorAll("dialog").forEach((dialog) => {
    dialog
        .querySelectorAll(".modal__button--close, .modal__button--cancel")
        .forEach((btn) => btn.addEventListener("click", () => dialog.close()));

    dialog.addEventListener("click", (e) => {
        if (e.target === dialog) dialog.close();
    });
});

/* Dropdowns de los botones del header (Añadir / Editar en Libros) */
const dropdowns = document.querySelectorAll(".dropdown");

function setDropdown(dropdown, open) {
    dropdown.classList.toggle("is-open", open);
    dropdown.querySelector(".dropdown__toggle").setAttribute("aria-expanded", String(open));
}

function closeDropdowns() {
    dropdowns.forEach((dropdown) => setDropdown(dropdown, false));
}

dropdowns.forEach((dropdown) => {
    const toggle = dropdown.querySelector(".dropdown__toggle");

    toggle.addEventListener("click", (e) => {
        e.stopPropagation();
        const willOpen = !dropdown.classList.contains("is-open");
        closeDropdowns();
        setDropdown(dropdown, willOpen);
    });
});

document.addEventListener("click", closeDropdowns);
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDropdowns();
});
