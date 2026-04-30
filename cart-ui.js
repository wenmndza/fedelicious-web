(function () {
    const CART_KEY = "cart";
    const TOAST_DURATION = 1000;
    let toastTimer = null;


    function coerceNumber(value, fallback) {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    }


    function normalizeItem(item) {
        return {
            id: item.id ?? item.menu_id ?? item.menuId ?? item.name,
            name: item.name ?? item.food_name ?? item.foodName ?? "Menu Item",
            price: coerceNumber(item.price, 0),
            qty: Math.max(1, coerceNumber(item.qty ?? item.quantity, 1)),
            image: item.image ?? "images/fede.jpg",
            description: item.description ?? "",
            category: item.category ?? item.category_name ?? item.categoryName ?? ""
        };
    }


    function readCart() {
        try {
            const stored = JSON.parse(localStorage.getItem(CART_KEY)) || [];
            if (!Array.isArray(stored)) {
                return [];
            }


            return stored.map(normalizeItem);
        } catch (error) {
            console.error("Failed to load cart:", error);
            return [];
        }
    }


    function emitCartUpdated(cart) {
        window.dispatchEvent(new CustomEvent("cart:updated", { detail: cart }));
    }


    function persistCart(cart) {
        const normalizedCart = cart.map(normalizeItem);
        localStorage.setItem(CART_KEY, JSON.stringify(normalizedCart));
        emitCartUpdated(normalizedCart);
        return normalizedCart;
    }


    function getItemCount(cart) {
        return cart.reduce((sum, item) => sum + Math.max(1, coerceNumber(item.qty, 1)), 0);
    }


    function ensureBadge(anchor) {
        let badge = anchor.querySelector(".cart-badge");
        if (!badge) {
            badge = document.createElement("span");
            badge.className = "cart-badge";
            badge.textContent = "0";
            anchor.appendChild(badge);
        }


        return badge;
    }


    function ensureGlobalStyles() {
        if (document.getElementById("fede-cart-ui-styles")) {
            return;
        }


        const style = document.createElement("style");
        style.id = "fede-cart-ui-styles";
        style.textContent = `
            .nav-icon[href="cart.html"] {
                position: relative;
                overflow: visible;
            }


            .cart-badge {
                position: absolute;
                top: -8px;
                right: -10px;
                min-width: 20px;
                height: 20px;
                padding: 0 6px;
                border-radius: 999px;
                display: none;
                align-items: center;
                justify-content: center;
                background: #ff7043;
                color: #ffffff;
                font-size: 0.7rem;
                font-weight: 800;
                line-height: 1;
                box-shadow: 0 8px 20px rgba(255, 112, 67, 0.35);
            }


            .fede-toast-host {
                position: fixed;
                left: 50%;
                bottom: 28px;
                transform: translateX(-50%);
                z-index: 9999;
                pointer-events: none;
            }


            .fede-toast {
                min-width: 220px;
                max-width: min(92vw, 360px);
                padding: 14px 18px;
                border-radius: 16px;
                background: rgba(10, 33, 24, 0.96);
                border: 1px solid rgba(255, 255, 255, 0.08);
                color: #ffffff;
                box-shadow: 0 18px 45px rgba(0, 0, 0, 0.28);
                font-size: 0.9rem;
                font-weight: 700;
                text-align: center;
                opacity: 0;
                transform: translateY(18px) scale(0.96);
                transition: opacity 0.18s ease, transform 0.18s ease;
            }


            .fede-toast.show {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        `;


        document.head.appendChild(style);
    }


    function updateBadge() {
        ensureGlobalStyles();


        const cart = readCart();
        const count = getItemCount(cart);
        const anchors = document.querySelectorAll('.nav-icon[href="cart.html"]');


        anchors.forEach((anchor) => {
            const badge = ensureBadge(anchor);
            badge.textContent = String(count);
            badge.style.display = count > 0 ? "flex" : "none";
        });


        return count;
    }


    function getToastElements() {
        ensureGlobalStyles();


        let host = document.getElementById("fede-toast-host");
        if (!host) {
            host = document.createElement("div");
            host.id = "fede-toast-host";
            host.className = "fede-toast-host";
            host.innerHTML = '<div id="fede-toast" class="fede-toast" role="status" aria-live="polite"></div>';
            document.body.appendChild(host);
        }


        return {
            host,
            toast: document.getElementById("fede-toast")
        };
    }


    function showToast(message, duration) {
        const { toast } = getToastElements();
        toast.textContent = message;
        toast.classList.add("show");


        if (toastTimer) {
            clearTimeout(toastTimer);
        }


        toastTimer = window.setTimeout(() => {
            toast.classList.remove("show");
        }, duration ?? TOAST_DURATION);
    }


    function saveCart(cart) {
        const normalizedCart = persistCart(cart);
        updateBadge();
        return normalizedCart;
    }


    function addItem(item, options) {
        const cart = readCart();
        const normalizedItem = normalizeItem(item);
        const match = cart.find((cartItem) => {
            if (normalizedItem.id != null && cartItem.id != null) {
                return String(cartItem.id) === String(normalizedItem.id);
            }


            return cartItem.name.toLowerCase() === normalizedItem.name.toLowerCase();
        });


        if (match) {
            match.qty += normalizedItem.qty;
        } else {
            cart.push(normalizedItem);
        }


        saveCart(cart);
        showToast(options?.message || `${normalizedItem.name} added to cart`);
        return cart;
    }


    window.FedeCart = {
        getCart: readCart,
        saveCart,
        addItem,
        updateBadge,
        showToast,
        getCount: function () {
            return getItemCount(readCart());
        }
    };


    window.addEventListener("storage", function (event) {
        if (event.key === CART_KEY) {
            updateBadge();
        }
    });


    window.addEventListener("cart:updated", function () {
        updateBadge();
    });


    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", updateBadge);
    } else {
        updateBadge();
    }
}());



