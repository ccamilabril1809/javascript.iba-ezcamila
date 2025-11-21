// ============================
// CONFIG REMOTA (JSON)
// ============================
let TH_OK_MAX = 1.0;
let TH_WARN_MAX = 2.5;
let LS_KEY = "simRegistrosInexactitud";

let registros = [];

// Cargar config.json de forma asíncrona
async function cargarConfig() {
    try {
        const res = await fetch("./config.json");
        const cfg = await res.json();

        TH_OK_MAX = cfg.TH_OK_MAX ?? TH_OK_MAX;
        TH_WARN_MAX = cfg.TH_WARN_MAX ?? TH_WARN_MAX;
        LS_KEY = cfg.LS_KEY ?? LS_KEY;
    } catch (err) {
        console.warn("No se pudo cargar config.json, usando valores por defecto.", err);
    }
}

// ============================
// CLASE REGISTRO (Escalabilidad)
// ============================
class Registro {
    constructor(etiqueta, pedidos, reclamos) {
        this.etiqueta = etiqueta.trim();
        this.pedidos = pedidos;
        this.reclamos = reclamos;
        this.pct = this.calcularPct();
        this.estado = estadoSegunPct(this.pct);
    }

    calcularPct() {
        return calcularPct(this.pedidos, this.reclamos);
    }
}

// ============================
// FUNCIONES DE CÁLCULO
// ============================
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

// ============================
// LOCAL STORAGE
// ============================
function guardarEnLocalStorage() {
    localStorage.setItem(LS_KEY, JSON.stringify(registros));
}

function cargarDeLocalStorage() {
    try {
        const data = localStorage.getItem(LS_KEY);
        const arr = data ? JSON.parse(data) : [];

        // Reconstruyo instancias Registro
        registros = arr.map(r => new Registro(r.etiqueta, r.pedidos, r.reclamos));
    } catch {
        registros = [];
    }
}

// ============================
// RENDER
// ============================
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

// ============================
// ACCIONES
// ============================
function agregarRegistro(etiqueta, pedidos, reclamos) {
    const reg = new Registro(etiqueta, pedidos, reclamos);

    if (reg.pct === null || reg.estado === "INVÁLIDO") {
        mostrarError("Datos inválidos. Verificá que pedidos > 0 y reclamos ≥ 0.");
        return false;
    }

    registros.push(reg);
    guardarEnLocalStorage();
    renderTodo();
    return true;
}

async function eliminarRegistro(index) {
    const r = await Swal.fire({
        title: "¿Eliminar registro?",
        text: "Esta acción no se puede deshacer.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar"
    });

    if (!r.isConfirmed) return;

    registros.splice(index, 1);
    guardarEnLocalStorage();
    renderTodo();

    Swal.fire({
        title: "Eliminado",
        icon: "success",
        timer: 1200,
        showConfirmButton: false
    });
}

async function limpiarTodo() {
    const r = await Swal.fire({
        title: "¿Borrar todo?",
        text: "Vas a eliminar TODOS los registros guardados.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, borrar todo",
        cancelButtonText: "Cancelar"
    });

    if (!r.isConfirmed) return;

    registros = [];
    guardarEnLocalStorage();
    renderTodo();

    Swal.fire({
        title: "Registros borrados",
        icon: "success",
        timer: 1200,
        showConfirmButton: false
    });
}

function mostrarError(msg) {
    const box = document.getElementById("msgError");
    box.textContent = msg;
    box.classList.remove("d-none");
    setTimeout(() => {
        box.classList.add("d-none");
    }, 4000);
}

// ============================
// EVENTOS DEL DOM
// ============================
document.addEventListener("DOMContentLoaded", async () => {
    await cargarConfig();
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

    btnLimpiar.addEventListener("click", () => {
        limpiarTodo();
    });


    // BOTÓN PRUEBA
    const btnDemo = document.getElementById("btnDemo");

    btnDemo.addEventListener("click", () => {
        const demo = [
            new Registro("Turno mañana", 420, 2),
            new Registro("Turno tarde", 380, 9),
            new Registro("Delivery noche", 260, 7),
        ];

        registros = [...registros, ...demo];
        guardarEnLocalStorage();
        renderTodo();
    });

});
