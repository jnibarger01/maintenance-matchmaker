// presentation.js
// Customer-facing, full-screen rendering. Receives vehicle/recommendations from the advisor UI.

(function () {
  "use strict";

  let slides = [];
  let index = 0;
  let vehicle = null;

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function buildSlide(service) {
    const content = window.CustomerServiceContent.get(service.service);
    const status = service.overdue
      ? `Recommended now · scheduled at ${service.due.toLocaleString()} miles`
      : `Due in ${service.milesUntil.toLocaleString()} miles`;

    return {
      service,
      content,
      status
    };
  }

  function render() {
    const stage = $("presentation-stage");
    if (!stage || slides.length === 0) return;

    const slide = slides[index];
    const { service, content, status } = slide;

    stage.innerHTML = `
      <article class="presentation-card" aria-live="polite">
        <div class="presentation-visual" aria-hidden="true">${content.icon}</div>
        <div class="presentation-copy">
          <div class="presentation-eyebrow">${escapeHtml(status)}</div>
          <h2>${escapeHtml(service.service)}</h2>
          <p class="presentation-benefit">${escapeHtml(content.benefit)}</p>
          <h3>Why we recommend it</h3>
          <p>${escapeHtml(content.why)}</p>
          <h3>What it helps protect</h3>
          <ul>${content.protects.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
          <h3>Why timing matters</h3>
          <p>${escapeHtml(content.neglect)}</p>
          <span class="source-badge">${escapeHtml(content.source)}</span>
        </div>
      </article>`;

    $("presentation-progress").textContent = `${index + 1} of ${slides.length}`;
    $("presentation-prev").disabled = index === 0;
    $("presentation-next").textContent = index === slides.length - 1 ? "Finish" : "Next →";
  }

  function open(payload) {
    vehicle = payload.vehicle;
    const services = window.MatchmakerLogic.flattenRecommendations(
      payload.recommendations
    );

    slides = services.map(buildSlide);
    if (slides.length === 0) {
      alert("Generate recommendations before opening presentation mode.");
      return;
    }

    index = 0;
    $("presentation-vehicle").textContent = `${vehicle.year} Toyota ${vehicle.model} · ${vehicle.mileage.toLocaleString()} miles`;
    $("presentation-overlay").classList.add("active");
    document.body.style.overflow = "hidden";
    render();
  }

  function close() {
    $("presentation-overlay")?.classList.remove("active");
    document.body.style.overflow = "";
  }

  function next() {
    if (index >= slides.length - 1) {
      close();
      return;
    }
    index += 1;
    render();
  }

  function previous() {
    if (index === 0) return;
    index -= 1;
    render();
  }

  function init() {
    $("presentation-close")?.addEventListener("click", close);
    $("presentation-next")?.addEventListener("click", next);
    $("presentation-prev")?.addEventListener("click", previous);

    document.addEventListener("keydown", (event) => {
      if (!$("presentation-overlay")?.classList.contains("active")) return;
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") next();
      if (event.key === "ArrowLeft") previous();
    });
  }

  window.CustomerPresentation = { open, close };
  document.addEventListener("DOMContentLoaded", init);
})();