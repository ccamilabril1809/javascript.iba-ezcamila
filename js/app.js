
// CONFIGURACIÓN

const TH_OK_MAX = 1.0;
const TH_WARN_MAX = 2.5;
const LS_KEY = "simRegistrosInexactitud";

let registros = [];



// FUNCIONES DE CÁLCULO

function calcularPct(pedidos, reclamos) {
    if (!Number.isFinite(pedidos) || !Number.isFinite(reclamos) || pedidos <= 0 || reclamos < 0) {
        return null;
    }
    return Number(((reclamos / pedidos) * 100).toFixed(2));
}

function estadoSegunPct(pct) {
    if (pct === null) return "INVÁLIDO";
    if (pct <= TH_OK_MAX) return "OK";
    if (pct <= TH_WARN_MAX) return "REVISAR";
    return "CRÍTICO";
}

function getBadgeClass(estado) {
    switch (estado) {
        case "OK":
            return "badge text-bg-success badge-round";
        case "REVISAR":
            return "badge text-bg-warning text-dark badge-round";
        case "CRÍTICO":
            return "badge text-bg-danger badge-round";
        default:
            return "badge text-bg-secondary badge-round";
    }
}


// LOCAL STORAGE

function guardarEnLocalStorage() {
    localStorage.setItem(LS_KEY, JSON.stringify(registros));
}

function cargarDeLocalStorage() {
    try {
        const data = localStorage.getItem(LS_KEY);
        registros = data ? JSON.parse(data) : [];
    } catch {
        registros = [];
    }
}



// RENDER

function renderTabla() {
    const tbody = document.getElementById("tablaBody");
    const msgSinDatos = document.getElementById("msgSinDatos");

    tbody.innerHTML = "";

    if (registros.length === 0) {
        msgSinDatos.classList.remove("d-none");
        return;
    }
    msgSinDatos.classList.add("d-none");

    registros.forEach((r, index) => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${r.etiqueta}</td>
            <td class="text-end mono">${r.pedidos}</td>
            <td class="text-end mono">${r.reclamos}</td>
            <td class="text-end mono">${r.pct}%</td>
            <td><span class="${getBadgeClass(r.estado)}">${r.estado}</span></td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-danger" data-index="${index}">
                    Eliminar
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });


    tbody.querySelectorAll("button[data-index]").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const i = Number(e.target.getAttribute("data-index"));
            eliminarRegistro(i);
        });
    });
}

function renderResumen() {
    const outPedidos = document.getElementById("outPedidos");
    const outReclamos = document.getElementById("outReclamos");
    const outPct = document.getElementById("outPct");
    const outEstado = document.getElementById("outEstado");

    if (registros.length === 0) {
        outPedidos.textContent = "—";
        outReclamos.textContent = "—";
        outPct.textContent = "—";
        outEstado.textContent = "—";
        outEstado.className = "badge badge-round px-3 py-2 text-bg-secondary";
        return;
    }

    // sumo totales
    let totP = 0;
    let totR = 0;
    registros.forEach(r => {
        totP += r.pedidos;
        totR += r.reclamos;
    });

    const pctGlobal = calcularPct(totP, totR);
    const estGlobal = estadoSegunPct(pctGlobal);

    outPedidos.textContent = totP;
    outReclamos.textContent = totR;
    outPct.textContent = pctGlobal + "%";
    outEstado.textContent = estGlobal;
    outEstado.className = getBadgeClass(estGlobal) + " px-3 py-2";
}

function renderTodo() {
    renderTabla();
    renderResumen();
}



// ACCIONES

function agregarRegistro(etiqueta, pedidos, reclamos) {
    const pct = calcularPct(pedidos, reclamos);
    const estado = estadoSegunPct(pct);

    if (pct === null || estado === "INVÁLIDO") {
        mostrarError("Datos inválidos. Verificá que pedidos > 0 y reclamos ≥ 0.");
        return false;
    }

    registros.push({
        etiqueta: etiqueta.trim(),
        pedidos,
        reclamos,
        pct,
        estado
    });

    guardarEnLocalStorage();
    renderTodo();
    return true;
}

function eliminarRegistro(index) {
    const seguro = confirm("¿Seguro que querés eliminar este registro?");
    if (!seguro) return;

    registros.splice(index, 1);
    guardarEnLocalStorage();
    renderTodo();
}

function limpiarTodo() {
    const seguro = confirm("¿Seguro que querés borrar TODOS los registros?");
    if (!seguro) return;

    registros = [];
    guardarEnLocalStorage();
    renderTodo();
}

function mostrarError(msg) {
    const box = document.getElementById("msgError");
    box.textContent = msg;
    box.classList.remove("d-none");
    setTimeout(() => {
        box.classList.add("d-none");
    }, 4000);
}


// EVENTOS DEL DOM //

document.addEventListener("DOMContentLoaded", () => {
    cargarDeLocalStorage();
    renderTodo();

    const form = document.getElementById("formRegistro");
    const inpEtiqueta = document.getElementById("inpEtiqueta");
    const inpPedidos = document.getElementById("inpPedidos");
    const inpReclamos = document.getElementById("inpReclamos");
    const btnLimpiar = document.getElementById("btnLimpiar");


    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const etiquetaVal = inpEtiqueta.value;
        const pedidosVal = Number(inpPedidos.value);
        const reclamosVal = Number(inpReclamos.value);

        const ok = agregarRegistro(etiquetaVal, pedidosVal, reclamosVal);

        if (ok) {
            form.reset();
            inpEtiqueta.focus();
        }
    });

    // botón CLEAR
    btnLimpiar.addEventListener("click", () => {
        limpiarTodo();
    });
});
