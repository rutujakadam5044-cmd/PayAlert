document.addEventListener("DOMContentLoaded", () => {
  requireAdmin();
  const rows = qs("#adminPaymentRows");
  if (rows) {
    const data = getPayments();
    rows.innerHTML = data
      .map(
        (p) =>
          `<tr><td>${p.name}</td><td>${money(p.amount)}</td><td>${formatDate(p.dueDate)}</td><td><span class="badge badge-success">${p.status}</span></td><td><a class="btn btn-secondary" href="user-details.html">Details</a></td></tr>`,
      )
      .join("");
  }
  const search = qs("#userSearch");
  if (search)
    search.addEventListener("input", () => {
      qsa("#userTable tbody tr").forEach(
        (r) =>
          (r.style.display = r.textContent
            .toLowerCase()
            .includes(search.value.toLowerCase())
            ? ""
            : "none"),
      );
    });
});
// =====================================================
// LOAD ALL USERS
// =====================================================

async function loadAdminUsers() {
  const userRows = document.querySelector("#userRows");

  if (!userRows) return;

  try {
    const response = await fetch("http://localhost:5000/api/admin/users");

    const data = await response.json();

    console.log("ADMIN USERS:", data);

    if (!response.ok) {
      throw new Error(data.message || "Failed to load users");
    }

    if (data.length === 0) {
      userRows.innerHTML = `
        <tr>
          <td colspan="5" class="empty">
            No users found.
          </td>
        </tr>
      `;
      return;
    }

    userRows.innerHTML = data
      .map(
        (user) => `
          <tr>
            <td>
              <strong>${user.name}</strong>
            </td>

            <td>
              ${user.email}
            </td>

            <td>
              ${user.payment_count}
            </td>

            <td>
              <span class="badge badge-success">
                Active
              </span>
            </td>

            <td>
              <a
                class="btn btn-secondary"
                href="user-details.html?id=${user.id}"
              >
                View
              </a>
            </td>
          </tr>
        `,
      )
      .join("");
  } catch (error) {
    console.error("Load admin users error:", error);

    userRows.innerHTML = `
      <tr>
        <td colspan="5" class="empty">
          Unable to load users.
        </td>
      </tr>
    `;
  }
}
async function loadAdminDashboardStats() {
  const totalUsers = document.querySelector("#totalUsers");
  const totalPayments = document.querySelector("#totalPayments");
  const totalReminders = document.querySelector("#totalReminders");
  const totalMessages = document.querySelector("#totalMessages");

  if (!totalUsers || !totalPayments) return;

  try {
    const response = await fetch("http://localhost:5000/api/admin/users");

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to load users");
    }

    // Total Users
    totalUsers.textContent = data.length;

    // Total Payments
    const paymentCount = data.reduce(
      (total, user) => total + Number(user.payment_count || 0),
      0,
    );

    totalPayments.textContent = paymentCount;
    const reminderResponse = await fetch(
      "http://localhost:5000/api/admin/reminders",
    );

    const reminderData = await reminderResponse.json();

    if (!reminderResponse.ok) {
      throw new Error(reminderData.message || "Failed to load reminders");
    }

    totalReminders.textContent = reminderData.count;
    const messageResponse = await fetch(
      "http://localhost:5000/api/admin/messages/count",
    );

    const messageData = await messageResponse.json();

    if (!messageResponse.ok) {
      throw new Error(messageData.message || "Failed to load messages");
    }

    if (totalMessages) {
      totalMessages.textContent = messageData.count;
    }
  } catch (error) {
    console.error("Dashboard stats error:", error);

    totalUsers.textContent = "0";
    totalPayments.textContent = "0";
  }
}
async function loadAdminReminders() {
  const reminderCards = document.querySelector("#adminReminderCards");

  if (!reminderCards) return;

  try {
    const response = await fetch("http://localhost:5000/api/admin/reminders");

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to load reminders");
    }

    if (data.reminders.length === 0) {
      reminderCards.innerHTML = `
        <p class="empty">
          No reminders found.
        </p>
      `;
      return;
    }

    reminderCards.innerHTML = data.reminders
      .map(
        (reminder) => `
          <div class="card">

            <span class="badge ${
              reminder.reminder_status === "Completed"
                ? "badge-success"
                : "badge-warning"
            }">
  ${reminder.reminder_status}
</span>

            <h3>
              Payment reminder
            </h3>

            <p>
              ${reminder.name} reminder scheduled for
              ${formatDate(reminder.reminder_date)}.
            </p>

            <p>
              Amount: ${money(reminder.amount)}
            </p>

          </div>
        `,
      )
      .join("");
  } catch (error) {
    console.error("Load admin reminders error:", error);

    reminderCards.innerHTML = `
      <p class="empty">
        Unable to load reminders.
      </p>
    `;
  }
}
// =====================================================
// LOAD ALL PAYMENTS FOR ADMIN
// =====================================================

async function loadAdminPayments() {
  const paymentRows = document.querySelector("#adminPaymentRows");

  if (!paymentRows) return;

  try {
    const response = await fetch("http://localhost:5000/api/admin/payments");

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to load payments");
    }

    if (data.length === 0) {
      paymentRows.innerHTML = `
        <tr>
          <td colspan="5" class="empty">
            No payments found.
          </td>
        </tr>
      `;
      return;
    }

    paymentRows.innerHTML = data
      .map(
        (payment) => `
          <tr>
            <td>
              ${payment.user_name}
            </td>

            <td>
              ${payment.name}
            </td>

            <td>
              ${money(payment.amount)}
            </td>

            <td>
              ${formatDate(payment.due_date)}
            </td>

            <td>
              <span class="badge badge-success">
                ${payment.status}
              </span>
            </td>
          </tr>
        `,
      )
      .join("");
  } catch (error) {
    console.error("Load admin payments error:", error);

    paymentRows.innerHTML = `
      <tr>
        <td colspan="5" class="empty">
          Unable to load payments.
        </td>
      </tr>
    `;
  }
}
// =====================================================
// LOAD ADMIN REPORTS
// =====================================================

async function loadAdminReports() {
  const totalPaymentValue = document.querySelector("#adminTotalPaymentValue");

  const activeUsers = document.querySelector("#adminActiveUsers");

  const paidPayments = document.querySelector("#adminPaidPayments");

  const activeProgress = document.querySelector("#adminActiveProgress");

  const paidProgress = document.querySelector("#adminPaidProgress");

  if (
    !totalPaymentValue ||
    !activeUsers ||
    !paidPayments ||
    !activeProgress ||
    !paidProgress
  ) {
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/api/admin/reports");

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to load reports");
    }

    totalPaymentValue.textContent = money(data.total_payment_value);

    activeUsers.textContent = data.active_users;

    paidPayments.textContent = data.paid_payments;

    activeProgress.style.width = data.active_percentage + "%";

    paidProgress.style.width = data.paid_percentage + "%";
  } catch (error) {
    console.error("Load admin reports error:", error);

    totalPaymentValue.textContent = "₹0";
    activeUsers.textContent = "0";
    paidPayments.textContent = "0";

    activeProgress.style.width = "0%";
    paidProgress.style.width = "0%";
  }
}
// =====================================================
// LOAD ADMIN MESSAGES
// =====================================================

async function loadAdminMessages() {
  const messageCards = document.querySelector("#adminMessageCards");

  if (!messageCards) return;

  try {
    const response = await fetch("http://localhost:5000/api/admin/messages");

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to load messages");
    }

    if (data.length === 0) {
      messageCards.innerHTML = `
        <p class="empty">
          No messages found.
        </p>
      `;
      return;
    }

    messageCards.innerHTML = data
      .map(
        (message) => `
          <div class="card">

            <span class="badge ${
              message.status === "New" ? "badge-info" : "badge-success"
            }">
              ${message.status}
            </span>

            <h3>
              ${message.name}
            </h3>

            <p>
              <strong>Subject:</strong>
              ${message.subject || "No subject"}
            </p>

            <p>
              ${message.message}
            </p>

            ${
              message.email
                ? `<p><strong>Email:</strong> ${message.email}</p>`
                : ""
            }

            ${
              message.reply
                ? `
                  <p>
                    <strong>Reply:</strong>
                    ${message.reply}
                  </p>
                `
                : ""
            }

          </div>
        `,
      )
      .join("");
  } catch (error) {
    console.error("Load admin messages error:", error);

    messageCards.innerHTML = `
      <p class="empty">
        Unable to load messages.
      </p>
    `;
  }
}
async function loadReminderTemplates() {
  const container = document.querySelector("#templateCards");

  if (!container) return;

  try {
    const response = await fetch(
      "http://localhost:5000/api/admin/reminder-templates",
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to load templates");
    }

    if (data.length === 0) {
      container.innerHTML = `
        <p class="empty">No reminder templates found.</p>
      `;
      return;
    }

    container.innerHTML = data
      .map(
        (template) => `
          <div class="card">
            <span class="badge badge-success">${template.status}</span>

            <h3>${template.name}</h3>

            <p>${template.message}</p>

            <br />

            <button
  class="btn btn-outline"
  onclick="editReminderTemplate(${template.id})"
>
  Edit
</button>
        <button
  class="btn btn-outline"
  onclick="deleteReminderTemplate(${template.id})"
>
  Delete
</button>
          </div>
        `,
      )
      .join("");
  } catch (error) {
    console.error("Reminder templates error:", error);

    container.innerHTML = `
      <p class="empty">Failed to load reminder templates.</p>
    `;
  }
}
// =====================================================
// REMINDER TEMPLATE FORM
// =====================================================

function openTemplateForm() {
  const panel = document.querySelector("#templateFormPanel");

  if (panel) {
    panel.style.display = "block";
  }
}

// =====================================================
// CLOSE TEMPLATE FORM
// =====================================================

function closeTemplateForm() {
  const panel = document.querySelector("#templateFormPanel");
  const form = document.querySelector("#templateForm");

  if (panel) {
    panel.style.display = "none";
  }

  if (form) {
    form.reset();
  }
}

// =====================================================
// SAVE REMINDER TEMPLATE
// =====================================================

// =====================================================
// SAVE REMINDER TEMPLATE
// =====================================================

const templateForm = document.querySelector("#templateForm");

if (templateForm) {
  templateForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = document.querySelector("#templateName").value.trim();
    const message = document.querySelector("#templateMessage").value.trim();

    const status = document.querySelector("#templateStatus").value;

    const editingId = templateForm.dataset.editingId;

    if (!name || !message) {
      showToast("Please fill all required fields.", "error");
      return;
    }

    try {
      let response;

      // =================================================
      // EDIT EXISTING TEMPLATE
      // =================================================

      if (editingId) {
        response = await fetch(
          "http://localhost:5000/api/admin/reminder-templates",
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: editingId,
              name: name,
              message: message,
              status: status,
            }),
          },
        );
      }

      // =================================================
      // CREATE NEW TEMPLATE
      // =================================================
      else {
        response = await fetch(
          "http://localhost:5000/api/admin/reminder-templates",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: name,
              message: message,
              status: status,
            }),
          },
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save template");
      }

      // =================================================
      // SUCCESS MESSAGE
      // =================================================

      if (editingId) {
        showToast("Template updated successfully!");
      } else {
        showToast("Template created successfully!");
      }

      // Remove edit mode
      delete templateForm.dataset.editingId;

      // Reset form
      templateForm.reset();

      // Close form
      closeTemplateForm();

      // Reload templates
      loadReminderTemplates();
    } catch (error) {
      console.error("Save reminder template error:", error);

      showToast("Failed to save reminder template.", "error");
    }
  });
}
// =====================================================
// EDIT REMINDER TEMPLATE
// =====================================================

async function editReminderTemplate(id) {
  try {
    const response = await fetch(
      "http://localhost:5000/api/admin/reminder-templates",
    );

    const templates = await response.json();

    if (!response.ok) {
      throw new Error(templates.message || "Failed to load template");
    }

    const template = templates.find((item) => Number(item.id) === Number(id));

    if (!template) {
      showToast("Template not found.", "error");
      return;
    }

    document.querySelector("#templateFormPanel").style.display = "block";

    document.querySelector("#templateName").value = template.name;

    document.querySelector("#templateMessage").value = template.message;

    document.querySelector("#templateStatus").value = template.status;

    const form = document.querySelector("#templateForm");

    form.dataset.editingId = template.id;

    document.querySelector("#templateFormPanel").scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  } catch (error) {
    console.error("Edit reminder template error:", error);

    showToast("Failed to load template.", "error");
  }
}
// =====================================================
// DELETE REMINDER TEMPLATE
// =====================================================

async function deleteReminderTemplate(id) {
  const confirmed = confirm("Are you sure you want to delete this template?");

  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch(
      "http://localhost:5000/api/admin/reminder-templates",
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: id,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to delete template");
    }

    showToast("Template deleted successfully!");

    loadReminderTemplates();
  } catch (error) {
    console.error("Delete reminder template error:", error);

    showToast("Failed to delete template.", "error");
  }
}
// =====================================================
// LOAD USERS WHEN PAGE OPENS
// =====================================================

window.addEventListener("load", () => {
  loadAdminUsers();
  loadAdminDashboardStats();
  loadAdminReminders();
  loadAdminPayments();
  loadAdminReports();
  loadAdminMessages();
  loadReminderTemplates();
});

/* ================================
   MOBILE SIDEBAR
================================ */

const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const sidebar = document.querySelector(".sidebar");

if (mobileMenuBtn && sidebar) {
  mobileMenuBtn.addEventListener("click", () => {
    sidebar.classList.toggle("mobile-open");

    if (sidebar.classList.contains("mobile-open")) {
      mobileMenuBtn.textContent = "✕";
    } else {
      mobileMenuBtn.textContent = "☰";
    }
  });
}
