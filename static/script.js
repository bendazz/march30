const container = () => document.getElementById("reports");

// Approximate centroids for the regions used in intel_reports.py
const REGION_COORDS = {
  "East Asia":        [35.0, 115.0],
  "Eastern Europe":   [50.0,  30.0],
  "East Africa":      [ 1.0,  38.0],
  "South America":    [-15.0, -60.0],
  "Middle East":      [29.0,  45.0],
  "Western Europe":   [48.0,   4.0],
  "West Africa":      [12.0,  -2.0],
  "Northern Europe":  [65.0,  18.0],
  "Central America":  [15.0, -90.0],
  "Southeast Asia":   [ 5.0, 110.0],
  "Central Asia":     [45.0,  68.0],
  "South Asia":       [22.0,  79.0],
};

const CLASSIFICATION_COLORS = {
  "CONFIDENTIAL": "#1f6feb",
  "SECRET":       "#d29922",
  "TOP SECRET":   "#da3633",
};

let mapInstance = null;

async function loadSummariesAndMap(classification) {
  destroyMap();
  const c = container();
  c.innerHTML = `<p class="loading">Loading ${escapeHtml(classification)} summaries&hellip;</p>`;
  try {
    const res = await fetch(
      `/summaries?classification=${encodeURIComponent(classification)}`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const summaries = await res.json();
    renderSummariesWithMap(summaries, classification, c);
  } catch (err) {
    c.innerHTML = `<p class="error">Failed to load: ${err.message}</p>`;
  }
}

function renderSummariesWithMap(summaries, classification, c) {
  c.innerHTML = `
    <section class="split-view">
      <div id="map" class="split-map"></div>
      <div class="split-summaries">
        <h2>${escapeHtml(classification)} Summaries (${summaries.length})</h2>
        ${
          summaries.length
            ? `<ul>${summaries
                .map(
                  (s) => `
              <li>
                <span class="region-tag">${escapeHtml(s.region)}</span>
                <span class="summary-text">${escapeHtml(s.summary)}</span>
              </li>`
                )
                .join("")}</ul>`
            : `<p class="loading">No summaries found.</p>`
        }
      </div>
    </section>`;

  buildMap(summaries);
}

function buildMap(items) {
  mapInstance = L.map("map", { worldCopyJump: true }).setView([20, 20], 2);
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19,
  }).addTo(mapInstance);

  const seen = {};
  items.forEach((item) => {
    const base = REGION_COORDS[item.region];
    if (!base) return;
    const n = seen[item.region] || 0;
    seen[item.region] = n + 1;
    const angle = n * 1.1;
    const radius = n === 0 ? 0 : 1.2 + n * 0.4;
    const lat = base[0] + Math.sin(angle) * radius;
    const lng = base[1] + Math.cos(angle) * radius;
    const color = CLASSIFICATION_COLORS[item.classification] || "#888";

    L.circleMarker([lat, lng], {
      radius: 9,
      fillColor: color,
      color: "#0e1116",
      weight: 2,
      fillOpacity: 0.9,
    })
      .bindPopup(
        `<strong>${escapeHtml(item.classification)}</strong><br>${escapeHtml(item.region)}`
      )
      .addTo(mapInstance);
  });
}

function destroyMap() {
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }
}

function classCss(c) {
  return "c-" + (c || "").toLowerCase().replace(/\s+/g, "-");
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[m]));
}

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("classification-select")
    .addEventListener("change", (e) => {
      if (e.target.value) loadSummariesAndMap(e.target.value);
    });
});
