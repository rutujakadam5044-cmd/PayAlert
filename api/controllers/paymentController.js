const pool = require("../../lib/db");

// =====================================================
// ADD PAYMENT
// =====================================================

const addPayment = async (req, res) => {
  try {
    const {
      user_id,
      name,
      category,
      amount,
      due_date,
      frequency,
      reminder_before,
      description,
    } = req.body;

    if (!user_id || !name || !amount || !due_date) {
      return res.status(400).json({
        message: "User, payment name, amount and due date are required",
      });
    }

    const reminderDays = Number(reminder_before || 1);

    const paymentResult = await pool.query(
      `INSERT INTO payments
       (
         user_id,
         name,
         category,
         amount,
         due_date,
         frequency,
         reminder_before,
         description
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        user_id,
        name,
        category || null,
        amount,
        due_date,
        frequency || "Monthly",
        reminderDays,
        description || null,
      ],
    );

    const payment = paymentResult.rows[0];

    // Create reminder
    await pool.query(
      `INSERT INTO reminders
       (
         payment_id,
         user_id,
         reminder_date,
         status,
         message
       )
       VALUES (
         $1,
         $2,
         ($3::date - ($4 * INTERVAL '1 day'))::date,
         'Pending',
         $5
       )`,
      [payment.id, user_id, due_date, reminderDays, `${name} payment reminder`],
    );

    res.status(201).json({
      message: "Payment and reminder added successfully",
      payment,
    });
  } catch (error) {
    console.error("Add payment error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// =====================================================
// GET USER PAYMENTS
// =====================================================

const getUserPayments = async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    const result = await pool.query(
      `SELECT *
       FROM payments
       WHERE user_id = $1
       ORDER BY due_date ASC`,
      [user_id],
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Get payments error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// =====================================================
// GET SINGLE PAYMENT
// =====================================================

const getPaymentById = async (req, res) => {
  try {
    const { id, user_id } = req.query;

    if (!id || !user_id) {
      return res.status(400).json({
        message: "Payment ID and User ID are required",
      });
    }

    const result = await pool.query(
      `SELECT *
       FROM payments
       WHERE id = $1 AND user_id = $2`,
      [id, user_id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Payment not found",
      });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Get payment error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// =====================================================
// DELETE PAYMENT
// =====================================================

const deletePayment = async (req, res) => {
  try {
    const { id, user_id } = req.body;

    if (!id || !user_id) {
      return res.status(400).json({
        message: "Payment ID and user ID are required",
      });
    }

    const result = await pool.query(
      `DELETE FROM payments
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, user_id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Payment not found",
      });
    }

    res.status(200).json({
      message: "Payment deleted successfully",
      payment: result.rows[0],
    });
  } catch (error) {
    console.error("Delete payment error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// =====================================================
// UPDATE PAYMENT
// =====================================================

const updatePayment = async (req, res) => {
  try {
    const {
      id,
      user_id,
      name,
      category,
      amount,
      due_date,
      frequency,
      reminder_before,
      description,
    } = req.body;

    if (!id || !user_id || !name || !amount || !due_date) {
      return res.status(400).json({
        message: "Payment ID, user ID, name, amount and due date are required",
      });
    }

    const reminderDays = Number(reminder_before || 1);

    // Update payment
    const result = await pool.query(
      `UPDATE payments
       SET
         name = $1,
         category = $2,
         amount = $3,
         due_date = $4,
         frequency = $5,
         reminder_before = $6,
         description = $7,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 AND user_id = $9
       RETURNING *`,
      [
        name,
        category || null,
        amount,
        due_date,
        frequency || "Monthly",
        reminderDays,
        description || null,
        id,
        user_id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Payment not found",
      });
    }

    const payment = result.rows[0];

    // Update existing reminder
    const reminderResult = await pool.query(
      `UPDATE reminders
       SET
         reminder_date =
           ($1::date - ($2 * INTERVAL '1 day'))::date,
         message = $3,
         status = 'Pending',
         sent_at = NULL
       WHERE payment_id = $4
       AND user_id = $5
       RETURNING *`,
      [due_date, reminderDays, `${name} payment reminder`, id, user_id],
    );

    // If reminder doesn't exist, create it
    if (reminderResult.rows.length === 0) {
      await pool.query(
        `INSERT INTO reminders
         (
           payment_id,
           user_id,
           reminder_date,
           status,
           message
         )
         VALUES (
           $1,
           $2,
           ($3::date - ($4 * INTERVAL '1 day'))::date,
           'Pending',
           $5
         )`,
        [id, user_id, due_date, reminderDays, `${name} payment reminder`],
      );
    }

    res.status(200).json({
      message: "Payment and reminder updated successfully",
      payment,
    });
  } catch (error) {
    console.error("Update payment error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// =====================================================
// MARK PAYMENT AS PAID
// =====================================================

const markPaymentAsPaid = async (req, res) => {
  try {
    const { id, user_id } = req.body;

    if (!id || !user_id) {
      return res.status(400).json({
        message: "Payment ID and user ID are required",
      });
    }

    const result = await pool.query(
      `UPDATE payments
       SET
         status = 'Paid',
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, user_id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Payment not found",
      });
    }

    // Mark related reminder as completed
    await pool.query(
      `UPDATE reminders
       SET
         status = 'Completed',
         sent_at = CURRENT_TIMESTAMP
       WHERE payment_id = $1
       AND user_id = $2`,
      [id, user_id],
    );

    res.status(200).json({
      message: "Payment marked as paid",
      payment: result.rows[0],
    });
  } catch (error) {
    console.error("Mark as paid error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// =====================================================
// GET ADMIN REMINDERS
// =====================================================

const getAdminReminders = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        r.id,
        r.payment_id,
        r.user_id,
        r.reminder_date,
        r.status AS reminder_status,
        r.message,
        p.name,
        p.amount,
        p.due_date,
        p.status AS payment_status
      FROM reminders r
      INNER JOIN payments p
        ON r.payment_id = p.id
      ORDER BY r.reminder_date ASC
      `,
    );

    res.status(200).json({
      count: result.rows.length,
      reminders: result.rows,
    });
  } catch (error) {
    console.error("Get admin reminders error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// =====================================================
// GET ALL PAYMENTS FOR ADMIN
// =====================================================

const getAllPaymentsForAdmin = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        p.id,
        p.user_id,
        p.name,
        p.amount,
        p.due_date,
        p.status,
        u.name AS user_name,
        u.email AS user_email
      FROM payments p
      INNER JOIN users u
        ON p.user_id = u.id
      ORDER BY p.due_date ASC
      `,
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Get all payments for admin error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// =====================================================
// GET ADMIN REPORTS
// =====================================================

const getAdminReports = async (req, res) => {
  try {
    const paymentResult = await pool.query(`
      SELECT
        COUNT(*)::INTEGER AS total_payments,
        COALESCE(SUM(amount), 0) AS total_payment_value,
        COUNT(*) FILTER (
          WHERE status != 'Paid'
        )::INTEGER AS active_payments,
        COUNT(*) FILTER (
          WHERE status = 'Paid'
        )::INTEGER AS paid_payments
      FROM payments
    `);

    const userResult = await pool.query(`
      SELECT COUNT(*)::INTEGER AS active_users
      FROM users
      WHERE id IN (
        SELECT DISTINCT user_id
        FROM payments
      )
    `);

    const paymentData = paymentResult.rows[0];
    const userData = userResult.rows[0];

    const totalPayments = Number(paymentData.total_payments || 0);

    const activePayments = Number(paymentData.active_payments || 0);

    const paidPayments = Number(paymentData.paid_payments || 0);

    const activePercentage =
      totalPayments > 0
        ? Math.round((activePayments / totalPayments) * 100)
        : 0;

    const paidPercentage =
      totalPayments > 0 ? Math.round((paidPayments / totalPayments) * 100) : 0;

    res.status(200).json({
      total_payment_value: Number(paymentData.total_payment_value || 0),
      active_users: Number(userData.active_users || 0),
      paid_payments: paidPayments,
      active_percentage: activePercentage,
      paid_percentage: paidPercentage,
    });
  } catch (error) {
    console.error("Get admin reports error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// =====================================================
// GET REMINDER TEMPLATES
// =====================================================

const getReminderTemplates = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        message,
        status,
        created_at,
        updated_at
      FROM reminder_templates
      ORDER BY created_at DESC
    `);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Get reminder templates error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// =====================================================
// ADD REMINDER TEMPLATE
// =====================================================

const addReminderTemplate = async (req, res) => {
  try {
    const { name, message, status } = req.body;

    if (!name || !message) {
      return res.status(400).json({
        message: "Template name and message are required",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO reminder_templates
      (name, message, status)
      VALUES ($1, $2, $3)
      RETURNING
        id,
        name,
        message,
        status,
        created_at,
        updated_at
      `,
      [name, message, status || "Active"],
    );

    res.status(201).json({
      message: "Reminder template created successfully",
      template: result.rows[0],
    });
  } catch (error) {
    console.error("Add reminder template error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// =====================================================
// UPDATE REMINDER TEMPLATE
// =====================================================

const updateReminderTemplate = async (req, res) => {
  try {
    const { id, name, message, status } = req.body;

    if (!id || !name || !message) {
      return res.status(400).json({
        message: "Template id, name and message are required",
      });
    }

    const result = await pool.query(
      `
      UPDATE reminder_templates
      SET
        name = $1,
        message = $2,
        status = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING
        id,
        name,
        message,
        status,
        created_at,
        updated_at
      `,
      [name, message, status || "Active", id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Reminder template not found",
      });
    }

    res.status(200).json({
      message: "Reminder template updated successfully",
      template: result.rows[0],
    });
  } catch (error) {
    console.error("Update reminder template error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// =====================================================
// DELETE REMINDER TEMPLATE
// =====================================================

const deleteReminderTemplate = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        message: "Template id is required",
      });
    }

    const result = await pool.query(
      `
      DELETE FROM reminder_templates
      WHERE id = $1
      RETURNING id
      `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Reminder template not found",
      });
    }

    res.status(200).json({
      message: "Reminder template deleted successfully",
    });
  } catch (error) {
    console.error("Delete reminder template error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  addPayment,
  getUserPayments,
  getPaymentById,
  deletePayment,
  updatePayment,
  markPaymentAsPaid,
  getAdminReminders,
  getAllPaymentsForAdmin,
  getAdminReports,
  getReminderTemplates,
  addReminderTemplate,
  updateReminderTemplate,
  deleteReminderTemplate,
};
