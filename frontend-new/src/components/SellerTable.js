export function SellerTable({ id, title, description }) {
  return `
    <section class="seller-panel">
      <div class="seller-panel-heading"><div><h2>${title}</h2><p>${description}</p></div></div>
      <div id="${id}" class="seller-data-table"></div>
    </section>
  `;
}
