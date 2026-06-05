import { CartItem } from "../components/CartItem.js";
import { CheckoutSummary } from "../components/CheckoutSummary.js";
import { EmptyState } from "../components/EmptyState.js";
import { showToast } from "../components/Toast.js";
import {
  getCartState,
  removeCartItem,
  toggleCartItem,
  updateCartQty,
} from "../services/cartService.js";
import { isAuthenticated } from "../utils/storage.js";

function getCartSummary(items) {
  const subtotal = items.reduce((total, item) => total + item.price * item.qty, 0);
  return {
    subtotal,
    discount: 0,
    shipping: 0,
    total: subtotal,
  };
}

export async function render() {
  const { items } = await getCartState();
  const selectedItems = items.filter((item) => item.selected && item.stock > 0);
  const summary = getCartSummary(selectedItems);

  return `
    <section class="page-heading">
      <div>
        <span class="eyebrow">Keranjang</span>
        <h1>Atur belanjaan sebelum checkout</h1>
        <p>Pilih produk yang ingin dibeli, ubah jumlah, atau hapus item yang tidak diperlukan.</p>
      </div>
      <a class="btn btn-secondary" href="#/products">Lanjut belanja</a>
    </section>

    ${
      items.length
        ? `
          <section class="cart-layout">
            <div class="cart-list">
              <div class="cart-toolbar">
                <strong>${items.length} produk di keranjang</strong>
                <span>${selectedItems.length} produk dipilih</span>
              </div>
              ${items.map(CartItem).join("")}
            </div>
            <form class="summary-form" id="cart-checkout-form">
              ${CheckoutSummary({
                summary,
                buttonLabel: "Checkout",
                disabled: selectedItems.length === 0,
              })}
            </form>
          </section>
        `
        : EmptyState({
            icon: "shopping-cart",
            title: "Keranjang kamu masih kosong",
            message: "Temukan produk favorit dan tambahkan ke keranjang untuk mulai checkout.",
            action: `<a class="btn btn-primary" href="#/products">Belanja sekarang</a>`,
          })
    }
  `;
}

export function afterRender({ navigate, renderRoute }) {
  document.querySelectorAll("[data-cart-select]").forEach((input) => {
    input.addEventListener("change", async () => {
      await toggleCartItem(input.dataset.cartSelect, input.checked);
      renderRoute();
    });
  });

  document.querySelectorAll("[data-cart-qty]").forEach((input) => {
    input.addEventListener("change", async () => {
      await updateCartQty(input.dataset.cartQty, input.value);
      renderRoute();
    });
  });

  document.querySelectorAll("[data-cart-inc]").forEach((button) => {
    button.addEventListener("click", async () => {
      const input = document.querySelector(`[data-cart-qty="${button.dataset.cartInc}"]`);
      await updateCartQty(button.dataset.cartInc, Number(input.value || 1) + 1);
      renderRoute();
    });
  });

  document.querySelectorAll("[data-cart-dec]").forEach((button) => {
    button.addEventListener("click", async () => {
      const input = document.querySelector(`[data-cart-qty="${button.dataset.cartDec}"]`);
      await updateCartQty(button.dataset.cartDec, Number(input.value || 1) - 1);
      renderRoute();
    });
  });

  document.querySelectorAll("[data-cart-remove]").forEach((button) => {
    button.addEventListener("click", async () => {
      await removeCartItem(button.dataset.cartRemove);
      showToast("Produk dihapus dari keranjang.", "info");
      renderRoute();
    });
  });

  document.querySelector("#cart-checkout-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const selectedItems = (await getCartState()).items.filter((item) => item.selected && item.stock > 0);
    if (!selectedItems.length) {
      showToast("Pilih produk sebelum checkout.", "error");
      return;
    }
    if (!isAuthenticated()) {
      navigate(`/login?redirect=${encodeURIComponent("/checkout")}`);
      return;
    }
    navigate("/checkout");
  });
}
