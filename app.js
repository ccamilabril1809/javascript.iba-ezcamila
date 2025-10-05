// CONFIGURACION Y PARAMETRO
const TH_OK_MAX = 1.0;
const TH_WARN_MAX = 2.5;
let registros = [];

// FUNCIONES
function calcularPct(pedidos, reclamos) {
    if (!Number.isFinite(pedidos) || !Number.isFinite(reclamos) || pedidos <= 0 || reclamos < 0) return null;
    return Number(((reclamos / pedidos) * 100).toFixed(2));
}
function estadoSegunPct(pct) {
    if (pct === null) return "INVÁLIDO";
    if (pct <= TH_OK_MAX) return "OK";
    if (pct <= TH_WARN_MAX) return "REVISAR";
    return "CRÍTICO";
}

// ENTRADA
function cargarDatos() {
    registros = [];
    alert("Bienvenida/o. Ingresá uno o más registros. Podés cancelar en cualquier momento.");

    let seguir = true;
    while (seguir) {
        const etiqueta = prompt("Etiqueta (ej: 'Turno tarde', 'Ana', '2025-10-05'):");
        if (!etiqueta || etiqueta.trim() === "") {
            alert("Etiqueta vacía. Registro omitido.");
        } else {
            const pedidos = Number(prompt("Total de pedidos (entero > 0):"));
            const reclamos = Number(prompt("Total de reclamos (entero ≥ 0):"));

            const pct = calcularPct(pedidos, reclamos);
            const est = estadoSegunPct(pct);

            if (pct === null) {
                alert("Datos inválidos. No se guardó el registro.");
            } else {
                registros.push({ etiqueta: etiqueta.trim(), pedidos, reclamos, pct, estado: est });
                alert(`Guardado:\n${etiqueta}\nPedidos: ${pedidos}\nReclamos: ${reclamos}\n%: ${pct}% → ${est}`);
            }
        }
        seguir = confirm("¿Cargar otro registro?");
    }

    if (registros.length === 0) {
        registros = [
            { etiqueta: "Ejemplo Mañana", pedidos: 500, reclamos: 5, pct: calcularPct(500, 5), estado: "" },
            { etiqueta: "Ejemplo Tarde", pedidos: 420, reclamos: 12, pct: calcularPct(420, 12), estado: "" },
        ];
        registros.forEach(r => r.estado = estadoSegunPct(r.pct));
        alert("No se cargaron datos. Se agregaron 2 registros de ejemplo.");
    }
}

//PROCESO
function resumir() {
    let totP = 0, totR = 0;
    for (const r of registros) {
        totP += r.pedidos;
        totR += r.reclamos;
    }
    const pctGlobal = calcularPct(totP, totR);
    const estGlobal = estadoSegunPct(pctGlobal);
    return { totP, totR, pctGlobal, estGlobal };
}

// SALIDA
function mostrar(res) {
    alert(
        `Resumen:\n` +
        `Pedidos: ${res.totP}\n` +
        `Reclamos: ${res.totR}\n` +
        `% Global: ${res.pctGlobal}% → ${res.estGlobal}\n\n` +
        `Revisá la consola para ver la tabla completa.`
    );

    console.clear();
    console.log("=== Registros cargados ===");
    console.table(registros);
    console.log("=== Resumen general ===");
    console.table([res]);
}

// FUNCION PRINC
function iniciarSimulador() {
    cargarDatos();
    const resumen = resumir();
    mostrar(resumen);
    alert("Simulador finalizado. Revisá la consola para ver el resumen completo.");
}


document.getElementById("btnIniciar").addEventListener("click", iniciarSimulador);
