// ui.js
// DOM wiring + rendering + clipboard export.
// Depends on data.js + logic.js.

(function () {
"use strict";

const state = {
// Map<serviceKey, serviceObj>
selected: new Map()
};

function $(id) {
return document.getElementById(id);
}

function money(n) {
return n === 0 ? "FREE" : `$${n.toFixed(2)}`;
}

function validateInputs() {
const year = $("year").value.trim();
const model = $("model").value.trim();
const mileageRaw = $("mileage").value.trim();
const mileage = parseInt(mileageRaw, 10);

if (!year || !model || mileageRaw === "") {
  alert("Please fill in all fields");
  return null;
}
if (Number.isNaN(mileage) || mileage < 0 || mileage > 500000) {
  alert("Please enter a valid mileage");
  return null;
}

return { year, model, mileage };

}

function setVehicleHeader({ year, model, mileage }) {
$("display-vehicle").textContent = `${year} Toyota ${model}`;
$("display-mileage").textContent = `${mileage.toLocaleString()} mi`;

const nextInterval = window.MatchmakerLogic.findNextInterval(mileage);
const milesUntil = nextInterval - mileage;

$("display-next").textContent = `${nextInterval.toLocaleString()} mi`;
$("display-miles-until").textContent = `${milesUntil.toLocaleString()} mi`;

}

function clearSelections() {
state.selected.clear();

document.querySelectorAll(".service-item.selected").forEach((item) => {
  item.classList.remove("selected");
  const cb = item.querySelector('input[type="checkbox"]');
  if (cb) cb.checked = false;
});

updateSummary();

}

function toggleService(checkbox) {
const item = checkbox.closest(".service-item");
if (!item) return;

const serviceData = JSON.parse(item.dataset.service);
const key = window.MatchmakerLogic.makeServiceKey(serviceData);

if (checkbox.checked) {
  state.selected.set(key, serviceData);
  item.classList.add("selected");
} else {
  state.selected.delete(key);
  item.classList.remove("selected");
}

updateSummary();

}

function updateSummary() {
const summaryBar = $("summary-bar");
const services = Array.from(state.selected.values());

if (services.length === 0) {
  summaryBar.classList.remove("active");
  return;
}

const totalPrice = services.reduce((sum, s) => sum + (s.price || 0), 0);
const totalHours = services.reduce((sum, s) => sum + (s.labor_hours || 0), 0);

$("selected-count").textContent = String(services.length);
$("total-price").textContent = `$${totalPrice.toFixed(2)}`;
$("total-hours").textContent = `${totalHours.toFixed(1)}h`;

summaryBar.classList.add("active");

}

function renderRecommendations(recommendations) {
const container = $("recommendations-container");
container.innerHTML = "";

const priorityOrder = ["critical", "high", "medium", "low"];
const priorityLabels = {
  critical: "Critical",
  high: "High Priority",
  medium: "Medium Priority",
  low: "Low Priority"
};

for (const priority of priorityOrder) {
  const services = recommendations[priority] || [];
  if (services.length === 0) continue;

  const section = document.createElement("div");
  section.className = "priority-section";

  const header = document.createElement("div");
  header.className = "priority-header";
  header.innerHTML =
    `<span class="priority-badge ${priority}">${priorityLabels[priority]}</span>` +
    `<span style="color:#666;font-size:0.9em;">${services.length} ${services.length === 1 ? "service" : "services"}</span>`;
  section.appendChild(header);

  for (const service of services) {
    const item = document.createElement("div");
    item.className = "service-item";
    item.dataset.service = JSON.stringify(service);

    const statusText = service.overdue
      ? `<span style="color:#ff4757;font-weight:600;">OVERDUE</span> - Due at ${service.due.toLocaleString()} mi`
      : `Due in ${service.milesUntil.toLocaleString()} mi (at ${service.due.toLocaleString()} mi)`;

    item.innerHTML =
      `<div class="service-info">` +
      `<div class="service-name">${service.service}</div>` +
      `<div class="service-details">${statusText}</div>` +
      `</div>` +
      `<div class="service-price">` +
      `<div class="price-amount">${money(service.price || 0)}</div>` +
      `<div class="labor-hours">${service.labor_hours}h labor</div>` +
      `</div>` +
      `<div class="service-checkbox">` +
      `<input type="checkbox" class="service-toggle">` +
      `</div>`;

    section.appendChild(item);
  }

  container.appendChild(section);
}

if (container.innerHTML.trim() === "") {
  container.innerHTML =
    `<div class="empty-state">` +
    `<svg viewBox="0 0 24 24" fill="currentColor">` +
    `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>` +
    `</svg>` +
    `<h3>All caught up!</h3>` +
    `<p>No services due at this mileage</p>` +
    `</div>`;
}

}

function copyToClipboard(event) {
const services = Array.from(state.selected.values());
if (services.length === 0) {
alert("No services selected");
return;
}

const year = $("year").value.trim();
const model = $("model").value.trim();
const mileage = parseInt($("mileage").value, 10);

let text = "=== RECOMMENDED SERVICES ===\n";
text += `Vehicle: ${year} Toyota ${model}\n`;
text += `Mileage: ${mileage.toLocaleString()} mi\n\n`;

const byPriority = { critical: [], high: [], medium: [], low: [] };
services.forEach((s) => (byPriority[s.priority] || byPriority.low).push(s));

Object.entries(byPriority).forEach(([priority, items]) => {
  if (items.length === 0) return;
  text += `${priority.toUpperCase()} PRIORITY:\n`;
  items.forEach((s) => {
    text += `  ☐ ${s.service} - ${money(s.price || 0)} (${s.labor_hours}h)\n`;
  });
  text += "\n";
});

const totalPrice = services.reduce((sum, s) => sum + (s.price || 0), 0);
const totalHours = services.reduce((sum, s) => sum + (s.labor_hours || 0), 0);

text += `\nTOTAL: $${totalPrice.toFixed(2)} | ${totalHours.toFixed(1)} hours labor\n`;
text += "\nGenerated by Maintenance Matchmaker";

navigator.clipboard
  .writeText(text)
  .then(() => {
    const btn = event?.target;
    if (!btn) return;

    const originalText = btn.textContent;
    btn.textContent = "✓ Copied!";
    btn.style.background = "#2ed573";

    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = "";
    }, 1500);
  })
  .catch((err) => {
    console.error("Copy failed:", err);
    alert("Failed to copy. Please try again.");
  });

}

function generate() {
const inputs = validateInputs();
if (!inputs) return;

setVehicleHeader(inputs);

const recommendations = window.MatchmakerLogic.calculateRecommendations(inputs.model, inputs.mileage);
renderRecommendations(recommendations);

$("results").classList.add("active");
$("results").scrollIntoView({ behavior: "smooth" });

clearSelections();

}

function init() {
// Buttons
$("generate-btn")?.addEventListener("click", generate);
$("copy-btn")?.addEventListener("click", copyToClipboard);
$("clear-btn")?.addEventListener("click", clearSelections);

// Single delegated listener (no duplicates on re-render)
$("recommendations-container")?.addEventListener("change", (e) => {
  if (e.target?.classList?.contains("service-toggle")) toggleService(e.target);
});

// Enter to generate
document.querySelectorAll("input, select").forEach((el) => {
  el.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      generate();
    }
  });
});

// Nice-to-have focus on desktop
const yearInput = $("year");
if (yearInput && window.innerWidth > 768) yearInput.focus();

}

document.addEventListener("DOMContentLoaded", init);
})();