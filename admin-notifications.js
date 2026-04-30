const HUB_URL =
    "https://fedeliciousapi20260427050618-bmbgddcycgaseyff.southeastasia-01.azurewebsites.net/notificationHub";

let notificationCount = 0;

let notifications =
    JSON.parse(
        localStorage.getItem(
            "admin_notifications"
        ) || "[]"
    );

const connection =
    new signalR.HubConnectionBuilder()

        .withUrl(
            HUB_URL,
            {
                skipNegotiation: false,
                transport:
                    signalR.HttpTransportType.WebSockets |
                    signalR.HttpTransportType.LongPolling
            }
        )

        .withAutomaticReconnect()

        .build();

async function startSignalR() {

    try {

        await connection.start();

        console.log(
            "SignalR Connected"
        );

    }
    catch (error) {

        console.error(
            "SignalR Error:",
            error
        );

        setTimeout(
            startSignalR,
            5000
        );

    }

}

connection.on(
    "ReceiveNotification",

    function (notif) {

        notifications.unshift(notif);

        localStorage.setItem(
            "admin_notifications",
            JSON.stringify(
                notifications
            )
        );

        notificationCount++;

        updateBadge();

        renderNotifications();

        showToast(notif);

    }
);

connection.onclose(
    startSignalR
);

function updateBadge() {

    const badge =
        document.getElementById(
            "notificationBadge"
        );

    if (!badge) {
        return;
    }

    if (notificationCount > 0) {

        badge.style.display =
            "flex";

        badge.innerText =
            notificationCount;

    }
    else {

        badge.style.display =
            "none";

    }

}

function renderNotifications() {

    const list =
        document.getElementById(
            "notificationList"
        );

    if (!list) {
        return;
    }

    list.innerHTML =
        notifications
            .map(function (notif) {

                return `
                    <div class="notification-item new">

                        <div class="notification-icon notif-order">
                            🔔
                        </div>

                        <div class="notification-content">

                            <div>
                                ${notif.message}
                            </div>

                            <div class="notification-time">
                                ${new Date(
                                    notif.timestamp
                                ).toLocaleString()}
                            </div>

                        </div>

                    </div>
                `;

            })
            .join("");

}

function showToast(notif) {

    const container =
        document.getElementById(
            "toast-container"
        );

    if (!container) {
        return;
    }

    const toast =
        document.createElement(
            "div"
        );

    toast.className =
        "toast-card order";

    toast.innerHTML =
        `
        <div>
            🔔
        </div>

        <div>
            ${notif.message}
        </div>
        `;

    container.appendChild(
        toast
    );

    setTimeout(
        function () {

            toast.remove();

        },
        5000
    );

}

document.addEventListener(
    "DOMContentLoaded",

    function () {

        renderNotifications();

        updateBadge();

        startSignalR();

    }
);