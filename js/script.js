/* ==========================================================================
   SCRIPT.JS — Portfolio
   --------------------------------------------------------------------------
   Vanilla JS only (no frameworks, no libraries). Features:
   1.  Auto year in the footer
   2.  Navbar "scrolled" state
   3.  Mobile menu toggle (hamburger -> full-screen glass panel)
   4.  Scroll-entrance reveals via IntersectionObserver (with stagger)
   5.  Active nav-link highlighting via IntersectionObserver
   6.  Skill bars animate to their data-level width on scroll
   7.  Portfolio image error fallback (reveals the CSS gradient placeholder)
   ========================================================================== */

(() => {
  "use strict";

  /* ------------------------------------------------------------------
     1. Footer year
     ------------------------------------------------------------------ */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ------------------------------------------------------------------
     2. Navbar — add a "scrolled" class once the page is scrolled down
     ------------------------------------------------------------------ */
  const nav = document.getElementById("site-nav");
  if (nav) {
    const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // run once on load
  }

  /* ------------------------------------------------------------------
     3. Mobile menu — hamburger opens/closes the nav links panel
     ------------------------------------------------------------------ */
  const navToggle = document.getElementById("nav-toggle");
  const navLinks = document.getElementById("nav-links");

  const closeMenu = () => {
    document.body.classList.remove("nav-open");
    navToggle?.setAttribute("aria-expanded", "false");
    navToggle?.classList.remove("is-open");
  };

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const isOpen = document.body.classList.toggle("nav-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
      navToggle.classList.toggle("is-open", isOpen);
    });

    // Close when a link is clicked (native smooth-scroll then kicks in)
    navLinks.querySelectorAll("a").forEach((link) =>
      link.addEventListener("click", closeMenu)
    );

    // Close on Escape, or when resizing back to desktop
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 860) closeMenu();
    });
  }

  /* ------------------------------------------------------------------
     4. Scroll-entrance reveals
     Every element with the .reveal class fades/slides in when it enters
     the viewport. Siblings get a small stagger, and the delay is removed
     after the animation so hover transitions stay snappy.
     ------------------------------------------------------------------ */
  const revealEls = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window && revealEls.length) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const el = entry.target;

          // Stagger: 0 / 90 / 180ms based on position among revealed siblings
          const siblings = Array.from(el.parentElement?.children || []).filter((c) =>
            c.classList.contains("reveal")
          );
          const index = siblings.indexOf(el);
          el.style.transitionDelay = `${(index % 3) * 90}ms`;

          el.classList.add("is-visible");

          // Clear the delay after the reveal finishes so hovers are instant
          el.addEventListener(
            "transitionend",
            () => {
              el.style.transitionDelay = "";
            },
            { once: true }
          );

          revealObserver.unobserve(el);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );

    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    // Fallback: no observer support -> show everything
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ------------------------------------------------------------------
     5. Active nav-link highlighting
     The nav link matching the section currently crossing the middle
     band of the viewport gets .is-active.
     ------------------------------------------------------------------ */
  const sections = document.querySelectorAll("section[id]");
  const navLinkEls = document.querySelectorAll(".nav__link");

  if ("IntersectionObserver" in window && sections.length) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinkEls.forEach((link) => {
            const isActive = link.getAttribute("href") === `#${entry.target.id}`;
            link.classList.toggle("is-active", isActive);
          });
        });
      },
      // Narrow horizontal band near the top-middle of the viewport
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );

    sections.forEach((section) => sectionObserver.observe(section));
  }

  /* ------------------------------------------------------------------
     6. Skill bars — animate to the width stored in data-level
     ------------------------------------------------------------------ */
  const skills = document.querySelectorAll(".skill");

  if ("IntersectionObserver" in window && skills.length) {
    const skillObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const fill = entry.target.querySelector(".skill__fill");
          if (fill && fill.dataset.level) {
            fill.style.width = `${fill.dataset.level}%`;
          }
          skillObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.4 }
    );

    skills.forEach((skill) => skillObserver.observe(skill));
  }

  /* ------------------------------------------------------------------
     7. Portfolio images — if a placeholder/broken image fails to load,
        hide it so the card's gradient placeholder shows instead
     ------------------------------------------------------------------ */
  document.querySelectorAll(".portfolio-card__media img").forEach((img) => {
    img.addEventListener("error", () => img.classList.add("is-broken"));
    // If the image is cached and already complete, the error already fired
    if (img.complete && img.naturalWidth === 0) img.classList.add("is-broken");
  });
})();
