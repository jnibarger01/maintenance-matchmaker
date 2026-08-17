// nhtsa-vin.js
// Optional VIN lookup using the free NHTSA vPIC API.
// Auto-populates year/model for Toyota vehicles without changing the maintenance engine.

(function () {
  "use strict";

  const API_BASE =
    "https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended";
  const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/;

  function normalizeVin(vinRaw) {
    return String(vinRaw || "")
      .trim()
      .toUpperCase();
  }

  function validateVin(vinRaw) {
    const vin = normalizeVin(vinRaw);

    if (!vin) {
      return { error: "Please enter a VIN." };
    }

    if (vin.length !== 17) {
      return { error: "VIN must be exactly 17 characters." };
    }

    if (!VIN_PATTERN.test(vin)) {
      return {
        error:
          "VIN may contain only letters and numbers; I, O, and Q are not valid VIN characters."
      };
    }

    return { value: vin };
  }

  function parseDecodeResponse(payload) {
    const decoded = payload?.Results?.[0];

    if (!decoded || typeof decoded !== "object") {
      return { error: "NHTSA returned an unexpected VIN response." };
    }

    const errorCode = String(decoded.ErrorCode || "").trim();
    if (errorCode && errorCode !== "0") {
      return {
        error:
          String(decoded.ErrorText || "").trim() ||
          "NHTSA could not cleanly decode this VIN."
      };
    }

    const year = Number.parseInt(String(decoded.ModelYear || ""), 10);
    const make = String(decoded.Make || "").trim();
    const model = String(decoded.Model || "").trim();

    if (!Number.isInteger(year) || !make || !model) {
      return {
        error: "NHTSA did not return enough vehicle information for this VIN."
      };
    }

    return {
      value: {
        vin: normalizeVin(decoded.VIN),
        year,
        make,
        model,
        trim: String(decoded.Trim || "").trim(),
        bodyClass: String(decoded.BodyClass || "").trim(),
        driveType: String(decoded.DriveType || "").trim(),
        engineCylinders: String(decoded.EngineCylinders || "").trim(),
        fuelType: String(decoded.FuelTypePrimary || "").trim()
      }
    };
  }

  async function decodeVin(vinRaw, fetchImpl) {
    const validation = validateVin(vinRaw);
    if (validation.error) return validation;

    const request = fetchImpl || window.fetch?.bind(window);
    if (typeof request !== "function") {
      return { error: "VIN lookup is unavailable in this browser." };
    }

    const url = `${API_BASE}/${encodeURIComponent(validation.value)}?format=json`;

    try {
      const response = await request(url, {
        headers: { Accept: "application/json" }
      });

      if (!response.ok) {
        return {
          error: `NHTSA VIN lookup failed with HTTP ${response.status}. Please try again.`
        };
      }

      const payload = await response.json();
      return parseDecodeResponse(payload);
    } catch {
      return {
        error:
          "Could not reach NHTSA. Check the network connection and try the VIN lookup again."
      };
    }
  }

  function normalizeModelName(modelRaw) {
    const model = String(modelRaw || "").trim();
    const aliases = {
      "4-RUNNER": "4Runner",
      "4RUNNER": "4Runner",
      "RAV 4": "RAV4",
      RAV4: "RAV4"
    };

    return aliases[model.toUpperCase()] || model;
  }

  function addVinStyles(doc) {
    if (doc.getElementById("nhtsa-vin-styles")) return;

    const style = doc.createElement("style");
    style.id = "nhtsa-vin-styles";
    style.textContent = `
      .vin-lookup {
        margin-bottom: 20px;
        padding: 18px;
        border: 1px solid #e0e0e0;
        border-radius: 10px;
        background: #f8f9fa;
      }
      .vin-input-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 12px;
        align-items: end;
      }
      .vin-input-row .btn {
        width: auto;
        min-width: 150px;
        margin-top: 0;
      }
      #vin {
        text-transform: uppercase;
        letter-spacing: .08em;
      }
      .vin-help,
      .vin-status {
        margin-top: 8px;
        color: #666;
        font-size: .88rem;
      }
      .vin-status {
        min-height: 1.2em;
        font-weight: 600;
      }
      .vin-status.success { color: #1f7a46; }
      .vin-status.error { color: #c8102e; }
      @media (max-width: 760px) {
        .vin-input-row { grid-template-columns: 1fr; }
        .vin-input-row .btn { width: 100%; }
      }
    `;
    doc.head.appendChild(style);
  }

  function ensureModelOption(select, modelRaw) {
    const model = normalizeModelName(modelRaw);
    const existing = Array.from(select.options).find(
      (option) => option.value.toLowerCase() === model.toLowerCase()
    );

    if (existing) {
      select.value = existing.value;
      return existing.value;
    }

    const option = window.document.createElement("option");
    option.value = model;
    option.textContent = `${model} (VIN decoded)`;
    select.appendChild(option);
    select.value = model;
    return model;
  }

  function initVinLookup() {
    const doc = window.document;
    if (!doc || doc.getElementById("vin-lookup")) return;

    const setupSection = doc.querySelector(
      'section.card[aria-label="Advisor vehicle setup"]'
    );
    const inputSection = setupSection?.querySelector(".input-section");
    if (!setupSection || !inputSection) return;

    addVinStyles(doc);

    const lookup = doc.createElement("div");
    lookup.id = "vin-lookup";
    lookup.className = "vin-lookup";
    lookup.innerHTML = `
      <div class="vin-input-row">
        <div class="form-group">
          <label for="vin">VIN (optional)</label>
          <input
            type="text"
            id="vin"
            maxlength="17"
            autocomplete="off"
            spellcheck="false"
            placeholder="Enter 17-character VIN"
            aria-describedby="vin-help vin-status"
          />
        </div>
        <button class="btn" id="decode-vin-btn" type="button">Decode VIN</button>
      </div>
      <div class="vin-help" id="vin-help">Uses the free NHTSA vPIC API. No API key required.</div>
      <div class="vin-status" id="vin-status" aria-live="polite"></div>
    `;

    inputSection.before(lookup);

    const vinInput = doc.getElementById("vin");
    const decodeButton = doc.getElementById("decode-vin-btn");
    const status = doc.getElementById("vin-status");
    const yearInput = doc.getElementById("year");
    const modelSelect = doc.getElementById("model");

    function showStatus(message, type) {
      status.textContent = message;
      status.className = `vin-status${type ? ` ${type}` : ""}`;
    }

    async function runLookup() {
      showStatus("", "");
      decodeButton.disabled = true;
      decodeButton.textContent = "Decoding…";

      const result = await decodeVin(vinInput.value);

      decodeButton.disabled = false;
      decodeButton.textContent = "Decode VIN";

      if (result.error) {
        showStatus(result.error, "error");
        return;
      }

      const vehicle = result.value;
      if (vehicle.make.toUpperCase() !== "TOYOTA") {
        showStatus(
          `Decoded as ${vehicle.year} ${vehicle.make} ${vehicle.model}. Maintenance Matchmaker currently supports Toyota vehicles only.`,
          "error"
        );
        return;
      }

      const minYear = Number(yearInput.min || 0);
      const maxYear = Number(yearInput.max || 9999);
      if (vehicle.year < minYear || vehicle.year > maxYear) {
        showStatus(
          `Decoded as ${vehicle.year} Toyota ${vehicle.model}, but this Matchmaker currently supports model years ${minYear}–${maxYear}.`,
          "error"
        );
        return;
      }

      vinInput.value = vehicle.vin || normalizeVin(vinInput.value);
      yearInput.value = String(vehicle.year);
      ensureModelOption(modelSelect, vehicle.model);

      const extra = [vehicle.trim, vehicle.bodyClass]
        .filter(Boolean)
        .join(" • ");
      showStatus(
        `✓ ${vehicle.year} Toyota ${normalizeModelName(vehicle.model)}${extra ? ` • ${extra}` : ""}`,
        "success"
      );
    }

    decodeButton.addEventListener("click", runLookup);
    vinInput.addEventListener("input", () => {
      vinInput.value = vinInput.value.toUpperCase();
      showStatus("", "");
    });
    vinInput.addEventListener("keypress", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      runLookup();
    });
  }

  window.NhtsaVin = {
    API_BASE,
    normalizeVin,
    validateVin,
    parseDecodeResponse,
    decodeVin,
    normalizeModelName,
    initVinLookup
  };

  if (window.document) {
    if (window.document.readyState === "loading") {
      window.document.addEventListener("DOMContentLoaded", initVinLookup);
    } else {
      initVinLookup();
    }
  }
})();
