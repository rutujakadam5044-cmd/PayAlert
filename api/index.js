const express = require("express");
const cors = require("cors");
const pool = require("../lib/db");
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getNotificationSettings,
  updateNotificationSettings,
  getAllUsers,
  getUserDetails,
  getAllMessages,
  createMessage,
  getMessageCount,
} = require("./controllers/authController");
const {
  addPayment,
  getUserPayments,
  getPaymentById,
  updatePayment,
  deletePayment,
  markPaymentAsPaid,
  getAdminReminders,
  getAllPaymentsForAdmin,
  getAdminReports,
  getReminderTemplates,
  addReminderTemplate,
  updateReminderTemplate,
  deleteReminderTemplate,
} = require("./controllers/paymentController");

require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Auto Payment Reminder API is running!",
  });
});

app.get("/api/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      message: "Neon database connected successfully!",
      time: result.rows[0].now,
    });
  } catch (error) {
    console.error("Database connection error:", error);

    res.status(500).json({
      message: "Database connection failed",
    });
  }
});

app.post("/api/auth/register", registerUser);
app.post("/api/auth/login", loginUser);
app.post("/api/payments", addPayment);
app.get("/api/payments", getUserPayments);
app.get("/api/payment-details", getPaymentById);
app.put("/api/payments", updatePayment);
app.delete("/api/payments", deletePayment);
app.put("/api/payments/mark-paid", markPaymentAsPaid);
app.get("/api/auth/profile", getUserProfile);
app.put("/api/auth/profile", updateUserProfile);
app.get("/api/auth/notification-settings", getNotificationSettings);
app.put("/api/auth/notification-settings", updateNotificationSettings);
app.get("/api/admin/users", getAllUsers);
app.get("/api/admin/user-details", getUserDetails);
app.get("/api/admin/messages", getAllMessages);
app.post("/api/contact", createMessage);
app.get("/api/admin/reminders", getAdminReminders);
app.get("/api/admin/payments", getAllPaymentsForAdmin);
app.get("/api/admin/reports", getAdminReports);
app.get("/api/admin/reminder-templates", getReminderTemplates);
app.post("/api/admin/reminder-templates", addReminderTemplate);
app.put("/api/admin/reminder-templates", updateReminderTemplate);
app.delete("/api/admin/reminder-templates", deleteReminderTemplate);
app.get("/api/admin/messages/count", getMessageCount);

app.get("/api/test-users", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, phone, created_at FROM users ORDER BY id DESC",
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Users fetch error:", error);

    res.status(500).json({
      message: "Could not fetch users",
      error: error.message,
    });
  }
});
module.exports = app;
