// =====================================================
// LOAD REMINDERS
// =====================================================

async function renderReminders() {
  const reminderCards = qs("#reminderCards");

  if (!reminderCards) return;

  const user = JSON.parse(window.localStorage.getItem("payalert_user") || "{}");

  if (!user.id) {
    reminderCards.innerHTML = `<p class="empty">Please login first.</p>`;
    return;
  }

  try {
    const response = await fetch(
      `https://payalert-azure.vercel.app/api/payments?user_id=${user.id}`,
    );

    const data = await response.json();

    console.log("REMINDERS FROM DATABASE:", data);

    if (!response.ok) {
      throw new Error(data.message || "Failed to load reminders");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reminders = data
      .filter((payment) => {
        if (payment.status === "Paid") {
          return false;
        }

        const dueDate = new Date(payment.due_date);
        dueDate.setHours(0, 0, 0, 0);

        const difference = (dueDate - today) / (1000 * 60 * 60 * 24);

        return difference >= 0 && difference <= 7;
      })
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

    if (reminders.length === 0) {
      reminderCards.innerHTML = `<p class="empty">No upcoming reminders.</p>`;
      return;
    }

    reminderCards.innerHTML = reminders
      .map((payment) => {
        const dueDate = new Date(payment.due_date);

        const difference = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

        let badgeClass = "badge-info";
        let badgeText = "Upcoming";
        let message = "";

        if (difference === 0) {
          badgeClass = "badge-danger";
          badgeText = "Due Today";
          message = `₹${payment.amount} is due today.`;
        } else if (difference <= 3) {
          badgeClass = "badge-danger";
          badgeText = "Due Soon";
          message = `₹${payment.amount} is due in ${difference} day${
            difference === 1 ? "" : "s"
          }.`;
        } else {
          badgeClass = "badge-warning";
          badgeText = "Upcoming";
          message = `₹${payment.amount} is due in ${difference} days.`;
        }

        return `
          <div class="card">

            <span class="badge ${badgeClass}">
              ${badgeText}
            </span>

            <h3 class="mt-15">
              ${payment.name}
            </h3>

            <p>
              ${message}
            </p>

            <p>
              Due Date: ${formatDate(payment.due_date)}
            </p>

            <br />

            <a
              class="btn btn-outline"
              href="payment-details.html?id=${payment.id}"
            >
              View Payment
            </a>

          </div>
        `;
      })
      .join("");
  } catch (error) {
    console.error("Load reminders error:", error);

    reminderCards.innerHTML = `<p class="empty">Unable to load reminders.</p>`;
  }
}
// =====================================================
// RENDER PAYMENTS
// =====================================================

async function renderPayments() {
  const body = qs("#paymentRows");

  if (!body) return;

  const user = JSON.parse(window.localStorage.getItem("payalert_user") || "{}");

  if (!user.id) {
    body.innerHTML = `<tr><td colspan="6" class="empty">Please login first.</td></tr>`;
    return;
  }

  try {
    const response = await fetch(
      `https://payalert-azure.vercel.app/api/payments?user_id=${user.id}`,
    );

    const data = await response.json();

    console.log("PAYMENTS FROM DATABASE:", data);

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch payments");
    }

    // =====================================================
    // DASHBOARD STATISTICS
    // =====================================================

    const paymentCount = qs("#paymentCount");

    if (paymentCount) {
      paymentCount.textContent = data.length;
    }

    const total = data.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0,
    );

    const totalAmount = qs("#totalAmount");

    if (totalAmount) {
      totalAmount.textContent = money(total);
    }

    // =====================================================
    // DUE SOON
    // =====================================================

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueSoonCount = data.filter((payment) => {
      if (payment.status === "Paid") {
        return false;
      }

      const dueDate = new Date(payment.due_date);
      dueDate.setHours(0, 0, 0, 0);

      const difference = (dueDate - today) / (1000 * 60 * 60 * 24);

      return difference >= 0 && difference <= 7;
    }).length;

    const dueSoonElement = qs("#dueSoonCount");

    if (dueSoonElement) {
      dueSoonElement.textContent = dueSoonCount;
    }

    // =====================================================
    // PAID THIS MONTH
    // =====================================================

    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const paidThisMonth = data.filter((payment) => {
      if (payment.status !== "Paid") {
        return false;
      }

      const paymentDate = new Date(payment.updated_at);

      return (
        paymentDate.getMonth() === currentMonth &&
        paymentDate.getFullYear() === currentYear
      );
    }).length;

    const paidElement = qs("#paidThisMonthCount");

    if (paidElement) {
      paidElement.textContent = paidThisMonth;
    }

    // =====================================================
    // PAYMENT TABLE
    // =====================================================

    const displayData = window.location.pathname.endsWith("/dashboard.html")
      ? data.filter((payment) => payment.status !== "Paid")
      : data;

    body.innerHTML =
      displayData
        .map(
          (p) => `
          <tr>

            <td>
              <strong>${p.name}</strong>
            </td>

            <td>
              ${p.category || "-"}
            </td>

            <td>
              ${money(p.amount)}
            </td>

            <td>
              ${formatDate(p.due_date)}
            </td>

            <td>
              <span class="badge ${
                p.status === "Due Soon"
                  ? "badge-warning"
                  : p.status === "Paid"
                    ? "badge-success"
                    : "badge-success"
              }">
                ${p.status}
              </span>
            </td>

            <td>

              <a
                class="btn btn-secondary"
                href="payment-details.html?id=${p.id}"
              >
                View
              </a>

              <a
                class="btn btn-secondary"
                href="edit-payment.html?id=${p.id}"
              >
                Edit
              </a>

              ${
                p.status !== "Paid"
                  ? `
      <button
        type="button"
        class="btn btn-primary"
        onclick="markPaymentAsPaid(${p.id})"
      >
        Mark Paid
      </button>
    `
                  : ""
              }

              <button
                type="button"
                class="btn btn-danger"
                onclick="deletePayment(${p.id})"
              >
                Delete
              </button>

            </td>

          </tr>
        `,
        )
        .join("") ||
      `
        <tr>
          <td colspan="6" class="empty">
            No payments found.
          </td>
        </tr>
      `;
  } catch (error) {
    console.error("Load payments error:", error);

    body.innerHTML = `
      <tr>
        <td colspan="6" class="empty">
          Unable to load payments.
        </td>
      </tr>
    `;
  }
}

// =====================================================
// DELETE PAYMENT
// =====================================================

async function deletePayment(paymentId) {
  const user = JSON.parse(localStorage.getItem("payalert_user") || "{}");

  if (!user.id) {
    alert("Please login first.");
    return;
  }

  const confirmDelete = confirm(
    "Are you sure you want to delete this payment?",
  );

  if (!confirmDelete) {
    return;
  }

  try {
    const response = await fetch(
      "https://payalert-azure.vercel.app/api/payments",
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: paymentId,
          user_id: user.id,
        }),
      },
    );

    const data = await response.json();

    console.log("DELETE PAYMENT RESPONSE:", data);

    if (response.ok) {
      alert("Payment deleted successfully!");

      renderPayments();
    } else {
      alert(data.message || "Failed to delete payment.");
    }
  } catch (error) {
    console.error("Delete payment error:", error);

    alert("Unable to connect to the server.");
  }
}

// =====================================================
// MARK PAYMENT AS PAID
// =====================================================

async function markPaymentAsPaid(paymentId) {
  const user = JSON.parse(localStorage.getItem("payalert_user") || "{}");

  if (!user.id) {
    alert("Please login first.");
    return;
  }

  const confirmPaid = confirm("Have you already paid this payment?");

  if (!confirmPaid) {
    return;
  }

  try {
    const response = await fetch(
      "https://payalert-azure.vercel.app/api/payments/mark-paid",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: paymentId,
          user_id: user.id,
        }),
      },
    );

    const data = await response.json();

    console.log("MARK PAID RESPONSE:", data);

    if (response.ok) {
      alert("Payment marked as paid!");

      renderPayments();
    } else {
      alert(data.message || "Failed to mark payment as paid.");
    }
  } catch (error) {
    console.error("Mark paid error:", error);

    alert("Unable to connect to the server.");
  }
}

// =====================================================
// ADD PAYMENT
// =====================================================

const form = qs("#paymentForm");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    console.log("PAYMENT FORM SUBMITTED");

    const user = JSON.parse(
      window.localStorage.getItem("payalert_user") || "{}",
    );

    if (!user.id) {
      alert("Please login first.");
      return;
    }

    const formData = new FormData(form);

    const reminderValue = formData.get("reminder");

    const paymentData = {
      user_id: user.id,
      name: formData.get("name"),
      category: formData.get("category"),
      amount: Number(formData.get("amount")),
      due_date: formData.get("dueDate"),
      frequency: formData.get("frequency"),
      reminder_before: Number(reminderValue.split(" ")[0]),

      description: formData.get("notes"),
    };

    console.log("PAYMENT DATA:", paymentData);

    try {
      const response = await fetch(
        "https://payalert-azure.vercel.app/api/payments",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(paymentData),
        },
      );

      const data = await response.json();

      console.log("PAYMENT RESPONSE:", data);

      if (response.ok) {
        alert("Payment added successfully!");

        form.reset();

        window.location.href = "payments.html";
      } else {
        alert(data.message || "Failed to add payment.");
      }
    } catch (error) {
      console.error("Payment error:", error);

      alert("Unable to connect to the server.");
    }
  });
}
// =====================================================
// LOAD USER PROFILE
// =====================================================

async function loadProfile() {
  const nameInput = qs("#profileName");
  const emailInput = qs("#profileEmail");
  const phoneInput = qs("#profilePhone");

  if (!nameInput || !emailInput || !phoneInput) return;

  const user = JSON.parse(window.localStorage.getItem("payalert_user") || "{}");

  if (!user.id) {
    alert("Please login first.");
    return;
  }

  try {
    const response = await fetch(
      `https://payalert-azure.vercel.app/api/auth/profile?user_id=${user.id}`,
    );

    const data = await response.json();

    console.log("PROFILE DATA:", data);

    if (!response.ok) {
      throw new Error(data.message || "Failed to load profile");
    }

    nameInput.value = data.name || "";
    emailInput.value = data.email || "";
    phoneInput.value = data.phone || "";
  } catch (error) {
    console.error("Load profile error:", error);
    alert("Unable to load profile.");
  }
}
// =====================================================
// UPDATE USER PROFILE
// =====================================================

const profileForm = qs("#profileForm");

if (profileForm) {
  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = JSON.parse(
      window.localStorage.getItem("payalert_user") || "{}",
    );

    if (!user.id) {
      alert("Please login first.");
      return;
    }

    const name = qs("#profileName").value.trim();
    const phone = qs("#profilePhone").value.trim();
    const password = qs("#profilePassword").value;

    if (!name) {
      alert("Name is required.");
      return;
    }

    const profileData = {
      user_id: user.id,
      name: name,
      phone: phone,
      password: password,
    };

    try {
      const response = await fetch(
        "https://payalert-azure.vercel.app/api/auth/profile",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(profileData),
        },
      );

      const data = await response.json();

      console.log("UPDATE PROFILE RESPONSE:", data);

      if (response.ok) {
        alert("Profile updated successfully!");

        // Update localStorage user information
        localStorage.setItem("payalert_user", JSON.stringify(data.user));

        // Clear password field
        qs("#profilePassword").value = "";
      } else {
        alert(data.message || "Failed to update profile.");
      }
    } catch (error) {
      console.error("Update profile error:", error);
      alert("Unable to connect to the server.");
    }
  });
}
// =====================================================
// LOAD NOTIFICATION SETTINGS
// =====================================================

async function loadNotificationSettings() {
  const emailCheckbox = qs("#emailNotifications");
  const paymentCheckbox = qs("#paymentReminders");
  const weeklyCheckbox = qs("#weeklySummary");
  const reminderTime = qs("#reminderTime");

  if (!emailCheckbox || !paymentCheckbox || !weeklyCheckbox || !reminderTime) {
    return;
  }

  const user = JSON.parse(window.localStorage.getItem("payalert_user") || "{}");

  if (!user.id) {
    alert("Please login first.");
    return;
  }

  try {
    const response = await fetch(
      `https://payalert-azure.vercel.app/api/auth/notification-settings?user_id=${user.id}`,
    );

    const data = await response.json();

    console.log("NOTIFICATION SETTINGS:", data);

    if (!response.ok) {
      throw new Error(data.message || "Failed to load notification settings");
    }

    emailCheckbox.checked = data.email_notifications;
    paymentCheckbox.checked = data.payment_reminders;
    weeklyCheckbox.checked = data.weekly_summary;
    reminderTime.value = data.reminder_time || "09:00";
  } catch (error) {
    console.error("Load notification settings error:", error);

    alert("Unable to load notification settings.");
  }
}
// =====================================================
// LOAD REPORTS
// =====================================================

async function loadReports() {
  const monthlyElement = qs("#monthlyEstimate");
  const yearlyElement = qs("#yearlyEstimate");
  const activeElement = qs("#activePayments");
  const categoryElement = qs("#categorySpending");

  if (!monthlyElement || !yearlyElement || !activeElement || !categoryElement) {
    return;
  }

  const user = JSON.parse(window.localStorage.getItem("payalert_user") || "{}");

  if (!user.id) {
    categoryElement.innerHTML = `<p class="empty">Please login first.</p>`;
    return;
  }

  try {
    const response = await fetch(
      `https://payalert-azure.vercel.app/api/payments?user_id=${user.id}`,
    );

    const data = await response.json();

    console.log("REPORT DATA:", data);

    if (!response.ok) {
      throw new Error(data.message || "Failed to load reports");
    }

    // =====================================================
    // ACTIVE PAYMENTS
    // =====================================================

    const activePayments = data.filter((payment) => payment.status !== "Paid");

    activeElement.textContent = activePayments.length;

    // =====================================================
    // MONTHLY ESTIMATE
    // =====================================================

    let monthlyTotal = 0;

    activePayments.forEach((payment) => {
      const amount = Number(payment.amount || 0);
      const frequency = payment.frequency || "Monthly";

      if (frequency === "Daily") {
        monthlyTotal += amount * 30;
      } else if (frequency === "Weekly") {
        monthlyTotal += amount * 4;
      } else if (frequency === "Yearly") {
        monthlyTotal += amount / 12;
      } else {
        monthlyTotal += amount;
      }
    });

    monthlyElement.textContent = money(monthlyTotal);

    // =====================================================
    // YEARLY ESTIMATE
    // =====================================================

    const yearlyTotal = monthlyTotal * 12;

    yearlyElement.textContent = money(yearlyTotal);

    // =====================================================
    // CATEGORY SPENDING
    // =====================================================

    const categoryTotals = {};

    activePayments.forEach((payment) => {
      const category = payment.category || "Other";
      const amount = Number(payment.amount || 0);
      const frequency = payment.frequency || "Monthly";

      let monthlyAmount = amount;

      if (frequency === "Daily") {
        monthlyAmount = amount * 30;
      } else if (frequency === "Weekly") {
        monthlyAmount = amount * 4;
      } else if (frequency === "Yearly") {
        monthlyAmount = amount / 12;
      }

      if (!categoryTotals[category]) {
        categoryTotals[category] = 0;
      }

      categoryTotals[category] += monthlyAmount;
    });

    const categories = Object.entries(categoryTotals);

    if (categories.length === 0) {
      categoryElement.innerHTML = `<p class="empty">No active payments found.</p>`;
      return;
    }

    const maxAmount = Math.max(...categories.map(([, amount]) => amount));

    categoryElement.innerHTML = categories
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => {
        const percentage =
          maxAmount > 0 ? Math.round((amount / maxAmount) * 100) : 0;

        return `
          <p>${category}</p>

          <div class="progress">
            <span
              style="width: ${percentage}%"
            ></span>
          </div>

          <p class="mt-15">
            ${money(amount)} / month
          </p>
        `;
      })
      .join("");
  } catch (error) {
    console.error("Load reports error:", error);

    categoryElement.innerHTML = `<p class="empty">Unable to load reports.</p>`;
  }
}
// =====================================================
// SAVE NOTIFICATION SETTINGS
// =====================================================

const settingsForm = qs("#settingsForm");

if (settingsForm) {
  settingsForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = JSON.parse(
      window.localStorage.getItem("payalert_user") || "{}",
    );

    if (!user.id) {
      alert("Please login first.");
      return;
    }

    const settingsData = {
      user_id: user.id,
      email_notifications: qs("#emailNotifications").checked,
      payment_reminders: qs("#paymentReminders").checked,
      weekly_summary: qs("#weeklySummary").checked,
      reminder_time: qs("#reminderTime").value,
    };

    console.log("SETTINGS DATA:", settingsData);

    try {
      const response = await fetch(
        "https://payalert-azure.vercel.app/api/auth/notification-settings",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(settingsData),
        },
      );

      const data = await response.json();

      console.log("SAVE SETTINGS RESPONSE:", data);

      if (response.ok) {
        alert("Notification settings saved successfully!");
      } else {
        alert(data.message || "Failed to save notification settings.");
      }
    } catch (error) {
      console.error("Save notification settings error:", error);

      alert("Unable to connect to the server.");
    }
  });
}

// =====================================================
// AUTO LOAD PAYMENTS
// =====================================================

window.addEventListener("load", () => {
  renderPayments();
  renderReminders();
  loadProfile();
  loadNotificationSettings();
  loadReports();
});
