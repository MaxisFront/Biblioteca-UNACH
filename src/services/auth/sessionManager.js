const adminSeasion = sessionStorage.getItem('admin');

if (!adminSeasion) {
    alert("Acceso denegado Usuario desconocido");
    window.location.href="/index.html"
}