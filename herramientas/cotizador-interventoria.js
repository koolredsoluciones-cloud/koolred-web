const COP = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const NUMBER = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 });
const QUOTE_SCHEMA = "koolred-interventoria-v1";

const roles = {
  director: { label: "Director / ingeniero", hourlyRate: 91974 },
  tecnico: { label: "Técnico de apoyo", hourlyRate: 34490.25 },
  sst: { label: "Profesional SST", hourlyRate: 42154.75 },
  administrativo: { label: "Apoyo administrativo", hourlyRate: 12849.55 },
};

const exampleActivities = [
  ["Visita técnica / inspección de obra", true, 3, "monthly", 6, "director", 400000, false],
  ["Reunión de seguimiento", true, 2, "monthly", 2, "director", 0, false],
  ["Comité extraordinario", false, 0, "once", 2, "director", 0, false],
  ["Revisión de memorias de cálculo y diseños", true, 1, "once", 10, "director", 0, false],
  ["Revisión de cortes de obra / actas", true, 1, "monthly", 5, "director", 0, false],
  ["Verificación de cantidades y soportes", true, 1, "monthly", 4, "tecnico", 0, false],
  ["Concepto y aprobación de pagos", true, 1, "monthly", 3, "director", 0, false],
  ["Elaboración de informes periódicos", true, 1, "monthly", 6, "director", 0, false],
  ["Informe final y cierre", true, 1, "once", 12, "director", 0, false],
  ["Atención de consultas, correos y aclaraciones", true, 4, "monthly", 1, "director", 0, false],
  ["Seguimiento SST y documental", true, 1, "once", 3, "sst", 0, false],
  ["Visita adicional", false, 0, "once", 6, "director", 400000, false],
  ["Reunión adicional", false, 0, "once", 2, "director", 0, false],
  ["Entregable o revisión adicional", false, 0, "once", 4, "director", 0, false],
];

let activities = [];
let latest = {};

const $ = (id) => document.getElementById(id);
const num = (value) => Math.max(0, Number(value) || 0);
const cloneExample = () => exampleActivities.map(([name, included, quantity, frequency, hours, role, travel, custom]) => ({ name, included, quantity, frequency, hours, role, travel, custom }));
const cloneBlank = () => cloneExample().map((activity) => ({ ...activity, included: false, quantity: 0 }));

function roleOptions(selected) {
  return Object.entries(roles).map(([key, role]) => `<option value="${key}" ${key === selected ? "selected" : ""}>${role.label}</option>`).join("");
}

function renderActivities() {
  $("activityRows").innerHTML = activities.map((activity, index) => `
    <tr data-row="${index}" class="${activity.included ? "" : "is-disabled"}">
      <td class="include-col"><label class="toggle"><input class="activity-included" type="checkbox" ${activity.included ? "checked" : ""} aria-label="Incluir ${activity.name}" /></label></td>
      <td><textarea class="activity-name" rows="2" aria-label="Actividad">${escapeHtml(activity.name)}</textarea></td>
      <td><select class="frequency-select activity-frequency" aria-label="Periodicidad">
        <option value="once" ${activity.frequency === "once" ? "selected" : ""}>Única</option>
        <option value="monthly" ${activity.frequency === "monthly" ? "selected" : ""}>Mensual</option>
      </select></td>
      <td><input class="qty-input activity-quantity" type="number" min="0" step="1" value="${activity.quantity || ""}" placeholder="0" aria-label="Cantidad" /></td>
      <td><input class="hours-input activity-hours" type="number" min="0" step="0.5" value="${activity.hours}" aria-label="Horas por unidad" /></td>
      <td><select class="profile-select activity-role" aria-label="Perfil">${roleOptions(activity.role)}</select></td>
      <td><input class="travel-input activity-travel" type="number" min="0" step="50000" value="${activity.travel}" aria-label="Traslado por unidad" /></td>
      <td class="row-cost" data-cost>$0</td>
      <td><button class="delete-row" type="button" aria-label="Eliminar actividad" title="Eliminar actividad">×</button></td>
    </tr>
  `).join("");
  calculate();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]);
}

function syncRowsFromDom() {
  document.querySelectorAll("#activityRows tr").forEach((row) => {
    const index = Number(row.dataset.row);
    const activity = activities[index];
    activity.included = row.querySelector(".activity-included").checked;
    activity.name = row.querySelector(".activity-name").value;
    activity.frequency = row.querySelector(".activity-frequency").value;
    activity.quantity = num(row.querySelector(".activity-quantity").value);
    activity.hours = num(row.querySelector(".activity-hours").value);
    activity.role = row.querySelector(".activity-role").value;
    activity.travel = num(row.querySelector(".activity-travel").value);
    row.classList.toggle("is-disabled", !activity.included);
  });
}

function calculate() {
  syncRowsFromDom();
  let totalHours = 0;
  let fees = 0;
  let travel = 0;
  const duration = num($("duration").value);

  document.querySelectorAll("#activityRows tr").forEach((row) => {
    const activity = activities[Number(row.dataset.row)];
    const role = roles[activity.role] || roles.director;
    const frequencyMultiplier = activity.frequency === "monthly" ? duration : 1;
    const hours = activity.included ? activity.quantity * frequencyMultiplier * activity.hours : 0;
    const rowFees = hours * role.hourlyRate;
    const rowTravel = activity.included ? activity.quantity * frequencyMultiplier * activity.travel : 0;
    totalHours += hours;
    fees += rowFees;
    travel += rowTravel;
    row.querySelector("[data-cost]").textContent = COP.format(rowFees + rowTravel);
  });

  const monthlyExpenses = num($("communications").value) + num($("documentManagement").value);
  const fixedExpenses = num($("testing").value) + num($("equipment").value) + num($("policies").value) + num($("lodging").value);
  const otherExpenses = monthlyExpenses * duration + fixedExpenses;
  const directCost = fees + travel + otherExpenses;
  const vatValue = directCost * num($("vat").value) / 100;
  const grandTotal = directCost + vatValue;
  const projectValue = num($("projectValue").value);

  latest = {
    project: $("projectName").value.trim() || "Interventoría técnica",
    projectValue, duration, totalHours, fees, travel, otherExpenses, directCost,
    vatValue, grandTotal,
    projectShare: projectValue ? grandTotal / projectValue : 0,
    monthlyValue: duration ? grandTotal / duration : 0,
  };

  $("totalHours").textContent = NUMBER.format(totalHours);
  $("feesTotal").textContent = COP.format(fees);
  $("travelTotal").textContent = COP.format(travel);
  $("otherExpenses").textContent = COP.format(otherExpenses);
  $("directCost").textContent = COP.format(directCost);
  $("vatValue").textContent = COP.format(vatValue);
  $("grandTotal").textContent = COP.format(grandTotal);
  $("projectShare").textContent = `${NUMBER.format(latest.projectShare * 100)}%`;
  $("monthlyValue").textContent = COP.format(latest.monthlyValue);
  $("floorValue").textContent = COP.format(grandTotal * .9);
  $("ceilingValue").textContent = COP.format(grandTotal * 1.1);
  updateWhatsAppLink();
}

function buildSummary() {
  const included = activities.filter((item) => item.included && item.quantity > 0).map((item) => {
    const cadence = item.frequency === "monthly" ? `${item.quantity} al mes` : `${item.quantity} única(s)`;
    return `• ${item.name}: ${cadence}`;
  }).join("\n");
  return `${latest.project}\nValor de la obra: ${COP.format(latest.projectValue)}\nDuración: ${NUMBER.format(latest.duration)} meses\n\nAlcance incluido:\n${included}\n\nHoras profesionales: ${NUMBER.format(latest.totalHours)}\nHonorarios: ${COP.format(latest.fees)}\nDesplazamientos: ${COP.format(latest.travel)}\nOtros gastos: ${COP.format(latest.otherExpenses)}\nValor recomendado: ${COP.format(latest.grandTotal)}\nParticipación sobre la obra: ${NUMBER.format(latest.projectShare * 100)}%\n\nEstimación comercial preliminar sujeta a validación de alcance y condiciones contractuales.`;
}

function updateWhatsAppLink() {
  const message = `Hola, quiero revisar esta estimación de interventoría:\n\n${buildSummary()}`;
  $("whatsappShare").href = `https://wa.me/573181634953?text=${encodeURIComponent(message)}`;
}

async function copySummary() {
  const button = $("copySummary");
  try {
    await navigator.clipboard.writeText(buildSummary());
    button.textContent = "Resumen copiado";
    button.classList.add("copy-feedback");
  } catch {
    button.textContent = "No se pudo copiar";
  }
  setTimeout(() => { button.textContent = "Copiar resumen"; button.classList.remove("copy-feedback"); }, 1800);
}

function setStatus(message, isError = false) {
  const status = $("fileStatus");
  status.textContent = message;
  status.classList.toggle("is-error", isError);
}

function quoteData() {
  syncRowsFromDom();
  return {
    schema: QUOTE_SCHEMA,
    savedAt: new Date().toISOString(),
    project: {
      name: $("projectName").value,
      value: $("projectValue").value,
      duration: $("duration").value,
      vat: $("vat").value,
    },
    expenses: {
      communications: $("communications").value,
      documentManagement: $("documentManagement").value,
      testing: $("testing").value,
      equipment: $("equipment").value,
      policies: $("policies").value,
      lodging: $("lodging").value,
    },
    activities,
  };
}

function safeFileName(value) {
  const base = String(value || "cotizacion-interventoria")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base || "cotizacion-interventoria"}.json`;
}

function saveQuote() {
  const data = quoteData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = safeFileName(data.project.name);
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  setStatus("Avance descargado. Guarde el archivo para continuar después.");
}

function setField(id, value) {
  $(id).value = value ?? "";
}

function normalizeActivity(activity) {
  const role = Object.prototype.hasOwnProperty.call(roles, activity?.role) ? activity.role : "director";
  return {
    name: String(activity?.name || "Actividad").slice(0, 160),
    included: Boolean(activity?.included),
    quantity: num(activity?.quantity),
    frequency: activity?.frequency === "monthly" ? "monthly" : "once",
    hours: num(activity?.hours),
    role,
    travel: num(activity?.travel),
    custom: Boolean(activity?.custom),
  };
}

function applyQuoteData(data) {
  if (!data || data.schema !== QUOTE_SCHEMA || !data.project || !Array.isArray(data.activities)) {
    throw new Error("Formato de cotización no reconocido");
  }
  const project = data.project;
  const expenses = data.expenses || {};
  setField("projectName", project.name);
  setField("projectValue", project.value);
  setField("duration", project.duration);
  setField("vat", project.vat);
  setField("communications", expenses.communications);
  setField("documentManagement", expenses.documentManagement);
  setField("testing", expenses.testing);
  setField("equipment", expenses.equipment);
  setField("policies", expenses.policies);
  setField("lodging", expenses.lodging);
  activities = data.activities.slice(0, 200).map(normalizeActivity);
  renderActivities();
}

async function loadQuoteFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    applyQuoteData(data);
    setStatus(`Cotización cargada: ${file.name}`);
  } catch {
    setStatus("No se pudo cargar el archivo. Seleccione una cotización JSON creada por esta herramienta.", true);
  } finally {
    event.target.value = "";
  }
}

function newBlankQuote(askConfirmation = true) {
  const hasProgress = $("projectName").value.trim() || num($("projectValue").value) || activities.some((activity) => activity.included);
  if (askConfirmation && hasProgress && !window.confirm("¿Crear una cotización nueva? El avance no descargado se perderá.")) return;
  activities = cloneBlank();
  setField("projectName", "");
  setField("projectValue", "");
  setField("duration", "");
  setField("vat", "");
  ["communications", "documentManagement", "testing", "equipment", "policies", "lodging"].forEach((id) => setField(id, ""));
  setStatus(askConfirmation ? "Nueva cotización lista." : "");
  renderActivities();
}

function resetExample() {
  activities = cloneExample();
  $("projectName").value = "Interventoría técnica en Sesquilé";
  $("projectValue").value = 72000000;
  $("duration").value = 2;
  $("vat").value = 19;
  $("communications").value = 300000;
  $("documentManagement").value = 250000;
  $("testing").value = 0;
  $("equipment").value = 0;
  $("policies").value = 0;
  $("lodging").value = 0;
  renderActivities();
}

$("activityRows").addEventListener("input", calculate);
$("activityRows").addEventListener("change", calculate);
$("activityRows").addEventListener("click", (event) => {
  const button = event.target.closest(".delete-row");
  if (!button) return;
  const index = Number(button.closest("tr").dataset.row);
  activities.splice(index, 1);
  renderActivities();
});

document.querySelectorAll("#projectName, #projectValue, #duration, #vat, [data-expense]").forEach((control) => {
  control.addEventListener("input", calculate);
  control.addEventListener("change", calculate);
});

$("addActivity").addEventListener("click", () => {
  activities.push({ name: "Nueva actividad", included: true, quantity: 1, frequency: "once", hours: 2, role: "director", travel: 0, custom: true });
  renderActivities();
  document.querySelector("#activityRows tr:last-child .activity-name")?.focus();
});
$("resetExample").addEventListener("click", resetExample);
$("copySummary").addEventListener("click", copySummary);
$("printQuote").addEventListener("click", () => window.print());
$("saveQuote").addEventListener("click", saveQuote);
$("loadQuote").addEventListener("click", () => $("quoteFile").click());
$("quoteFile").addEventListener("change", loadQuoteFile);
$("newQuote").addEventListener("click", () => newBlankQuote(true));

newBlankQuote(false);
