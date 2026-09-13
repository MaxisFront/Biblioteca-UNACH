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

        const cssResponse = await fetch(
            "../components/sidebar.css"
        );

        const html = await htmlResponse.text();
        const css = await cssResponse.text();

        this.shadowRoot.innerHTML = `
            <style>
                ${css}
            </style>

            ${html}
        `;
    }
}

customElements.define(
    "mi-sidebar",
    SidebarComponent
);
