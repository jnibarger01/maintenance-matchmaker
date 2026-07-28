// oil-package.js
// Related financial presentation module. Deliberately separate from maintenance applicability logic.

(function () {
  "use strict";

  const SERVICE_COUNT = 6;

  function $(id) {
    return document.getElementById(id);
  }

  function currency(value) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(value);
  }

  function render() {
    const packagePrice = Math.max(0, Number($("oil-package-price")?.value) || 0);
    const visitPrice = Math.max(0, Number($("oil-visit-price")?.value) || 0);
    const costPerService = packagePrice / SERVICE_COUNT;
    const breakEven = visitPrice > 0 ? packagePrice / visitPrice : 0;
    const savings = visitPrice * SERVICE_COUNT - packagePrice;

    $("oil-cost-per-service").textContent = currency(costPerService);
    $("oil-break-even").textContent = breakEven.toFixed(2);
    $("oil-savings").textContent = currency(savings);

    const chart = $("oil-chart");
    const max = Math.max(packagePrice, visitPrice * SERVICE_COUNT, 1);
    chart.innerHTML = Array.from({ length: SERVICE_COUNT }, (_, i) => {
      const visit = i + 1;
      const cumulative = visitPrice * visit;
      const width = Math.min(100, (cumulative / max) * 100);
      return `<div class="oil-chart-row">
        <strong>Visit ${visit}</strong>
        <div class="oil-chart-track"><div class="oil-chart-bar" style="width:${width}%"></div></div>
        <span>${currency(cumulative)}</span>
      </div>`;
    }).join("");
  }

  function open() {
    $("oil-package-overlay")?.classList.add("active");
    document.body.style.overflow = "hidden";
    render();
  }

  function close() {
    $("oil-package-overlay")?.classList.remove("active");
    document.body.style.overflow = "";
  }

  function init() {
    $("oil-package-btn")?.addEventListener("click", open);
    $("oil-package-close")?.addEventListener("click", close);
    $("oil-package-price")?.addEventListener("input", render);
    $("oil-visit-price")?.addEventListener("input", render);
  }

  window.OilPackagePresentation = { open, close };
  document.addEventListener("DOMContentLoaded", init);
})();