export const ESTADOS_PRESTAMO = {
  ACTIVO: { clase: "status--active", texto: "Activo" },
  VENCIDO: { clase: "status--expired", texto: "Vencido" },
  DEVUELTO: { clase: "status--delivered", texto: "Devuelto" },
};

export async function fetchConTimeout(resource, options = {}, timeout = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(resource, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

export async function leerError(response) {
  const texto = await response.text();
  try {
    const json = JSON.parse(texto);
    if (Array.isArray(json.errors) && json.errors.length > 0) {
      return json.errors.map((e) => e.defaultMessage || String(e)).join(", ");
    }
    return json.message || `Error ${response.status}: operación fallida.`;
  } catch {
    return texto || `Error ${response.status} en la API.`;
  }
}

export function mensajeError(error) {
  const sinConexion =
    error.name === "AbortError" || /fetch/i.test(error.message);
  return sinConexion ? "No se pudo conectar con el servidor." : error.message;
}

export function escaparHtml(texto) {
  const reemplazos = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return String(texto ?? "").replace(
    /[&<>"']/g,
    (caracter) => reemplazos[caracter],
  );
}

function aFecha(valor) {
  return valor ? new Date(valor.slice(0, 19)) : null;
}

export function formatearFecha(valor) {
  const fecha = aFecha(valor);
  if (!fecha) return "------";
  return fecha
    .toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replace(/\./g, "");
}

export function estadoPrestamo(prestamo) {
  if (prestamo.fechaDevolucionReal || prestamo.estatus === "DEVUELTO")
    return "DEVUELTO";
  return aFecha(prestamo.fechaDevolucionAsignada) < new Date()
    ? "VENCIDO"
    : "ACTIVO";
}

export function ordenarRecientes(prestamos) {
  return [...prestamos].sort(
    (a, b) =>
      (b.fechaPrestamo || "").localeCompare(a.fechaPrestamo || "") ||
      b.idPrestamo - a.idPrestamo,
  );
}
