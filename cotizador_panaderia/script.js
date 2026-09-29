const CATALOGO = [
    { id: "masa-madre", nombre: "Pan de masa madre", precio: 18 },
    { id: "alfajores", nombre: "Caja de alfajores", precio: 24 },
    { id: "torta", nombre: "Torta pequeña", precio: 45 }
];

const CLAVE_PEDIDO = "pedidoPanaderia";
const REPARTO = 8;

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formulario-pedido");
    const tabla = document.getElementById("lista-productos");
    const fecha = document.getElementById("fecha");

    if (fecha) {
        fecha.min = new Date().toISOString().split("T")[0];
    }

    if (tabla) {
        renderCatalogo(tabla);
    }

    if (form) {
        actualizarResumen();
        form.addEventListener("input", actualizarResumen);
        form.addEventListener("change", actualizarResumen);
        form.addEventListener("submit", enviarPedido);
    }

    mostrarResumen();
});

function renderCatalogo(tabla) {
    for (const producto of CATALOGO) {
        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td><input class="form-check-input producto-check" type="checkbox" data-id="${producto.id}"></td>
            <td>${producto.nombre}</td>
            <td>S/ ${producto.precio.toFixed(2)}</td>
            <td style="max-width: 120px;">
                <input class="form-control producto-cantidad" type="number" min="1" max="10" step="1" value="1" data-id="${producto.id}">
            </td>
        `;
        tabla.appendChild(fila);
    }
}

function leerProductos() {
    const checks = document.querySelectorAll(".producto-check");
    const cantidades = document.querySelectorAll(".producto-cantidad");
    const productos = [];

    for (const check of checks) {
        if (!check.checked) continue;

        const id = check.dataset.id;
        const cantidadInput = [...cantidades].find((input) => input.dataset.id === id);
        const cantidad = Number(cantidadInput.value);
        const producto = CATALOGO.find((item) => item.id === id);

        if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 10) {
            return { productos: [], error: "Cada cantidad debe ser entera entre 1 y 10." };
        }

        productos.push({ ...producto, cantidad });
    }

    if (productos.length === 0) {
        return { productos: [], error: "Selecciona al menos un producto." };
    }

    return { productos, error: "" };
}

function calcularSubtotal(productos) {
    let subtotal = 0;
    for (const producto of productos) {
        subtotal += producto.precio * producto.cantidad;
    }
    return subtotal;
}

function calcularDescuento(subtotal) {
    if (subtotal >= 100) {
        return subtotal * 0.1;
    }
    return 0;
}

function calcularReparto() {
    const modalidad = document.getElementById("modalidad").value;
    if (modalidad === "reparto") {
        return REPARTO;
    }
    return 0;
}

function calcularTotal(subtotal, descuento, reparto) {
    return subtotal - descuento + reparto;
}

function actualizarResumen() {
    if (!document.getElementById("subtotal")) {
        return;
    }

    const resultado = leerProductos();
    const errorProductos = document.getElementById("error-productos");

    if (errorProductos) {
        errorProductos.textContent = resultado.error;
    }

    if (resultado.error) {
        pintarMontos(0, 0, 0, 0);
        return;
    }

    const subtotal = calcularSubtotal(resultado.productos);
    const descuento = calcularDescuento(subtotal);
    const reparto = calcularReparto();
    const total = calcularTotal(subtotal, descuento, reparto);

    pintarMontos(subtotal, descuento, reparto, total);
}

function pintarMontos(subtotal, descuento, reparto, total) {
    const subtotalEl = document.getElementById("subtotal");
    const descuentoEl = document.getElementById("descuento");
    const repartoEl = document.getElementById("reparto");
    const totalEl = document.getElementById("total");

    if (!subtotalEl || !descuentoEl || !repartoEl || !totalEl) {
        return;
    }

    subtotalEl.textContent = `S/ ${subtotal.toFixed(2)}`;
    descuentoEl.textContent = `S/ ${descuento.toFixed(2)}`;
    repartoEl.textContent = `S/ ${reparto.toFixed(2)}`;
    totalEl.textContent = `S/ ${total.toFixed(2)}`;
}

function enviarPedido(event) {
    event.preventDefault();

    const cliente = document.getElementById("cliente").value.trim();
    const correo = document.getElementById("correo").value.trim();
    const fecha = document.getElementById("fecha").value;
    const modalidad = document.getElementById("modalidad").value;
    const resultado = leerProductos();

    limpiarErrores();

    let valido = true;

    if (cliente.length < 3 || cliente.length > 60) {
        setError("cliente", "El nombre debe tener entre 3 y 60 caracteres.");
        valido = false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
        setError("correo", "Ingresa un correo valido.");
        valido = false;
    }

    if (!fecha) {
        setError("fecha", "Selecciona una fecha de entrega.");
        valido = false;
    }

    if (!modalidad) {
        setError("modalidad", "Selecciona retiro o reparto.");
        valido = false;
    }

    if (resultado.error) {
        setError("productos", resultado.error);
        valido = false;
    }

    if (!valido) {
        return;
    }

    const subtotal = calcularSubtotal(resultado.productos);
    const descuento = calcularDescuento(subtotal);
    const reparto = calcularReparto();
    const total = calcularTotal(subtotal, descuento, reparto);

    const pedido = {
        cliente,
        correo,
        fecha,
        modalidad,
        productos: resultado.productos,
        subtotal,
        descuento,
        reparto,
        total
    };

    sessionStorage.setItem(CLAVE_PEDIDO, JSON.stringify(pedido));
    window.location.href = "resumen-pedido.html";
}

function setError(campo, mensaje) {
    const error = document.getElementById("error-" + campo);
    if (error) {
        error.textContent = mensaje;
    }
}

function limpiarErrores() {
    ["cliente", "correo", "fecha", "modalidad", "productos"].forEach((campo) => setError(campo, ""));
}

function mostrarResumen() {
    const contenedor = document.getElementById("resumen-pedido");
    if (!contenedor) return;

    const raw = sessionStorage.getItem(CLAVE_PEDIDO);
    if (!raw) {
        contenedor.innerHTML = `
            <div class="alert alert-warning">No hay datos de pedido. Vuelve al formulario.</div>
            <a class="btn btn-primary" href="pedido.html">Volver</a>
        `;
        return;
    }

    const pedido = JSON.parse(raw);
    const filas = pedido.productos.map((p) => `
        <tr>
            <td>${p.nombre}</td>
            <td>${p.cantidad}</td>
            <td>S/ ${p.precio.toFixed(2)}</td>
            <td>S/ ${(p.precio * p.cantidad).toFixed(2)}</td>
        </tr>
    `).join("");

    contenedor.innerHTML = `
        <div class="alert alert-success">Pedido calculado correctamente.</div>
        <div class="mb-3">
            <p class="mb-1"><strong>Cliente:</strong> ${pedido.cliente}</p>
            <p class="mb-1"><strong>Correo:</strong> ${pedido.correo}</p>
            <p class="mb-1"><strong>Fecha:</strong> ${pedido.fecha}</p>
            <p class="mb-1"><strong>Modalidad:</strong> ${pedido.modalidad}</p>
        </div>
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Importe</th></tr>
                </thead>
                <tbody>${filas}</tbody>
            </table>
        </div>
        <div class="border rounded-3 p-3 bg-white">
            <div class="d-flex justify-content-between"><span>Subtotal</span><strong>S/ ${pedido.subtotal.toFixed(2)}</strong></div>
            <div class="d-flex justify-content-between"><span>Descuento</span><strong>S/ ${pedido.descuento.toFixed(2)}</strong></div>
            <div class="d-flex justify-content-between"><span>Reparto</span><strong>S/ ${pedido.reparto.toFixed(2)}</strong></div>
            <hr>
            <div class="d-flex justify-content-between fs-5"><span>Total</span><strong>S/ ${pedido.total.toFixed(2)}</strong></div>
        </div>
        <div class="mt-3">
            <a class="btn btn-outline-primary" href="pedido.html">Nuevo pedido</a>
        </div>
    `;
}