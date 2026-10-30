function setupModal(dialogId, openBtnSelector) {
    /** @type {HTMLDialogElement} */
    const dialog = document.getElementById(dialogId);
    /** @type {HTMLButtonElement} */
    const newBookBtn = document.querySelector(openBtnSelector);

    if (!dialog) return

    /** @type {HTMLButtonElement} */
    const closeBtn = dialog.querySelector(".modal__button--close");
    /** @type {HTMLButtonElement} */
    const cancelBtn = dialog.querySelector(".modal__button--cancel");

    if (newBookBtn && dialog) {
        newBookBtn.addEventListener("click", () => { dialog.showModal() })
    }

    if (closeBtn && dialog) {
        closeBtn.addEventListener("click", () => dialog.close())
    }

    if (cancelBtn && dialog) {
        cancelBtn.addEventListener("click", () => dialog.close())
    }

    if (dialog) {
        dialog.addEventListener("click", (e) => {
            if (e.target === dialog) dialog.close();
        })
    }
}

setupModal("loan-dialog", ".header__button .button__add");
setupModal("books-dialog", ".header__button .button__add");
setupModal("users-dialog", ".header__button .button__add");
setupModal("author-dialog", ".author__button .button__add");
setupModal("editorial-dialog", ".editorial__button .button__add");

