import { CONFIG } from "../../js/config.js";  

function errorMessage(mensaje) {
    const errorMessage = document.querySelector(".form__error")
    if (errorMessage) {
        errorMessage.textContent = mensaje
        errorMessage.style.display = "block"
    }
}

async function iniciarSesion(e) {
    e.preventDefault();

    const email = document.querySelector("#email").value;
    const password = document.querySelector("#password").value;

    try {
        const response = await fetch(`${CONFIG.API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok || !data.nombreAdministrador) {
            errorMessage("Correo o contraseña incorrectos")
            form.reset();
            return;
        }

        sessionStorage.setItem("admin", data.nombreAdministrador);
        window.location.href = "./src/views/dashboard.html";
    } catch (error) {
        errorMessage("El servidor no responde");
    }
}

const form = document.querySelector(".form__container");
form.addEventListener("submit", iniciarSesion);