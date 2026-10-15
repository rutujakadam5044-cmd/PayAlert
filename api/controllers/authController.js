const pool = require("../../lib/db");
const bcrypt = require("bcryptjs");

// =====================================================
// REGISTER USER
// =====================================================
const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [normalizedEmail],
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // New registrations are normal users by default.
    // Never accept the role from the public registration form.
    const result = await pool.query(
      `INSERT INTO users (name, email, password, phone)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, phone, role, created_at`,
      [name.trim(), normalizedEmail, hashedPassword, phone || null],
    );

    return res.status(201).json({
      message: "User registered successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Register error:", error);

    return res.status(500).json({
      message: "Server error during registration",
    });
  }
};

// =====================================================
// LOGIN USER / ADMIN
// =====================================================
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const result = await pool.query(
      `SELECT id, name, email, password, phone, role
       FROM users
       WHERE email = $1`,
      [normalizedEmail],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const user = result.rows[0];

    if (!user.password) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Return the database role to the frontend.
    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role || "user",
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Server error during login",
    });
  }
};

// =====================================================
// GET USER PROFILE
// =====================================================
const getUserProfile = async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    const result = await pool.query(
      `SELECT id, name, email, phone, role
       FROM users
       WHERE id = $1`,
      [user_id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Get profile error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// =====================================================
// UPDATE USER PROFILE
// =====================================================
const updateUserProfile = async (req, res) => {
  try {
    const { user_id, name, phone, password } = req.body;

    if (!user_id || !name || !name.trim()) {
      return res.status(400).json({
        message: "User ID and name are required",
      });
    }

    let result;

    if (password && password.trim() !== "") {
      if (password.length < 6) {
        return res.status(400).json({
          message: "Password must be at least 6 characters",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      result = await pool.query(
        `UPDATE users
         SET name = $1,
             phone = $2,
             password = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4
         RETURNING id, name, email, phone, role`,
        [name.trim(), phone || null, hashedPassword, user_id],
      );
    } else {
      result = await pool.query(
        `UPDATE users
         SET name = $1,
             phone = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING id, name, email, phone, role`,
        [name.trim(), phone || null, user_id],
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// =====================================================
// GET NOTIFICATION SETTINGS
// =====================================================
const getNotificationSettings = async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    const result = await pool.query(
      `SELECT email_notifications,
              payment_reminders,
              weekly_summary,
              reminder_time
       FROM notification_settings
       WHERE user_id = $1`,
      [user_id],
    );

    if (result.rows.length === 0) {
      return res.status(200).json({
        email_notifications: true,
        payment_reminders: true,
        weekly_summary: false,
        reminder_time: "09:00",
      });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Get notification settings error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// =====================================================
// UPDATE NOTIFICATION SETTINGS
// =====================================================
const updateNotificationSettings = async (req, res) => {
  try {
    const {
      user_id,
      email_notifications,
      payment_reminders,
      weekly_summary,
      reminder_time,
    } = req.body;

    if (!user_id) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    const result = await pool.query(
      `INSERT INTO notification_settings
         (user_id, email_notifications, payment_reminders,
          weekly_summary, reminder_time)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id)
       DO UPDATE SET
         email_notifications = EXCLUDED.email_notifications,
         payment_reminders = EXCLUDED.payment_reminders,
         weekly_summary = EXCLUDED.weekly_summary,
         reminder_time = EXCLUDED.reminder_time,
         updated_at = CURRENT_TIMESTAMP
       RETURNING user_id, email_notifications, payment_reminders,
                 weekly_summary, reminder_time`,
      [
        user_id,
        email_notifications ?? true,
        payment_reminders ?? true,
        weekly_summary ?? false,
        reminder_time || "09:00",
      ],
    );

    return res.status(200).json({
      message: "Notification settings saved successfully",
      settings: result.rows[0],
    });
  } catch (error) {
    console.error("Update notification settings error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// =====================================================
// GET ALL USERS FOR ADMIN
// =====================================================
const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        u.id,
        u.name,
        u.email,
        u.phone,
        u.created_at,
        COUNT(p.id)::INTEGER AS payment_count
      FROM users u
      LEFT JOIN payments p ON u.id = p.user_id
      GROUP BY u.id, u.name, u.email, u.phone, u.created_at
      ORDER BY u.id DESC
    `);

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Get all users error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// =====================================================
// GET SINGLE USER DETAILS FOR ADMIN
// =====================================================
const getUserDetails = async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    const userResult = await pool.query(
      `SELECT id, name, email, phone, created_at
       FROM users
       WHERE id = $1`,
      [id],
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const paymentResult = await pool.query(
      `SELECT id, name, category, amount, due_date, status,
              frequency, reminder_before, description
       FROM payments
       WHERE user_id = $1
       ORDER BY due_date ASC`,
      [id],
    );

    return res.status(200).json({
      user: userResult.rows[0],
      payments: paymentResult.rows,
    });
  } catch (error) {
    console.error("Get user details error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// =====================================================
// GET ALL ADMIN MESSAGES
// =====================================================
const getAllMessages = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, user_id, name, email, subject, message,
             status, reply, created_at
      FROM messages
      ORDER BY created_at DESC
    `);

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Get all messages error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// =====================================================
// GET MESSAGE COUNT
// =====================================================
const getMessageCount = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) AS count
      FROM messages
    `);

    return res.status(200).json({
      count: Number(result.rows[0].count),
    });
  } catch (error) {
    console.error("Get message count error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// =====================================================
// CREATE CONTACT MESSAGE
// =====================================================
const createMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        message: "Name, email and message are required",
      });
    }

    const result = await pool.query(
      `INSERT INTO messages (name, email, subject, message)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, subject, message, status, created_at`,
      [name.trim(), email.trim().toLowerCase(), subject || null, message],
    );

    return res.status(201).json({
      message: "Message sent successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Create message error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// =====================================================
// EXPORT CONTROLLERS
// =====================================================
module.exports = {
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
};
