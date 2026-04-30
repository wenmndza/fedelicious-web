/**
 * Fedelicious Admin Real-Time Notification System
 * Consolidates SignalR logic for use across all admin pages.
 */

(function () {
    const HUB_URL = "https://fedeliciousapi20260427050618-bmbgddcycgaseyff.southeastasia-01.azurewebsites.net/notificationHub";
    
    let notifications = JSON.parse(localStorage.getItem('fedelicious_notifications') || '[]');
    let unreadCount = parseInt(localStorage.getItem('fedelicious_unread_count') || '0');

    const connection = new signalR.HubConnectionBuilder()
        .withUrl(HUB_URL, {
            skipNegotiation: true,
            transport: signalR.HttpTransportType.WebSockets
        })
        .withAutomaticReconnect()
        .build();

    async function startSignalR() {
        try {
            await connection.start();
            console.log("SignalR Connected.");
            renderNotifications();
        } catch (err) {
            console.error("SignalR Error:", err);
            setTimeout(startSignalR, 5000);
        }
    }

    connection.on("ReceiveNotification", (notif) => {
        console.log("New Notification:", notif);
        
        const newNotif = {
            id: Date.now(),
            type: (notif.type || notif.Type || "").toLowerCase(),
            message: notif.message || notif.Message,
            timestamp: new Date().toLocaleTimeString(),
            isRead: false
        };
        
        notifications.unshift(newNotif);
        unreadCount++;
        
        saveNotifications();
        renderNotifications();
        showToast(newNotif);
        playNotifSound();

        // Optional: Trigger a dashboard data refresh if the function exists
        if (typeof window.loadDashboardData === 'function') {
            window.loadDashboardData();
        }
        // Optional: Trigger an order list refresh if the function exists
        if (typeof window.loadOrders === 'function') {
            window.loadOrders();
        }
        // Optional: Trigger a reservation list refresh if the function exists
        if (typeof window.loadReservations === 'function') {
            window.loadReservations();
        }
    });

    function saveNotifications() {
        localStorage.setItem('fedelicious_notifications', JSON.stringify(notifications.slice(0, 50)));
        localStorage.setItem('fedelicious_unread_count', unreadCount);
    }

    function renderNotifications() {
        const list = document.getElementById('notifList');
        const badge = document.getElementById('notifBadge');
        if (!list || !badge) return;

        if (unreadCount > 0) {
            badge.innerText = unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }

        if (notifications.length === 0) {
            list.innerHTML = '<div style="padding: 20px; text-align: center; color: #95a5a6; font-size: 13px;">No new notifications</div>';
            return;
        }

        list.innerHTML = notifications.map(n => `
            <div class="notification-item ${!n.isRead ? 'new' : ''}">
                <div class="notification-icon ${n.type === 'order' ? 'notif-order' : 'notif-res'}">
                    <i class="fas ${n.type === 'order' ? 'fa-shopping-cart' : 'fa-calendar-check'}"></i>
                </div>
                <div class="notification-content">
                    <div style="font-weight: 600;">${n.type === 'order' ? 'New Order' : 'New Reservation'}</div>
                    <div>${n.message}</div>
                    <div class="notification-time">${n.timestamp}</div>
                </div>
            </div>
        `).join('');
    }

    function showToast(notif) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast-card ${notif.type === 'order' ? 'order' : 'res'}`;
        
        toast.innerHTML = `
            <div class="notification-icon ${notif.type === 'order' ? 'notif-order' : 'notif-res'}" style="width:40px; height:40px;">
                <i class="fas ${notif.type === 'order' ? 'fa-shopping-cart' : 'fa-calendar-check'}"></i>
            </div>
            <div>
                <div style="font-weight: 700; font-size: 14px;">${notif.type === 'order' ? 'ORDER RECEIVED' : 'RESERVATION MADE'}</div>
                <div style="font-size: 13px;">${notif.message}</div>
            </div>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = '0.5s';
            setTimeout(() => toast.remove(), 500);
        }, 5000);
    }

    function playNotifSound() {
        try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.play();
        } catch (e) { console.warn("Audio playback blocked by browser policy."); }
    }

    window.clearNotifications = function() {
        notifications = [];
        unreadCount = 0;
        saveNotifications();
        renderNotifications();
    };

    // Toggle Dropdown
    document.addEventListener('DOMContentLoaded', () => {
        const toggle = document.getElementById('notificationToggle');
        const dropdown = document.getElementById('notifDropdown');

        if (toggle && dropdown) {
            toggle.onclick = (e) => {
                const isVisible = dropdown.style.display === 'block';
                dropdown.style.display = isVisible ? 'none' : 'block';
                
                if (!isVisible) {
                    unreadCount = 0;
                    notifications.forEach(n => n.isRead = true);
                    saveNotifications();
                    renderNotifications();
                }
                e.stopPropagation();
            };

            window.addEventListener('click', () => {
                dropdown.style.display = 'none';
            });
        }

        startSignalR();
    });
})();
