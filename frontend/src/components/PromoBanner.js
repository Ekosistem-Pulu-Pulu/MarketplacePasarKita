import { escapeHtml } from "../utils/validation.js";

export function PromoBanner({ promos }) {
  return `
    <section class="promo-carousel" aria-label="Promo pilihan">
      <div class="promo-track">
        ${promos
          .map(
            (promo, index) => `
              <article class="promo-card ${index === 0 ? "featured" : ""}">
                <div>
                  <span class="promo-label">${escapeHtml(promo.label)}</span>
                  <h2>${escapeHtml(promo.title)}</h2>
                  <p>${escapeHtml(promo.description)}</p>
                  <a class="btn ${index === 0 ? "btn-primary" : "btn-secondary"}" href="${escapeHtml(promo.href)}">
                    Lihat pilihan
                  </a>
                </div>
                <img src="${escapeHtml(promo.image)}" alt="${escapeHtml(promo.title)}" loading="lazy" />
              </article>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}
