// advisor-presentation-bridge.js
// Bridges the existing advisor controls to customer presentation mode without duplicating interval rules.

(function () {
  "use strict";

  function value(id) {
    return document.getElementById(id)?.value?.trim() || "";
  }

  function getPayload() {
    const validation = window.MatchmakerValidation?.validateVehicleInputs;
    if (typeof validation !== "function") return null;

    const result = validation({
      yearRaw: value("year"),
      modelRaw: value("model"),
      mileageRaw: value("mileage")
    });

    if (result.error) {
      alert(result.error);
      return null;
    }

    return {
      vehicle: result.value,
      recommendations: window.MatchmakerLogic.calculateRecommendations(
        result.value.model,
        result.value.mileage
      )
    };
  }

  function openPresentation() {
    const payload = getPayload();
    if (!payload) return;
    window.CustomerPresentation.open(payload);
  }

  function init() {
    document
      .getElementById("customer-presentation-btn")
      ?.addEventListener("click", openPresentation);
  }

  document.addEventListener("DOMContentLoaded", init);
})();