export function CategoryCard(category, productCount = 0) {
  return `
    <a href="#/category/${category.id}" class="category-card" style="--category-bg:${category.color}">
      <span class="category-icon"><span data-lucide="${category.icon}"></span></span>
      <strong>${category.name}</strong>
      <small>${productCount} produk</small>
    </a>
  `;
}
