class SidebarComponent extends HTMLElement {

    constructor() {
        super();

        this.attachShadow({
            mode: "open"
        });
    }

    async connectedCallback() {
        await this.render();
    }

    async render() {

        const htmlResponse = await fetch(
            "../components/sidebar.html"
        );

        const html = await htmlResponse.text();

        this.shadowRoot.innerHTML = `

            ${html}
        `;
        this.selectorColor();

    }

    selectorColor() {
        const menuItems = this.shadowRoot.querySelectorAll(".sidebar-list .list-item");

        menuItems.forEach(item => {
            item.addEventListener("click", () => {

                const currentActive = this.shadowRoot.querySelector(".list-item.item--active");
                if (currentActive) {
                    currentActive.classList.remove("item--active");
                }

                item.classList.add("item--active");
            });
        });
    }
}
customElements.define(
    "mi-sidebar",
    SidebarComponent
);
