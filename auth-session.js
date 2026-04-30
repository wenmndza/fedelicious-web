(function () {
    const AUTH_STORAGE_KEYS = [
        "role",
        "fullName",
        "email",
        "address",
        "adminId",
        "customer_id",
        "latest_res_id"
    ];


    function normalizeRole(role) {
        return String(role || "").trim().toLowerCase();
    }


    function clearAuthState(options = {}) {
        const preserveCart = options.preserveCart === true;


        AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));


        Object.keys(localStorage).forEach((key) => {
            if (/^(latest_|temp_)/i.test(key)) {
                localStorage.removeItem(key);
            }
        });


        if (!preserveCart) {
            localStorage.removeItem("cart");
        }


        sessionStorage.clear();
    }


    function getAuthSnapshot() {
        return {
            role: normalizeRole(localStorage.getItem("role")),
            fullName: (localStorage.getItem("fullName") || "").trim(),
            adminId: (localStorage.getItem("adminId") || "").trim(),
            customerId: (localStorage.getItem("customer_id") || "").trim()
        };
    }


    function requireAdminAccess(options = {}) {
        const session = getAuthSnapshot();
        const isAdmin = session.role.includes("admin") && !!session.adminId && !!session.fullName;


        if (!isAdmin) {
            clearAuthState();
            window.location.replace("login.html");
            return null;
        }


        if (options.superAdminOnly && session.role !== "super admin") {
            window.location.replace(options.redirectOnForbidden || "admin.html");
            return null;
        }


        return {
            ...session,
            isSuperAdmin: session.role === "super admin"
        };
    }


    function updateSuperAdminLink(roleValue) {
        const superAdminLink = document.getElementById("superAdminLink");


        if (!superAdminLink) {
            return;
        }


        superAdminLink.style.display = normalizeRole(roleValue) === "super admin" ? "" : "none";
    }


    function ensureLogoutModal() {
        if (document.getElementById("globalLogoutModal")) {
            return document.getElementById("globalLogoutModal");
        }


        const style = document.createElement("style");
        style.id = "globalLogoutModalStyle";
        style.textContent = `
            .logout-modal-overlay {
                position: fixed;
                inset: 0;
                display: none;
                align-items: center;
                justify-content: center;
                padding: 20px;
                background: rgba(15, 23, 20, 0.5);
                backdrop-filter: blur(6px);
                z-index: 3000;
            }


            .logout-modal-overlay.open {
                display: flex;
            }


            .logout-modal-card {
                width: min(420px, 100%);
                background: linear-gradient(180deg, #fbfffc 0%, #eef9f1 100%);
                border-radius: 24px;
                border: 1px solid rgba(44, 62, 80, 0.08);
                box-shadow: 0 28px 70px rgba(24, 47, 35, 0.24);
                padding: 26px;
                color: #2c3e50;
                font-family: "Poppins", sans-serif;
            }


            .logout-modal-kicker {
                color: #27ae60;
                font-size: 0.74rem;
                font-weight: 700;
                letter-spacing: 0.12em;
                text-transform: uppercase;
            }


            .logout-modal-title {
                margin-top: 10px;
                font-size: 1.45rem;
                font-weight: 700;
            }


            .logout-modal-message {
                margin-top: 10px;
                color: #7f8c8d;
                line-height: 1.6;
                font-size: 0.95rem;
            }


            .logout-modal-actions {
                display: flex;
                justify-content: flex-end;
                gap: 12px;
                margin-top: 22px;
            }


            .logout-modal-btn {
                border: none;
                border-radius: 14px;
                padding: 12px 20px;
                font: inherit;
                font-weight: 700;
                cursor: pointer;
                transition: 0.2s ease;
            }


            .logout-modal-btn:hover {
                transform: translateY(-1px);
            }


            .logout-modal-btn.no {
                background: rgba(44, 62, 80, 0.08);
                color: #2c3e50;
            }


            .logout-modal-btn.yes {
                background: #27ae60;
                color: #ffffff;
                box-shadow: 0 12px 24px rgba(39, 174, 96, 0.24);
            }
        `;
        document.head.appendChild(style);


        const modal = document.createElement("div");
        modal.id = "globalLogoutModal";
        modal.className = "logout-modal-overlay";
        modal.innerHTML = `
            <div class="logout-modal-card" role="dialog" aria-modal="true" aria-labelledby="logoutModalTitle">
                <div class="logout-modal-kicker">Admin Sign Out</div>
                <div class="logout-modal-title" id="logoutModalTitle">Sign out now?</div>
                <div class="logout-modal-message" id="logoutModalMessage">Are you sure you want to sign out?</div>
                <div class="logout-modal-actions">
                    <button type="button" class="logout-modal-btn no" id="logoutModalNo">No</button>
                    <button type="button" class="logout-modal-btn yes" id="logoutModalYes">Yes</button>
                </div>
            </div>
        `;


        document.body.appendChild(modal);
        return modal;
    }


    function closeLogoutModal() {
        const modal = document.getElementById("globalLogoutModal");
        if (!modal) {
            return;
        }


        modal.classList.remove("open");
        modal.removeAttribute("data-target");
        modal.removeAttribute("data-preserve-cart");
        document.body.style.overflow = "";
    }


    function openLogoutModal(message, onConfirm) {
        if (!document.body || !document.head) {
            return window.confirm(message) ? onConfirm() : false;
        }


        const modal = ensureLogoutModal();
        const messageNode = document.getElementById("logoutModalMessage");
        const confirmButton = document.getElementById("logoutModalYes");
        const cancelButton = document.getElementById("logoutModalNo");


        messageNode.textContent = message;
        modal.classList.add("open");
        document.body.style.overflow = "hidden";


        const handleClose = () => {
            closeLogoutModal();
            modal.onclick = null;
            confirmButton.onclick = null;
            cancelButton.onclick = null;
            document.onkeydown = previousKeydown;
        };


        const previousKeydown = document.onkeydown;
        document.onkeydown = function (event) {
            if (typeof previousKeydown === "function") {
                previousKeydown.call(this, event);
            }


            if (event.key === "Escape") {
                handleClose();
            }
        };


        modal.onclick = function (event) {
            if (event.target === modal) {
                handleClose();
            }
        };


        cancelButton.onclick = handleClose;
        confirmButton.onclick = function () {
            handleClose();
            onConfirm();
        };


        return false;
    }


    function logoutToLogin(options = {}) {
        const askConfirm = options.askConfirm !== false;
        const message = options.message || "Are you sure you want to sign out?";
        const target = options.target || "login.html";
        const preserveCart = options.preserveCart === true;


        if (askConfirm) {
            return openLogoutModal(message, function () {
                clearAuthState({ preserveCart });
                window.location.replace(target);
                return true;
            });
        }


        clearAuthState({ preserveCart });
        window.location.replace(target);
        return true;
    }


    window.AUTH_STORAGE_KEYS = AUTH_STORAGE_KEYS;
    window.normalizeRole = normalizeRole;
    window.clearAuthState = clearAuthState;
    window.getAuthSnapshot = getAuthSnapshot;
    window.requireAdminAccess = requireAdminAccess;
    window.updateSuperAdminLink = updateSuperAdminLink;
    window.logoutToLogin = logoutToLogin;
})();



