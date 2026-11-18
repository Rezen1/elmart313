let cart = JSON.parse(localStorage.getItem("cart")) || [];
let productsData = {};
let currentCategory = "all";

const productsContainer = document.querySelector(".products");
const cartBox = document.querySelector(".cart");
const overlay = document.querySelector(".overlay");
const cartItems = document.querySelector(".cartItems");
const cartCount = document.querySelector(".cartCount");
const toast = document.querySelector(".toast");
const search = document.getElementById("search");

async function loadProducts() {
    try {
        const res = await fetch("/api/products");
        productsData = await res.json();

        if (productsContainer) renderProducts();
        if (document.querySelector(".productPage")) loadProductPage();
    } catch (e) {
        console.error("Помилка завантаження товарів:", e);
    }
}

function showCategory(category) {
    currentCategory = category;
    renderProducts();
}

if (search) {
    search.addEventListener("input", renderProducts);
}

function renderProducts() {
    if (!productsContainer) return;
    productsContainer.innerHTML = "";

    Object.keys(productsData).forEach(id => {
        const p = productsData[id];

        if (currentCategory !== "all" && p.category !== currentCategory) return;
        if (search && !p.name.toLowerCase().includes(search.value.toLowerCase())) return;

        const discount = p.sale === "yes" ? `<div class="discount">${p.discount}</div>` : "";
        const oldPrice = p.sale === "yes" ? `<div class="oldPrice">${p.oldPrice} ₴</div>` : "";

        productsContainer.innerHTML += `
        <div class="card">
            ${discount}
            <img src="/${p.img}">
            <div class="info">
                <div class="title">${p.name}</div>
                <div class="rating">⭐ ${p.rating}</div>
                ${oldPrice}
                <div class="price">${p.price} ₴</div>
                <div class="stock">В наявності: ${p.stock}</div>
                <button class="openProduct" onclick="openProduct(${id})">Переглянути</button>
            </div>
        </div>`;
    });
}

function openProduct(id) {
    localStorage.setItem("selectedProduct", id);
    window.location.href = "/product.html";
}

function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
}

function addToCart(id) {
    const p = productsData[id];
    if (!p) return;
    const item = cart.find(i => i.id == id);
    if (item) { item.qty++; } else {
        cart.push({ id: id, name: p.name, price: p.price, img: p.img, qty: 1 });
    }
    saveCart();
    updateCartCount();
    renderCart();
    showToast("Товар додано в кошик");
}

function updateCartCount() {
    if (!cartCount) return;
    cartCount.textContent = cart.reduce((sum, item) => sum + item.qty, 0);
}

function openCart() {
    if (!cartBox) return;
    cartBox.classList.add("show");
    overlay.classList.add("show");
    renderCart();
}

function closeCart() {
    if (!cartBox) return;
    cartBox.classList.remove("show");
    overlay.classList.remove("show");
}

function renderCart() {
    if (!cartItems) return;
    let total = 0;
    if (cart.length === 0) {
        cartItems.innerHTML = `<div class="emptyCart"><span>🛒</span><h3>Кошик порожній</h3></div>`;
        document.querySelector(".total span:last-child").textContent = "0 ₴";
        return;
    }
    cartItems.innerHTML = "";
    cart.forEach(item => {
        total += item.price * item.qty;
        cartItems.innerHTML += `
        <div class="cartItem">
            <img src="/${item.img}">
            <div class="cartInfo">
                <h3>${item.name}</h3>
                <div class="cartPrice">${item.price} ₴</div>
                <div>Кількість: ${item.qty}</div>
            </div>
            <button class="removeBtn" onclick="removeItem(${item.id})">×</button>
        </div>`;
    });
    document.querySelector(".total span:last-child").textContent = total + " ₴";
}

function removeItem(id) {
    cart = cart.filter(item => item.id != id);
    saveCart();
    renderCart();
    updateCartCount();
}

function clearCart() {
    cart = [];
    saveCart();
    renderCart();
    updateCartCount();
}

async function loadProductPage() {
    const id = localStorage.getItem("selectedProduct");
    if (!id) return;
    let data = productsData;
    if (Object.keys(data).length === 0) {
        const res = await fetch("/api/products");
        data = await res.json();
    }
    const p = data[id];
    if (!p) return;
    document.querySelector(".productImg").src = "/" + p.img;
    document.querySelector(".productTitle").textContent = p.name;
    document.querySelector(".productPrice").textContent = p.price + " ₴";
    document.querySelector(".productDesc").textContent = p.description;
    document.querySelector(".productRating").textContent = "⭐ " + p.rating;
    document.querySelector(".productStock").textContent = "В наявності: " + p.stock;
}

function addCurrentProductToCart() {
    const id = localStorage.getItem("selectedProduct");
    if (id) addToCart(Number(id));
}

const buyBtn = document.querySelector(".buyBtn");
if (buyBtn) {
    buyBtn.onclick = function () {
        if (cart.length === 0) { showToast("Кошик порожній"); return; }
        showToast("Дякуємо за покупку!");
        cart = [];
        saveCart();
        renderCart();
        updateCartCount();
    };
}

function showToast(text) {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2000);
}

if (overlay) overlay.onclick = closeCart;
loadProducts();
updateCartCount();