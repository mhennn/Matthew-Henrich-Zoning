/* ==========================================================================
   CONTACT.JS — contact form submission
   --------------------------------------------------------------------------
   Submits the #contact-form to FormSubmit's AJAX endpoint, so the visitor
   stays on the page and sees an inline success/error message.

   Setup: FormSubmit is free and needs no signup. On the FIRST submission
   it emails a confirmation link to the address in FORM_ENDPOINT — click it
   once and every submission after that lands in the inbox.

   To change the receiving address, update FORM_ENDPOINT below.
   ========================================================================== */

(() => {
  "use strict";

  const FORM_ENDPOINT = "https://formsubmit.co/ajax/matthewhenrich04@gmail.com";

  const form = document.getElementById("contact-form");
  if (!form) return;

  const status = form.querySelector(".contact-form__status");
  const submitBtn = form.querySelector('button[type="submit"]');

  const setStatus = (msg, ok) => {
    status.textContent = msg;
    status.classList.toggle("is-success", ok);
    status.classList.toggle("is-error", !ok);
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Native validation (required / email format)
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // Honeypot filled → silently ignore (bot)
    const honey = form.querySelector('input[name="_honey"]');
    if (honey && honey.value) return;

    setStatus("Sending…", false);
    submitBtn.disabled = true;

    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success === "true") {
        setStatus("Thanks! Your message is on its way — I'll get back to you soon.", true);
        form.reset();
      } else {
        setStatus(
          "Hmm, something went wrong — feel free to email me directly at matthewhenrich04@gmail.com.",
          false
        );
      }
    } catch {
      setStatus(
        "Couldn't reach the server — feel free to email me directly at matthewhenrich04@gmail.com.",
        false
      );
    } finally {
      submitBtn.disabled = false;
    }
  });
})();
