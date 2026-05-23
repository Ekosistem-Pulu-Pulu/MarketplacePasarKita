export function Loading(message = "Memuat data marketplace...") {
  return `
    <div class="loading-state" role="status">
      <span class="spinner" aria-hidden="true"></span>
      <p>${message}</p>
    </div>
  `;
}
