console.log("AUTH.JS LOADED");

// =====================================================
// USER REGISTRATION
// =====================================================

const registerForm = document.getElementById("registerForm");

if (registerForm) {
  registerForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    console.log("REGISTER FORM SUBMITTED");

    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirmPassword");

    if (!nameInput || !emailInput || !passwordInput || !confirmPasswordInput) {
      console.error("Registration fields are missing.");
      return;
    }

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    try {
      console.log("Sending registration request...");

      const response = await fetch(
        "https://payalert-azure.vercel.app/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name,
            email: email,
            password: password,
          }),
        },
      );

      const data = await response.json();

      console.log("REGISTER RESPONSE:", data);

      if (response.ok) {
        alert("Account created successfully!");

        registerForm.reset();

        window.location.href = "login.html";
      } else {
        alert(data.message || "Registration failed.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert("Unable to connect to the server.");
    }
  });
}

// =====================================================
// USER LOGIN
// =====================================================

const userLoginForm = document.getElementById("userLoginForm");

if (userLoginForm) {
  userLoginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    console.log("LOGIN FORM SUBMITTED");

    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("loginPassword");

    if (!emailInput || !passwordInput) {
      console.error("Login fields are missing.");
      return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      alert("Please enter email and password.");
      return;
    }

    try {
      console.log("Sending login request...");

      const response = await fetch(
        "https://payalert-azure.vercel.app/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            password: password,
          }),
        },
      );

      const data = await response.json();

      console.log("LOGIN RESPONSE:", data);

      if (response.ok) {
        alert("Login successful!");

        localStorage.setItem("payalert_user", JSON.stringify(data.user));

        window.location.href = "dashboard.html";
      } else {
        alert(data.message || "Login failed.");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Unable to connect to the server.");
    }
  });
}
// ------------------------------------------------//
//ADMIN LOGIN
//------------------------------------------------//
const adminLoginForm = document.getElementById("adminLoginForm");

if (adminLoginForm) {
  adminLoginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const emailInput = document.getElementById("adminEmail");
    const passwordInput = document.getElementById("adminPassword");

    if (!emailInput || !passwordInput) {
      alert("Admin login fields are missing.");
      return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      alert("Please enter email and password.");
      return;
    }

    try {
      const response = await fetch(
        "https://payalert-azure.vercel.app/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        },
      );

      const data = await response.json();

      console.log("ADMIN LOGIN RESPONSE:", data);
      console.log("USER DATA:", data.user);
      console.log("ADMIN ROLE:", data.user?.role);

      if (!response.ok) {
        alert(data.message || "Invalid email or password.");
        return;
      }

      if (!data.user || data.user.role !== "admin") {
        alert("This account does not have admin access.");
        return;
      }

      localStorage.setItem("payalert_admin", JSON.stringify(data.user));

      alert("Admin login successful!");
      window.location.href = "/ADMIN/dashboard.html";
    } catch (error) {
      console.error("Admin login error:", error);
      alert("Unable to connect to the server.");
    }
  });
}
