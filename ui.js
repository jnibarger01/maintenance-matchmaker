// ui.js
// DOM wiring + rendering + clipboard export.
// Depends on data.js + logic.js + validation.js.

(function () {
  "use strict";

  const state = {
    // Map<serviceKey, serviceObj>
    selected: new Map(),
    vehicle: null
  };

  function $(id) {
    return document.getElementById(id);
  }

  function money(n) {
    return n === 0 ? "FREE" : `$${n.toFixed(2)}`;
  }

  function validateInputs() {
    const validator = window.MatchmakerValidation;
    if (!validator?.validateVehicleInputs) {
      alert("Validation is unavailable. Please refresh the page.");
      return null;
    }

    const result = validator.validateVehicleInputs({
      yearRaw: $("year").value,
      modelRaw: $("model").value,
      mileageRaw: $("mileage").value
    });

    if (result.error) {
      alert(result.error);
      return null;
    }

    return result.value;
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
      const checkbox = item.querySelector('input[type="checkbox"]');
      if (checkbox) checkbox.checked = false;
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

    const totalPrice = services.reduce((sum, service) => sum + (service.price || 0), 0);
    const totalHours = services.reduce(
      (sum, service) => sum + (service.labor_hours || 0),
      0
    );

    $("selected-count").textContent = String(services.length);
    $("total-price").textContent = `$${totalPrice.toFixed(2)}`;
    $("total-hours").textContent = `${totalHours.toFixed(1)}h`;

    summaryBar.classList.add("active");
  }

  function createPriorityHeader(priority, count) {
    const priorityLabels = {
      critical: "Critical",
      high: "High Priority",
      medium: "Medium Priority",
      low: "Low Priority"
    };

    const header = document.createElement("div");
    header.className = "priority-header";

    const badge = document.createElement("span");
    badge.className = `priority-badge ${priority}`;
    badge.textContent = priorityLabels[priority] || priority;

    const countLabel = document.createElement("span");
    countLabel.className = "priority-count";
    countLabel.textContent = `${count} ${count === 1 ? "service" : "services"}`;

    header.appendChild(badge);
    header.appendChild(countLabel);

    return header;
  }

  function createServiceDetails(service) {
    const details = document.createElement("div");
    details.className = "service-details";

    if (service.overdue) {
      const overdue = document.createElement("span");
      overdue.className = "service-overdue";
      overdue.textContent = "OVERDUE";
      details.appendChild(overdue);
      details.appendChild(
        document.createTextNode(` - Due at ${service.due.toLocaleString()} mi`)
      );
      return details;
    }

    details.textContent = `Due in ${service.milesUntil.toLocaleString()} mi (at ${service.due.toLocaleString()} mi)`;
    return details;
  }

  function createServiceItem(service) {
    const item = document.createElement("div");
    item.className = "service-item";
    item.dataset.service = JSON.stringify(service);

    const info = document.createElement("div");
    info.className = "service-info";

    const name = document.createElement("div");
    name.className = "service-name";
    name.textContent = service.service;

    info.appendChild(name);
    info.appendChild(createServiceDetails(service));

    const price = document.createElement("div");
    price.className = "service-price";

    const amount = document.createElement("div");
    amount.className = "price-amount";
    amount.textContent = money(service.price || 0);

    const hours = document.createElement("div");
    hours.className = "labor-hours";
    hours.textContent = `${service.labor_hours}h labor`;

    price.appendChild(amount);
    price.appendChild(hours);

    const checkboxWrapper = document.createElement("div");
    checkboxWrapper.className = "service-checkbox";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "service-toggle";

    checkboxWrapper.appendChild(checkbox);

    item.appendChild(info);
    item.appendChild(price);
    item.appendChild(checkboxWrapper);

    return item;
  }

  function renderRecommendations(recommendations) {
    const container = $("recommendations-container");
    container.innerHTML = "";

    const priorityOrder = ["critical", "high", "medium", "low"];
    let rendered = false;

    for (const priority of priorityOrder) {
      const services = recommendations[priority] || [];
      if (services.length === 0) continue;

      rendered = true;
      const section = document.createElement("div");
      section.className = "priority-section";

      section.appendChild(createPriorityHeader(priority, services.length));

      for (const service of services) {
        section.appendChild(createServiceItem(service));
      }

      container.appendChild(section);
    }

    if (!rendered) {
      container.innerHTML =
        "<div class=\"empty-state\">" +
        "<svg viewBox=\"0 0 24 24\" fill=\"currentColor\">" +
        "<path d=\"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z\"/>" +
        "</svg>" +
        "<h3>All caught up!</h3>" +
        "<p>No services due at this mileage</p>" +
        "</div>";
    }
  }

  function buildClipboardText(services, vehicle) {
    let text = "=== RECOMMENDED SERVICES ===\n";
    text += `Vehicle: ${vehicle.year} Toyota ${vehicle.model}\n`;
    text += `Mileage: ${vehicle.mileage.toLocaleString()} mi\n\n`;

    const byPriority = { critical: [], high: [], medium: [], low: [] };
    services.forEach((service) => (byPriority[service.priority] || byPriority.low).push(service));

    Object.entries(byPriority).forEach(([priority, items]) => {
      if (items.length === 0) return;
      text += `${priority.toUpperCase()} PRIORITY:\n`;
      items.forEach((service) => {
        text += `  ☐ ${service.service} - ${money(service.price || 0)} (${service.labor_hours}h)\n`;
      });
      text += "\n";
    });

    const totalPrice = services.reduce((sum, service) => sum + (service.price || 0), 0);
    const totalHours = services.reduce(
      (sum, service) => sum + (service.labor_hours || 0),
      0
    );

    text += `\nTOTAL: $${totalPrice.toFixed(2)} | ${totalHours.toFixed(1)} hours labor\n`;
    text += "\nGenerated by Maintenance Matchmaker";

    return text;
  }

  function copyTextToClipboard(text) {
    if (navigator.clipboard?.writeText) {
      return navigator.clipboard.writeText(text);
    }

    return new Promise((resolve, reject) => {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "true");
      textarea.style.position = "absolute";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand("copy");
      document.body.removeChild(textarea);

      if (success) {
        resolve();
      } else {
        reject(new Error("Copy command failed."));
      }
    });
  }

  function copyToClipboard(event) {
    const services = Array.from(state.selected.values());
    if (services.length === 0) {
      alert("No services selected");
      return;
    }

    if (!state.vehicle) {
      alert("Please generate recommendations first.");
      return;
    }

    const text = buildClipboardText(services, state.vehicle);

    copyTextToClipboard(text)
      .then(() => {
        const button = event?.target;
        if (!button) return;

        const originalText = button.textContent;
        button.textContent = "✓ Copied!";
        button.style.background = "#2ed573";

        setTimeout(() => {
          button.textContent = originalText;
          button.style.background = "";
        }, 1500);
      })
      .catch((error) => {
        console.error("Copy failed:", error);
        alert("Failed to copy. Please try again.");
      });
  }

  function generate() {
    const inputs = validateInputs();
    if (!inputs) return;

    state.vehicle = inputs;
    setVehicleHeader(inputs);

    const recommendations = window.MatchmakerLogic.calculateRecommendations(
      inputs.model,
      inputs.mileage
    );
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
    $("recommendations-container")?.addEventListener("change", (event) => {
      if (event.target?.classList?.contains("service-toggle")) toggleService(event.target);
    });

    // Enter to generate
    document.querySelectorAll("input, select").forEach((el) => {
      el.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
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
