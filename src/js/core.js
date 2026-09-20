function setupModal(dialogId, openBtnSelector) {
    const dialog = document.getElementById(dialogId);
    const newBookBtn = document.querySelector(openBtnSelector);
    const closeBtn = document.querySelector("modal__button--close");
    const cancelBtn = document.querySelector(".modal__button--cancel");
}

setupModal("loan-dialog", ".header__button button__add")