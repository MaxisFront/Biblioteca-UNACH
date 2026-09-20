function setupModal(dialogId, openBtnSelector) {
    /** @type {HTMLDialogElement} */
    const dialog = document.getElementById(dialogId);
    /** @type {HTMLButtonElement} */
    const newBookBtn = document.querySelector(openBtnSelector);
    const closeBtn = document.querySelector(".modal__button--close");
    const cancelBtn = document.querySelector(".modal__button--cancel");

    if (newBookBtn && dialog) {
        newBookBtn.addEventListener("click", () => {
            dialog.showModal()
        })
    }
}

setupModal("loan-dialog", ".header__button .button__add")