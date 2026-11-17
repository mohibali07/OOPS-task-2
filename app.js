// ==========================================
// 1. Base Class (Product)
// ==========================================
class Product {
  constructor(
    id,
    name,
    price,
    stockQuantity,
    category = "General",
    image = "",
  ) {
    this.id = id;
    this.name = name;
    this.price = price;
    this.stockQuantity = stockQuantity;
    this.category = category;
    this.image = image;
  }

  checkStock(amount) {
    return amount > 0 && this.stockQuantity >= amount;
  }

  reduceStock(amount) {
    if (amount <= 0 || !this.checkStock(amount)) {
      return false;
    }
    this.stockQuantity = Math.max(0, this.stockQuantity - amount);
    return true;
  }

  restock(amount) {
    if (amount > 0) {
      this.stockQuantity += amount;
    }
  }
}

// ==========================================
// 2. Subclass (DiscountedProduct)
// ==========================================
class DiscountedProduct extends Product {
  constructor(
    id,
    name,
    price,
    stockQuantity,
    discountPercentage,
    category = "General",
    image = "",
  ) {
    super(id, name, price, stockQuantity, category, image);
    this.discountPercentage = discountPercentage;
  }

  getFinalPrice() {
    const discount = this.price * (this.discountPercentage / 100);
    return Number((this.price - discount).toFixed(2));
  }
}

// ==========================================
// 3. Manager Class (ShoppingCart)
// ==========================================
class ShoppingCart {
  constructor() {
    this.cartItems = [];
    this.promoDiscountPercent = 0;
    this.promoCode = "";
  }

  getUnitPrice(product) {
    return typeof product.getFinalPrice === "function"
      ? product.getFinalPrice()
      : product.price;
  }

  addItem(product, quantity = 1) {
    if (quantity <= 0) return false;

    if (!product.checkStock(quantity)) {
      console.log(`Out of stock! Cannot add ${quantity}x ${product.name}.`);
      return false;
    }

    product.reduceStock(quantity);

    const existing = this.cartItems.find(
      (item) => item.product.id === product.id,
    );
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.cartItems.push({ product, quantity });
    }

    return true;
  }

  removeItem(productId) {
    const index = this.cartItems.findIndex(
      (item) => item.product.id === productId,
    );
    if (index === -1) return false;

    const removed = this.cartItems[index];
    removed.product.restock(removed.quantity);
    this.cartItems.splice(index, 1);
    return true;
  }

  updateQuantity(productId, delta) {
    const item = this.cartItems.find((i) => i.product.id === productId);
    if (!item) return false;

    if (delta > 0) {
      return this.addItem(item.product, delta);
    }

    if (delta < 0) {
      const decreaseBy = Math.abs(delta);
      if (item.quantity - decreaseBy <= 0) {
        return this.removeItem(productId);
      }
      item.quantity -= decreaseBy;
      item.product.restock(decreaseBy);
      return true;
    }

    return false;
  }

  applyPromoCode(code) {
    const normalized = code.trim().toUpperCase();
    if (normalized === "SAVE10") {
      this.promoDiscountPercent = 10;
      this.promoCode = normalized;
      return true;
    }
    return false;
  }

  clearCart(shouldRestock = true) {
    if (shouldRestock) {
      this.cartItems.forEach((item) => item.product.restock(item.quantity));
    }
    this.cartItems = [];
    this.promoDiscountPercent = 0;
    this.promoCode = "";
  }

  calculateRawSubtotal() {
    const raw = this.cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );
    return Number(raw.toFixed(2));
  }

  calculateTotal() {
    const itemsTotal = this.cartItems.reduce((sum, item) => {
      return sum + this.getUnitPrice(item.product) * item.quantity;
    }, 0);

    const afterPromo = itemsTotal * (1 - this.promoDiscountPercent / 100);
    return Number(afterPromo.toFixed(2));
  }

  calculateTotalSavings() {
    const raw = this.calculateRawSubtotal();
    const finalTotal = this.calculateTotal();
    return Number(Math.max(0, raw - finalTotal).toFixed(2));
  }

  printReceipt() {
    if (this.cartItems.length === 0) {
      console.log("Cart is empty.");
      return "Cart is empty.";
    }

    const lines = [
      "=========== RECEIPT ===========",
      `Date: ${new Date().toLocaleString()}`,
      "-------------------------------",
    ];

    this.cartItems.forEach(({ product, quantity }) => {
      const unitPrice = this.getUnitPrice(product);
      const lineTotal = (unitPrice * quantity).toFixed(2);
      const saleTag =
        product instanceof DiscountedProduct
          ? ` (-${product.discountPercentage}%)`
          : "";

      lines.push(
        `${product.name}${saleTag} x${quantity} @ $${unitPrice.toFixed(2)} = $${lineTotal}`,
      );
    });

    lines.push("-------------------------------");

    if (this.promoDiscountPercent > 0) {
      lines.push(`Promo (${this.promoCode}): -${this.promoDiscountPercent}%`);
    }

    const savings = this.calculateTotalSavings();
    if (savings > 0) {
      lines.push(`Total Saved: $${savings.toFixed(2)}`);
    }

    lines.push(`Grand Total: $${this.calculateTotal().toFixed(2)}`);
    lines.push("===============================");

    const text = lines.join("\n");
    console.log(text);
    return text;
  }
}

// ==========================================
// 4. Assignment Console Simulation
// ==========================================
function runSimulation() {
  console.log("--- Running Assignment Simulation ---");

  const laptop = new Product(1, "Laptop", 950, 5);
  const mouse = new Product(2, "Mouse", 25, 10);
  const headphones = new DiscountedProduct(3, "Headphones", 120, 8, 20);

  const testCart = new ShoppingCart();

  console.log("Add 3 Laptops:", testCart.addItem(laptop, 3));
  console.log("Add 6 Laptops:", testCart.addItem(laptop, 6));
  console.log("Add 2 Headphones:", testCart.addItem(headphones, 2));

  console.log("Calculated Total: $" + testCart.calculateTotal());
  testCart.printReceipt();
  console.log("-------------------------------------");
}

runSimulation();

// ==========================================
// 5. Built-in Product Images (Data URIs)
//    Swap any image with "images/file.jpg" if using local photos
// ==========================================
function toDataUri(svgMarkup) {
  return "data:image/svg+xml;utf8," + encodeURIComponent(svgMarkup);
}

function getBuiltInImage(type) {
  const images = {
    laptop: toDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
        <rect width="400" height="300" fill="#eef0f3"/>
        <ellipse cx="200" cy="236" rx="125" ry="12" fill="#d7dbe0"/>
        <rect x="86" y="72" width="228" height="142" rx="10" fill="#1f2937"/>
        <rect x="96" y="82" width="208" height="120" rx="4" fill="#3b82f6"/>
        <polygon points="96,82 220,82 150,202 96,202" fill="#60a5fa" opacity="0.45"/>
        <path d="M56 214 h288 l-12 18 H68 z" fill="#cbd5e1"/>
        <rect x="172" y="214" width="56" height="5" rx="2" fill="#94a3b8"/>
      </svg>
    `),
    headphones: toDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
        <rect width="400" height="300" fill="#f1efe9"/>
        <ellipse cx="200" cy="242" rx="95" ry="11" fill="#dcd7cc"/>
        <path d="M115 168 v-18 a85 85 0 0 1 170 0 v18" fill="none" stroke="#1f2937" stroke-width="18" stroke-linecap="round"/>
        <path d="M126 146 a74 74 0 0 1 148 0" fill="none" stroke="#4b5563" stroke-width="6" stroke-linecap="round"/>
        <rect x="94" y="150" width="34" height="68" rx="16" fill="#111827"/>
        <rect x="272" y="150" width="34" height="68" rx="16" fill="#111827"/>
        <rect x="122" y="158" width="12" height="52" rx="6" fill="#374151"/>
        <rect x="266" y="158" width="12" height="52" rx="6" fill="#374151"/>
      </svg>
    `),
    mouse: toDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
        <rect width="400" height="300" fill="#edf1f4"/>
        <ellipse cx="204" cy="238" rx="64" ry="12" fill="#d3dae0"/>
        <rect x="150" y="76" width="100" height="154" rx="50" fill="#1f2937"/>
        <path d="M150 128 h100" stroke="#374151" stroke-width="2"/>
        <path d="M200 76 v52" stroke="#374151" stroke-width="2"/>
        <rect x="195" y="96" width="10" height="22" rx="5" fill="#9ca3af"/>
        <path d="M168 180 q32 34 64 0" fill="none" stroke="#374151" stroke-width="3" opacity="0.5"/>
      </svg>
    `),
    keyboard: toDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
        <rect width="400" height="300" fill="#eceef2"/>
        <ellipse cx="200" cy="214" rx="145" ry="12" fill="#d2d6de"/>
        <rect x="64" y="102" width="272" height="104" rx="10" fill="#374151"/>
        <rect x="76" y="114" width="248" height="80" rx="5" fill="#1f2937"/>
        <g fill="#e5e7eb">
          <rect x="84" y="122" width="20" height="14" rx="2"/>
          <rect x="110" y="122" width="20" height="14" rx="2"/>
          <rect x="136" y="122" width="20" height="14" rx="2"/>
          <rect x="162" y="122" width="20" height="14" rx="2"/>
          <rect x="188" y="122" width="20" height="14" rx="2"/>
          <rect x="214" y="122" width="20" height="14" rx="2"/>
          <rect x="240" y="122" width="20" height="14" rx="2"/>
          <rect x="266" y="122" width="20" height="14" rx="2"/>
          <rect x="292" y="122" width="24" height="14" rx="2"/>
          <rect x="84" y="142" width="28" height="14" rx="2"/>
          <rect x="118" y="142" width="20" height="14" rx="2"/>
          <rect x="144" y="142" width="20" height="14" rx="2"/>
          <rect x="170" y="142" width="20" height="14" rx="2"/>
          <rect x="196" y="142" width="20" height="14" rx="2"/>
          <rect x="222" y="142" width="20" height="14" rx="2"/>
          <rect x="248" y="142" width="20" height="14" rx="2"/>
          <rect x="274" y="142" width="42" height="14" rx="2"/>
          <rect x="84" y="164" width="32" height="14" rx="2"/>
          <rect x="122" y="164" width="116" height="14" rx="2"/>
          <rect x="244" y="164" width="32" height="14" rx="2"/>
          <rect x="282" y="164" width="34" height="14" rx="2" fill="#f97316"/>
        </g>
      </svg>
    `),
    hub: toDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
        <rect width="400" height="300" fill="#eef1f1"/>
        <ellipse cx="212" cy="196" rx="110" ry="10" fill="#d5dbdb"/>
        <path d="M110 156 h-38 q-18 0 -18 -24 t18 -24 h24" fill="none" stroke="#4b5563" stroke-width="7" stroke-linecap="round"/>
        <rect x="96" y="96" width="26" height="22" rx="4" fill="#9ca3af"/>
        <rect x="110" y="128" width="210" height="56" rx="10" fill="#94a3b8"/>
        <rect x="114" y="132" width="202" height="44" rx="8" fill="#cbd5e1"/>
        <rect x="138" y="149" width="24" height="10" rx="2" fill="#1e293b"/>
        <rect x="174" y="149" width="24" height="10" rx="2" fill="#1e293b"/>
        <rect x="210" y="149" width="20" height="10" rx="4" fill="#1e293b"/>
        <rect x="244" y="148" width="28" height="12" rx="2" fill="#1e293b"/>
        <circle cx="292" cy="154" r="4" fill="#22c55e"/>
      </svg>
    `),
    speaker: toDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
        <rect width="400" height="300" fill="#efede8"/>
        <ellipse cx="145" cy="236" rx="52" ry="9" fill="#d5d1c8"/>
        <ellipse cx="255" cy="236" rx="52" ry="9" fill="#d5d1c8"/>
        <rect x="100" y="76" width="90" height="152" rx="10" fill="#1f2937"/>
        <circle cx="145" cy="116" r="16" fill="#4b5563"/>
        <circle cx="145" cy="116" r="7" fill="#111827"/>
        <circle cx="145" cy="176" r="30" fill="#374151"/>
        <circle cx="145" cy="176" r="13" fill="#111827"/>
        <rect x="210" y="76" width="90" height="152" rx="10" fill="#1f2937"/>
        <circle cx="255" cy="116" r="16" fill="#4b5563"/>
        <circle cx="255" cy="116" r="7" fill="#111827"/>
        <circle cx="255" cy="176" r="30" fill="#374151"/>
        <circle cx="255" cy="176" r="13" fill="#111827"/>
      </svg>
    `),
  };

  return images[type] || images.laptop;
}

// ==========================================
// 6. E-Commerce Storefront UI (Browser)
// ==========================================
if (typeof document !== "undefined") {
  const catalog = [
    new Product(
      101,
      "ProBook 14 Laptop",
      950,
      5,
      "Computers",
      getBuiltInImage("laptop"),
    ),
    new DiscountedProduct(
      102,
      "Studio Headphones",
      120,
      6,
      20,
      "Audio",
      getBuiltInImage("headphones"),
    ),
    new Product(
      103,
      "Wireless Mouse",
      29,
      10,
      "Accessories",
      getBuiltInImage("mouse"),
    ),
    new Product(
      104,
      "Mechanical Keyboard",
      89,
      4,
      "Accessories",
      getBuiltInImage("keyboard"),
    ),
    new DiscountedProduct(
      105,
      "USB-C Multiport Hub",
      45,
      7,
      15,
      "Accessories",
      getBuiltInImage("hub"),
    ),
    new DiscountedProduct(
      106,
      "Desk Speaker Pair",
      140,
      3,
      10,
      "Audio",
      getBuiltInImage("speaker"),
    ),
  ];

  const storeCart = new ShoppingCart();
  let activeCategory = "All";

  const gridEl = document.getElementById("product-grid");
  const cartListEl = document.getElementById("cart-list");
  const cartCountEl = document.getElementById("cart-count");
  const subtotalEl = document.getElementById("cart-subtotal");
  const savingsRowEl = document.getElementById("savings-row");
  const savingsEl = document.getElementById("cart-savings");
  const totalEl = document.getElementById("cart-total");
  const statusEl = document.getElementById("status-msg");
  const searchInput = document.getElementById("search-input");
  const sortSelect = document.getElementById("sort-select");
  const categoryTabs = document.getElementById("category-tabs");
  const promoForm = document.getElementById("promo-form");
  const promoInput = document.getElementById("promo-input");
  const promoMsgEl = document.getElementById("promo-msg");
  const modalEl = document.getElementById("receipt-modal");
  const receiptBoxEl = document.getElementById("receipt-output");

  let statusTimer;
  function showStatus(msg, isError = false) {
    clearTimeout(statusTimer);
    statusEl.textContent = msg;
    statusEl.className = isError ? "status-pill error" : "status-pill";
    statusTimer = setTimeout(() => {
      statusEl.textContent = "";
    }, 2400);
  }

  function getFilteredProducts() {
    const query = searchInput.value.trim().toLowerCase();
    const sortBy = sortSelect.value;

    const list = catalog.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(query);
      if (!matchesSearch) return false;

      if (activeCategory === "All") return true;
      if (activeCategory === "Sale") return p instanceof DiscountedProduct;
      return p.category === activeCategory;
    });

    if (sortBy === "price-asc") {
      list.sort(
        (a, b) => storeCart.getUnitPrice(a) - storeCart.getUnitPrice(b),
      );
    } else if (sortBy === "price-desc") {
      list.sort(
        (a, b) => storeCart.getUnitPrice(b) - storeCart.getUnitPrice(a),
      );
    }

    return list;
  }

  function renderProducts() {
    const items = getFilteredProducts();

    if (items.length === 0) {
      gridEl.innerHTML = `<p class="empty-state">No products match your search.</p>`;
      return;
    }

    gridEl.innerHTML = items
      .map((product) => {
        const isSale = product instanceof DiscountedProduct;
        const finalPrice = storeCart.getUnitPrice(product);
        const out = product.stockQuantity === 0;
        const low = product.stockQuantity > 0 && product.stockQuantity <= 3;

        let stockClass = "stock-label";
        let stockText = `${product.stockQuantity} in stock`;
        if (out) {
          stockClass += " out";
          stockText = "Out of stock";
        } else if (low) {
          stockClass += " low";
          stockText = `Only ${product.stockQuantity} left`;
        }

        const imgSrc = product.image || getBuiltInImage("laptop");

        return `
          <article class="product-card">
            <div class="product-thumb">
              ${isSale ? `<span class="sale-badge">-${product.discountPercentage}%</span>` : ""}
              <img class="product-img" src="${imgSrc}" alt="${product.name}" />
            </div>
            <div class="product-body">
              <span class="product-category">${product.category}</span>
              <h3 class="product-name">${product.name}</h3>

              <div class="product-meta">
                <div>
                  <span class="price">$${finalPrice.toFixed(2)}</span>
                  ${isSale ? `<span class="old-price">$${product.price.toFixed(2)}</span>` : ""}
                </div>
                <span class="${stockClass}">${stockText}</span>
              </div>

              <button
                class="btn btn-primary add-btn"
                data-id="${product.id}"
                ${out ? "disabled" : ""}
              >
                ${out ? "Unavailable" : "Add to Cart"}
              </button>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function renderCart() {
    const totalCount = storeCart.cartItems.reduce(
      (sum, i) => sum + i.quantity,
      0,
    );
    cartCountEl.textContent = totalCount;

    if (storeCart.cartItems.length === 0) {
      cartListEl.innerHTML = `<p class="empty-state">Your cart is empty.</p>`;
      subtotalEl.textContent = "$0.00";
      savingsRowEl.hidden = true;
      totalEl.textContent = "$0.00";
      return;
    }

    cartListEl.innerHTML = storeCart.cartItems
      .map(({ product, quantity }) => {
        const unitPrice = storeCart.getUnitPrice(product);
        const lineTotal = (unitPrice * quantity).toFixed(2);
        const thumbSrc = product.image || getBuiltInImage("laptop");

        return `
          <div class="cart-item">
            <div class="cart-item-left">
              <img class="cart-thumb" src="${thumbSrc}" alt="${product.name}" />
              <div>
                <div class="cart-item-title">${product.name}</div>
                <div class="cart-item-sub">$${unitPrice.toFixed(2)} &times; ${quantity} = $${lineTotal}</div>
              </div>
            </div>
            <div class="cart-controls">
              <button class="qty-btn" data-action="dec" data-id="${product.id}" aria-label="Decrease">-</button>
              <span class="qty-val">${quantity}</span>
              <button class="qty-btn" data-action="inc" data-id="${product.id}" aria-label="Increase">+</button>
              <button class="remove-x" data-action="remove" data-id="${product.id}" aria-label="Remove">&times;</button>
            </div>
          </div>
        `;
      })
      .join("");

    const rawSubtotal = storeCart.calculateRawSubtotal();
    const savings = storeCart.calculateTotalSavings();
    const finalTotal = storeCart.calculateTotal();

    subtotalEl.textContent = `$${rawSubtotal.toFixed(2)}`;
    if (savings > 0) {
      savingsRowEl.hidden = false;
      savingsEl.textContent = `-$${savings.toFixed(2)}`;
    } else {
      savingsRowEl.hidden = true;
    }
    totalEl.textContent = `$${finalTotal.toFixed(2)}`;
  }

  // Event Listeners
  gridEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".add-btn");
    if (!btn) return;

    const id = Number(btn.dataset.id);
    const product = catalog.find((p) => p.id === id);
    if (!product) return;

    if (storeCart.addItem(product, 1)) {
      showStatus(`Added ${product.name}`);
      renderProducts();
      renderCart();
    } else {
      showStatus("Out of stock!", true);
    }
  });

  cartListEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const id = Number(btn.dataset.id);
    const action = btn.dataset.action;

    if (action === "inc") {
      if (!storeCart.updateQuantity(id, 1)) {
        showStatus("No more stock available.", true);
      }
    } else if (action === "dec") {
      storeCart.updateQuantity(id, -1);
    } else if (action === "remove") {
      storeCart.removeItem(id);
    }

    renderProducts();
    renderCart();
  });

  categoryTabs.addEventListener("click", (e) => {
    const tab = e.target.closest(".tab");
    if (!tab) return;

    categoryTabs
      .querySelectorAll(".tab")
      .forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    activeCategory = tab.dataset.category;
    renderProducts();
  });

  searchInput.addEventListener("input", renderProducts);
  sortSelect.addEventListener("change", renderProducts);

  promoForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const code = promoInput.value;
    if (!code.trim()) return;

    if (storeCart.applyPromoCode(code)) {
      promoMsgEl.textContent = "SAVE10 applied (10% off).";
      promoMsgEl.className = "promo-msg";
      promoInput.value = "";
      renderCart();
    } else {
      promoMsgEl.textContent = "Invalid promo code.";
      promoMsgEl.className = "promo-msg error";
    }
  });

  document.getElementById("clear-btn").addEventListener("click", () => {
    if (storeCart.cartItems.length === 0) return;
    storeCart.clearCart(true);
    promoMsgEl.textContent = "";
    showStatus("Cart cleared");
    renderProducts();
    renderCart();
  });

  document.getElementById("checkout-btn").addEventListener("click", () => {
    if (storeCart.cartItems.length === 0) {
      showStatus("Your cart is empty.", true);
      return;
    }

    receiptBoxEl.textContent = storeCart.printReceipt();
    modalEl.hidden = false;

    storeCart.clearCart(false);
    promoMsgEl.textContent = "";
    renderProducts();
    renderCart();
  });

  function closeModal() {
    modalEl.hidden = true;
  }

  document
    .getElementById("close-modal-btn")
    .addEventListener("click", closeModal);
  document.getElementById("continue-btn").addEventListener("click", closeModal);
  modalEl.addEventListener("click", (e) => {
    if (e.target === modalEl) closeModal();
  });

  renderProducts();
  renderCart();
}
