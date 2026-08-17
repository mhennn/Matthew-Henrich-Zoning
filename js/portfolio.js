/* ==========================================================================
   PORTFOLIO.JS — dynamic project cards
   --------------------------------------------------------------------------
   Renders the "Work" grid from two plain files + the projects/ folder.
   No HTML editing needed:

     • links/portfolio-links.txt              → one project URL per line (row order)
     • projects/<NN>_<repo>.png               → thumbnail. NN = row number (01, 02, …),
                                                <repo> = last segment of the URL.
     • projects/description/description.txt   → optional manual descriptions
                                                (one per line, row order).

   Descriptions resolve in this order:
     1. a manual line in description.txt (always wins)
     2. the repo's real description from the GitHub API (for GitHub URLs)
     3. a generic default

   Add a line to the .txt + drop a correctly-named image into projects/
   and the grid updates on next load. The embedded fallback list is used
   only when the .txt can't be fetched (e.g. the page opened via file://).
   ========================================================================== */

(() => {
  "use strict";

  const LINKS_URL = "links/portfolio-links.txt";
  const DESCS_URL = "projects/description/description.txt";
  const GITHUB_API = "https://api.github.com/repos";

  const DEFAULT_DESC =
    "Built and shipped end to end — open the repository for the code, docs, and details.";

  /* Fallback shown only when the files can't be fetched. */
  const FALLBACK_LINES = [
    "https://github.com/mhennn/SQL-Inventory-System",
    "https://github.com/mhennn/Feed-Pipeline",
    "https://github.com/mhennn/Contract-Generator-Streamlit",
    "https://github.com/mhennn/PICTLEGO",
  ];

  const FALLBACK_DESCS = [
    "SQL-powered inventory tracker — manage stock, products, and movement with clean, queryable data.",
    "Automated data feed pipeline — collects, cleans, and delivers data end to end.",
    "Streamlit app that turns simple inputs into ready-to-use contracts in seconds.",
    "Turns any picture into a LEGO-style mosaic, brick by brick.",
  ];

  /* Words that should stay uppercase in generated titles. */
  const ACRONYMS = new Set([
    "SQL", "API", "UI", "UX", "BI", "RPA", "HTML", "CSS", "JS",
    "AI", "PDF", "CRM", "ERP", "DB", "ETL", "AWS",
  ]);

  const pad2 = (n) => String(n).padStart(2, "0");

  const escapeHtml = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));

  /* Last segment of the URL = repo name (strips trailing slash). */
  const repoFromUrl = (url) => {
    const clean = String(url).trim().replace(/\/+$/, "");
    const seg = clean.split("/").pop() || "";
    try {
      return decodeURIComponent(seg);
    } catch {
      return seg;
    }
  };

  const prettifyTitle = (repo) => {
    const cleaned = repo.replace(/-Streamlit$/i, "").replace(/[-_]+/g, " ");
    return cleaned
      .split(" ")
      .filter(Boolean)
      .map((w) =>
        ACRONYMS.has(w.toUpperCase())
          ? w.toUpperCase()
          : w.charAt(0).toUpperCase() + w.slice(1)
      )
      .join(" ");
  };

  const hostLabel = (url) => {
    try {
      const host = new URL(url).hostname.replace(/^www\./, "");
      return host.split(".")[0].charAt(0).toUpperCase() + host.split(".")[0].slice(1);
    } catch {
      return "Project";
    }
  };

  /* GitHub owner/repo from a URL (null when not a GitHub URL). */
  const githubRepo = (url) => {
    try {
      const u = new URL(url);
      if (u.hostname.replace(/^www\./, "").toLowerCase() !== "github.com") return null;
      const segs = u.pathname.replace(/\/+$/, "").split("/").filter(Boolean);
      if (segs.length < 2) return null;
      return { owner: segs[segs.length - 2], repo: segs[segs.length - 1] };
    } catch {
      return null;
    }
  };

  /* Fetch the GitHub description for each URL ("" when unavailable). */
  const fetchGitHubDescriptions = (urls) => {
    const jobs = urls.map((url) => {
      const gh = githubRepo(url);
      if (!gh) return Promise.resolve("");
      return fetch(
        `${GITHUB_API}/${encodeURIComponent(gh.owner)}/${encodeURIComponent(gh.repo)}`
      )
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((data) =>
          typeof data.description === "string" ? data.description.trim() : ""
        )
        .catch(() => "");
    });
    return Promise.all(jobs);
  };

  /* Build one .portfolio-card element for a URL at a 0-based index. */
  const buildCard = (url, index, opts = {}) => {
    const repo = repoFromUrl(url);
    const num = pad2(index + 1);
    const imgSrc = `projects/${num}_${repo}.png`;
    const title = prettifyTitle(repo);
    const desc = opts.desc || DEFAULT_DESC;

    const card = document.createElement("article");
    card.className = "portfolio-card reveal";
    card.innerHTML = `
      <a class="portfolio-card__media" href="${escapeHtml(url)}" target="_blank" rel="noopener">
        <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(title)}" loading="lazy" />
        <p class="portfolio-card__caption">${escapeHtml(desc)}</p>
        <span class="portfolio-card__index">${num}</span>
        <span class="portfolio-card__arrow" aria-hidden="true">&#8599;</span>
      </a>
      <div class="portfolio-card__body">
        <div class="portfolio-card__tags">
          <span class="tag tag--green">Project</span>
          <span class="tag">${escapeHtml(hostLabel(url))}</span>
        </div>
        <h3 class="portfolio-card__title">${escapeHtml(title)}</h3>
        <p class="portfolio-card__desc">${escapeHtml(desc)}</p>
        <a class="portfolio-card__link" href="${escapeHtml(url)}" target="_blank" rel="noopener">View project <span aria-hidden="true">&rarr;</span></a>
      </div>
    `;

    const img = card.querySelector("img");
    img.addEventListener("error", () => {
      img.classList.add("is-broken");
      if (opts.showMissingNote) {
        const note = document.createElement("p");
        note.className = "admin-missing";
        note.textContent = `No image yet — save it as projects/${num}_${repo}.png`;
        img.insertAdjacentElement("afterend", note);
      }
    });

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

  /* Render the grid from an array of lines (URLs). Returns the count. */
  const renderGrid = (container, lines, opts = {}) => {
    container.innerHTML = "";
    const urls = lines.map((l) => String(l).trim()).filter(Boolean);
    const descs = opts.descriptions || [];
    urls.forEach((url, i) =>
      container.appendChild(buildCard(url, i, { ...opts, desc: descs[i] }))
    );
    observeReveals(container);
    return urls.length;
  };

  /* Auto-render on index.html (element #portfolio-grid). */
  const grid = document.getElementById("portfolio-grid");
  if (grid) {
    const bust = `?v=${Date.now()}`;
    Promise.all([
      fetch(`${LINKS_URL}${bust}`, { cache: "no-store" }).then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      }),
      fetch(`${DESCS_URL}${bust}`, { cache: "no-store" })
        .then((res) => (res.ok ? res.text() : ""))
        .catch(() => ""),
    ])
      .then(([linksText, descsText]) => {
        const urls = linksText
          .split(/\r?\n/)
          .map((l) => String(l).trim())
          .filter(Boolean);
        const manual = descsText
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean);
        // Auto-fetch GitHub descriptions for projects without a manual line.
        return fetchGitHubDescriptions(urls).then((auto) => {
          const descriptions = urls.map((_, i) => manual[i] || auto[i]);
          renderGrid(grid, urls, { descriptions });
        });
      })
      .catch((err) => {
        console.warn(
          "portfolio.js: couldn't load links/portfolio-links.txt (works over http/https) — using embedded fallback list.",
          err
        );
        renderGrid(grid, FALLBACK_LINES, { descriptions: FALLBACK_DESCS });
      });
  }

  /* Exposed for the admin page. */
  window.Portfolio = {
    buildCard, renderGrid, prettifyTitle, repoFromUrl, githubRepo, pad2,
    FALLBACK_LINES, FALLBACK_DESCS,
  };
})();
