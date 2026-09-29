const HORARIOS = ["9:00", "10:00", "11:00", "15:00", "16:00"];
const HORARIO_BLOQUEADO = "11:00";
const STORAGE_KEY = "solicitudCita";

document.addEventListener("DOMContentLoaded", () => {
    initFormulario();
    initConfirmacion();
});

function initFormulario() {
    const form = document.getElementById("formulario-cita");
    if (!form) return;

    poblarHorarios();
    precargarSolicitud();

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const datos = leerFormulario();
        const errores = validar(datos);
        pintarErrores(errores);

        if (Object.values(errores).some(Boolean)) return;

        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(datos));
        window.location.href = "confirmacion-cita.html";
    });
}

function poblarHorarios() {
    const select = document.getElementById("horario");
    const mensaje = document.getElementById("mensaje-horarios");
    if (!select) return;

    let habilitados = 0;
    for (const h of HORARIOS) {
        const op = document.createElement("option");
        op.value = h;
        if (h === HORARIO_BLOQUEADO) {
            op.disabled = true;
            op.textContent = h + " (no disponible)";
        } else {
            op.textContent = h;
            habilitados += 1;
        }
        select.appendChild(op);
    }

    if (!mensaje) return;
    if (habilitados === 0) {
        select.disabled = true;
        mensaje.className = "form-text text-danger";
        mensaje.textContent = "No hay horarios habilitados.";
    } else {
        mensaje.className = "form-text text-muted";
        mensaje.textContent = "El horario 11:00 no esta disponible.";
    }
}

function leerFormulario() {
    return {
        nombre: document.getElementById("nombre").value.trim(),
        email: document.getElementById("email").value.trim(),
        fecha: document.getElementById("fecha").value,
        especialidad: document.getElementById("especialidad").value,
        horario: document.getElementById("horario").value
    };
}

function validar(d) {
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email);
    return {
        nombre: d.nombre.length >= 3 ? "" : "El nombre debe tener al menos 3 caracteres.",
        email: emailOk ? "" : "Ingresa un correo valido.",
        fecha: d.fecha ? "" : "Selecciona una fecha.",
        especialidad: d.especialidad ? "" : "Selecciona una especialidad.",
        horario: !d.horario
            ? "Selecciona un horario."
            : d.horario === HORARIO_BLOQUEADO
                ? "El horario 11:00 no esta disponible."
                : ""
    };
}

function pintarErrores(errores) {
    const campos = ["nombre", "email", "fecha", "especialidad", "horario"];
    for (const c of campos) {
        const msg = errores[c] || "";
        const errorEl = document.getElementById("error-" + c);
        const inputEl = document.getElementById(c);
        if (!errorEl || !inputEl) continue;
        errorEl.textContent = msg;
        inputEl.classList.toggle("is-invalid", !!msg);
    }
}

function precargarSolicitud() {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
        const d = JSON.parse(raw);
        setVal("nombre", d.nombre);
        setVal("email", d.email);
        setVal("fecha", d.fecha);
        setVal("especialidad", d.especialidad);
        setVal("horario", d.horario);
    } catch (_e) {
        sessionStorage.removeItem(STORAGE_KEY);
    }
}



function initConfirmacion() {
    const estado = document.getElementById("estado-confirmacion");
    const resumen = document.getElementById("resumen-solicitud");
    if (!estado || !resumen) return;

    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
        estado.innerHTML = "<div class=\"alert alert-warning\">No hay datos de solicitud.</div>";
        resumen.innerHTML = "<a href=\"cita.html\" class=\"btn btn-primary\">Volver</a>";
        return;
    }

    let d;
    try {
        d = JSON.parse(raw);
    } catch (_e) {
        estado.innerHTML = "<div class=\"alert alert-danger\">Datos invalidos en sessionStorage.</div>";
        resumen.innerHTML = "<a href=\"cita.html\" class=\"btn btn-primary\">Volver</a>";
        return;
    }

    if (!d.nombre || !d.especialidad || !d.fecha || !d.horario) {
        estado.innerHTML = "<div class=\"alert alert-warning\">La solicitud esta incompleta.</div>";
        resumen.innerHTML = "<a href=\"cita.html\" class=\"btn btn-primary\">Corregir solicitud</a>";
        return;
    }

    estado.innerHTML = "<div class=\"alert alert-success\">Solicitud confirmada.</div>";
    resumen.innerHTML = ""
        + "<ul class=\"list-group\">"
        + "<li class=\"list-group-item\"><strong>Nombre:</strong> " + esc(d.nombre) + "</li>"
        + "<li class=\"list-group-item\"><strong>Especialidad:</strong> " + esc(d.especialidad) + "</li>"
        + "<li class=\"list-group-item\"><strong>Fecha:</strong> " + esc(d.fecha) + "</li>"
        + "<li class=\"list-group-item\"><strong>Horario:</strong> " + esc(d.horario) + "</li>"
        + "</ul>";
}

function esc(texto) {
    return String(texto)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}
