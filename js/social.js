/* ==========================================================================
   SOCIAL.JS — dynamic link cards
   --------------------------------------------------------------------------
   Renders the "Links" grid from a single plain file. No HTML editing needed:

     • links/social-links.txt   → one URL or email per line

   Each line becomes a .link-card. Known platforms (GitHub, LinkedIn, X,
   Facebook, …) get their brand icon, name and handle; emails get a mail
   icon and become mailto: links; anything unknown falls back to a generic
   link icon with the hostname as the name.

   Add a line to the .txt and the grid updates on next load. The embedded
   fallback list is used only when the .txt can't be fetched (e.g. the page
   opened via file://).
   ========================================================================== */

(() => {
  "use strict";

  const LINKS_URL = "links/social-links.txt";

  /* Fallback shown only when the file can't be fetched. */
  const FALLBACK_LINES = [
    "https://github.com/mhennn",
    "https://www.linkedin.com/in/matthew-henrich-cortez-6711392a1/",
    "https://x.com/hnrch_mhc",
    "https://www.facebook.com/mhc.mun",
    "matthewhenrich04@gmail.com",
  ];

  /* Brand SVG paths (24×24, fill="currentColor") — same style as the cards
     they replace. "email" and "link" are generic Material icons. */
  const ICON_PATHS = {
    github:
      "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12",
    linkedin:
      "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
    x: "M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z",
    facebook:
      "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
    email:
      "M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z",
    link: "M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z",
  };

  /* Known platforms keyed by hostname. Unknown hosts fall back to a generic
     link icon with a name derived from the hostname. */
  const PLATFORMS = {
    "github.com": { name: "GitHub", icon: "github" },
    "linkedin.com": { name: "LinkedIn", icon: "linkedin" },
    "x.com": { name: "X (Twitter)", icon: "x" },
    "twitter.com": { name: "X (Twitter)", icon: "x" },
    "facebook.com": { name: "Facebook", icon: "facebook" },
  };

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const escapeHtml = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));

  const hostnameOf = (url) => {
    try {
      return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    } catch {
      return "";
    }
  };

  const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

  /* Turn one line of social-links.txt into { href, name, handle, icon, isEmail }. */
  const classify = (line) => {
    const raw = String(line).trim();
    if (!raw) return null;

    // Plain email address → mailto: card
    if (EMAIL_RE.test(raw)) {
      return {
        href: `mailto:${raw}`,
        name: "Email",
        handle: raw,
        icon: "email",
        isEmail: true,
      };
    }

    let url;
    try {
      url = new URL(raw);
    } catch {
      return null; // not a URL and not an email — skip
    }
    if (!/^https?:$/.test(url.protocol)) return null;

    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    const platform = PLATFORMS[host];
    const path = url.pathname.replace(/\/+$/, "");

    let name = platform ? platform.name : capitalize(host.split(".")[0]);
    let handle = url.hostname;
    let icon = platform ? platform.icon : "link";

    if (host === "linkedin.com") {
      const match = path.match(/^\/in\/([^/]+)/);
      if (match) handle = `/in/${decodeURIComponent(match[1])}`;
    } else {
      const seg = path.split("/").filter(Boolean).pop();
      if (seg) handle = `@${decodeURIComponent(seg)}`;
    }

    return { href: raw, name, handle, icon, isEmail: false };
  };

  /* Build one .link-card element for a line of social-links.txt. */
  const buildCard = (line) => {
    const info = classify(line);
    if (!info) return null;

    const card = document.createElement("a");
    card.className = "link-card reveal";
    card.href = info.href;
    if (!info.isEmail) {
      card.target = "_blank";
      card.rel = "noopener";
    }
    card.innerHTML = `
      <span class="link-card__icon" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="${ICON_PATHS[info.icon]}"/></svg>
      </span>
      <span class="link-card__body">
        <span class="link-card__name">${escapeHtml(info.name)}</span>
        <span class="link-card__handle">${escapeHtml(info.handle)}</span>
      </span>
      <span class="link-card__arrow" aria-hidden="true">&#8599;</span>
    `;
    return card;
  };

  /* Reveal-on-scroll for dynamically injected cards (same effect as script.js). */
  let revealObserver = null;
  const observeReveals = (container) => {
    const els = container.querySelectorAll(".reveal");
    if (!els.length) return;
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const siblings = Array.from(el.parentElement?.children || []).filter((c) =>
              c.classList.contains("reveal")
            );
            const index = siblings.indexOf(el);
            el.style.transitionDelay = `${(index % 3) * 90}ms`;
            el.classList.add("is-visible");
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
    }
    els.forEach((el) => revealObserver.observe(el));
  };

  /* Render the grid from an array of lines. */
  const renderGrid = (container, lines) => {
    container.innerHTML = "";
    lines.forEach((line) => {
      const card = buildCard(line);
      if (card) container.appendChild(card);
    });
    observeReveals(container);
  };

  /* Auto-render on index.html (element #links-grid). */
  const grid = document.getElementById("links-grid");
  if (grid) {
    fetch(`${LINKS_URL}?v=${Date.now()}`, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((text) => renderGrid(grid, text.split(/\r?\n/)))
      .catch((err) => {
        console.warn(
          "social.js: couldn't load links/social-links.txt (works over http/https) — using embedded fallback list.",
          err
        );
        renderGrid(grid, FALLBACK_LINES);
      });
  }

  /* Exposed for the admin page. */
  window.Social = { buildCard, classify, renderGrid, FALLBACK_LINES };
})();
