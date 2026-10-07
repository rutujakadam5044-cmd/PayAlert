document.addEventListener("DOMContentLoaded", () => {
  qsa("[data-scroll]").forEach((a) =>
    a.addEventListener("click", (e) => {
      const el = qs(a.dataset.scroll);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth" });
      }
    }),
  );
  const contact = qs("#contactForm");
  if (contact)
    contact.addEventListener("submit", (e) => {
      e.preventDefault();
      showToast("Message sent successfully");
      contact.reset();
    });
});
// =====================================================
// CONTACT FORM
// =====================================================

const contactForm = document.querySelector("#contactForm");

if (contactForm) {
  contactForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = document.querySelector("#contactName").value.trim();

    const email = document.querySelector("#contactEmail").value.trim();

    const subject = document.querySelector("#contactSubject").value.trim();

    const message = document.querySelector("#contactMessage").value.trim();

    if (!name || !email || !message) {
      alert("Please fill all required fields.");
      return;
    }

    try {
      const response = await fetch(
        "https://payalert-3ivcbj4wf-rutuja-1e49.vercel.app/api/contact",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            name: name,
            email: email,
            subject: subject,
            message: message,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send message");
      }

      alert("Message sent successfully!");

      contactForm.reset();
    } catch (error) {
      console.error("Contact form error:", error);

      alert("Unable to send message. Please try again.");
    }
  });
}
