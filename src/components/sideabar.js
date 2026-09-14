class SidebarComponent extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
    }

    async connectedCallback() {
        await this.render();
    }

    async render() {
        const [htmlResponse, cssResponse] = await Promise.all([
            fetch("../components/sidebar.html"),
            fetch("../components/sidebar.css")
        ]);

        const html = await htmlResponse.text();
        const css = await cssResponse.text();

        this.shadowRoot.innerHTML = `
            <style>${css}</style>
            ${html}
        `;
        
        this.selectorColor();
    }

    selectorColor() {
        const targetId = this.getAttribute("active-item");
        if (!targetId) return;

        const activeItem = this.shadowRoot.querySelector(`[data-id="${targetId}"]`);
        
        if (activeItem) {
            const currentActive = this.shadowRoot.querySelector(".list-item.item--active");
            if (currentActive) currentActive.classList.remove("item--active");

            activeItem.classList.add("item--active");
        }
    }
}

customElements.define("mi-sidebar", SidebarComponent);
