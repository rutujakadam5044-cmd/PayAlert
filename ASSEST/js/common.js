const APP_NAME = "PayAlert";
function qs(s) {
  return document.querySelector(s);
}
function qsa(s) {
  return document.querySelectorAll(s);
}
function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
function money(value) {
  return "₹" + Number(value || 0).toLocaleString("en-IN");
}
function getPayments() {
  return JSON.parse(localStorage.getItem("payalert_payments") || "[]");
}
function savePayments(data) {
  localStorage.setItem("payalert_payments", JSON.stringify(data));
}
function seedDemo() {
  if (!localStorage.getItem("payalert_payments")) {
    savePayments([
      {
        id: 1,
        name: "Netflix",
        category: "Entertainment",
        amount: 649,
        dueDate: "2026-10-05",
        frequency: "Monthly",
        status: "Upcoming",
      },
      {
        id: 2,
        name: "Jio",
        category: "Mobile",
        amount: 799,
        dueDate: "2026-10-10",
        frequency: "Monthly",
        status: "Upcoming",
      },
      {
        id: 3,
        name: "Spotify",
        category: "Music",
        amount: 119,
        dueDate: "2026-09-30",
        frequency: "Monthly",
        status: "Due Soon",
      },
    ]);
  }
}
function logout() {
  localStorage.removeItem("payalert_user");
  localStorage.removeItem("payalert_admin");
  location.href = "../index.html";
}
function requireUser() {
  if (!localStorage.getItem("payalert_user")) location.href = "login.html";
}
function requireAdmin() {
  if (!localStorage.getItem("payalert_admin")) location.href = "login.html";
}
function showToast(msg, type = "success") {
  let t = document.querySelector(".toast");
  if (!t) {
    t = document.createElement("div");
    t.className = "toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.cssText =
    "position:fixed;right:20px;bottom:20px;background:" +
    (type === "error" ? "#e74c3c" : "#172033") +
    ";color:white;padding:13px 18px;border-radius:10px;z-index:99;box-shadow:0 10px 30px #0002";
  setTimeout(() => t.remove(), 2500);
}
document.addEventListener("DOMContentLoaded", () => {
  seedDemo();
});
/* =========================================================
   PAYALERT - MOBILE SIDEBAR
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const dashboardLayout = document.querySelector(".dashboard-layout");

  const sidebar = document.querySelector(".sidebar");

  if (!dashboardLayout || !sidebar) {
    return;
  }

  /* -----------------------------------------
       CREATE MOBILE MENU BUTTON
    ----------------------------------------- */

  let menuButton = document.querySelector(".mobile-menu-btn");

  if (!menuButton) {
    menuButton = document.createElement("button");

    menuButton.className = "mobile-menu-btn";

    menuButton.type = "button";

    menuButton.setAttribute("aria-label", "Open menu");

    menuButton.textContent = "☰";

    dashboardLayout.prepend(menuButton);
  }

  /* -----------------------------------------
       CREATE OVERLAY
    ----------------------------------------- */

  let overlay = document.querySelector(".mobile-overlay");

  if (!overlay) {
    overlay = document.createElement("div");

    overlay.className = "mobile-overlay";

    document.body.appendChild(overlay);
  }

  /* -----------------------------------------
       OPEN SIDEBAR
    ----------------------------------------- */

  function openSidebar() {
    sidebar.classList.add("mobile-open");

    overlay.classList.add("active");

    menuButton.textContent = "✕";

    menuButton.setAttribute("aria-label", "Close menu");
  }

  /* -----------------------------------------
       CLOSE SIDEBAR
    ----------------------------------------- */

  function closeSidebar() {
    sidebar.classList.remove("mobile-open");

    overlay.classList.remove("active");

    menuButton.textContent = "☰";

    menuButton.setAttribute("aria-label", "Open menu");
  }

  /* -----------------------------------------
       MENU BUTTON
    ----------------------------------------- */

  menuButton.addEventListener("click", () => {
    if (sidebar.classList.contains("mobile-open")) {
      closeSidebar();
    } else {
      openSidebar();
    }
  });

  /* -----------------------------------------
       OVERLAY CLICK
    ----------------------------------------- */

  overlay.addEventListener("click", closeSidebar);

  /* -----------------------------------------
       CLOSE AFTER CLICKING SIDEBAR LINK
    ----------------------------------------- */

  const sidebarLinks = sidebar.querySelectorAll("a");

  sidebarLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 768) {
        closeSidebar();
      }
    });
  });

  /* -----------------------------------------
       RESET WHEN SCREEN BECOMES DESKTOP
    ----------------------------------------- */

  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      sidebar.classList.remove("mobile-open");

      overlay.classList.remove("active");

      menuButton.textContent = "☰";
    }
  });
});
/* =========================================================
   PAYALERT - MOBILE SIDEBAR
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const dashboardLayout = document.querySelector(".dashboard-layout");

  const sidebar = document.querySelector(".sidebar");

  if (!dashboardLayout || !sidebar) {
    return;
  }

  /* CREATE MOBILE MENU BUTTON */

  let menuButton = document.querySelector(".mobile-menu-btn");

  if (!menuButton) {
    menuButton = document.createElement("button");

    menuButton.className = "mobile-menu-btn";

    menuButton.type = "button";

    menuButton.setAttribute("aria-label", "Open menu");

    menuButton.textContent = "☰";

    dashboardLayout.prepend(menuButton);
  }

  /* CREATE OVERLAY */

  let overlay = document.querySelector(".mobile-overlay");

  if (!overlay) {
    overlay = document.createElement("div");

    overlay.className = "mobile-overlay";

    document.body.appendChild(overlay);
  }

  /* OPEN SIDEBAR */

  function openSidebar() {
    sidebar.classList.add("mobile-open");

    overlay.classList.add("active");

    menuButton.textContent = "✕";

    menuButton.setAttribute("aria-label", "Close menu");
  }

  /* CLOSE SIDEBAR */

  function closeSidebar() {
    sidebar.classList.remove("mobile-open");

    overlay.classList.remove("active");

    menuButton.textContent = "☰";

    menuButton.setAttribute("aria-label", "Open menu");
  }

  /* MENU BUTTON */

  menuButton.addEventListener("click", () => {
    if (sidebar.classList.contains("mobile-open")) {
      closeSidebar();
    } else {
      openSidebar();
    }
  });

  /* OVERLAY CLICK */

  overlay.addEventListener("click", closeSidebar);

  /* CLOSE AFTER SIDEBAR LINK CLICK */

  const sidebarLinks = sidebar.querySelectorAll("a");

  sidebarLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 768) {
        closeSidebar();
      }
    });
  });

  /* RESET ON DESKTOP */

  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      sidebar.classList.remove("mobile-open");

      overlay.classList.remove("active");

      menuButton.textContent = "☰";
    }
  });
});
