/* ==========================================================================
   PORTFOLIO.JS — dynamic project cards
   --------------------------------------------------------------------------Modes:
   1. WITH TOKEN: Fetches all public repos from GitHub API automatically.
      Manual images from projects/<NN>_<repo>.png are used when available.
   2. WITHOUT TOKEN: Falls back to links/portfolio-links.txt (manual mode).

   Images: projects/<NN>_<repo>.png  (NN = row number, 01, 02, …)
   Descriptions: projects/description/description.txt (manual, one per line)
   ========================================================================== */

(() => {
  "use strict";

  const config = window.GITHUB_CONFIG || {};
  const USERNAME = config.username || "mhennn";
  const TOKEN = config.token || "";

  const DESCS_URL = "projects/description/description.txt";
  const GITHUB_USER_API = `https://api.github.com/users/${USERNAME}/repos`;

  const DEFAULT_DESC =
    "Built and shipped end to end — open the repository for the code, docs, and details.";

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

  const ACRONYMS = new Set([
    "SQL", "API", "UI", "UX", "BI", "RPA", "HTML", "CSS", "JS",
    "AI", "PDF", "CRM", "ERP", "DB", "ETL", "AWS", "OJT",
  ]);

  const LANG_COLORS = {
    JavaScript: "#f1e05a",
    TypeScript: "#3178c6",
    Python: "#3572A5",
    Java: "#b07219",
    "C++": "#f34b7d",
    C: "#555555",
    "C#": "#178600",
    Go: "#00ADD8",
    Rust: "#dea584",
    Ruby: "#701516",
    PHP: "#4F5D95",
    Swift: "#F05138",
    Kotlin: "#A97BFF",
    Dart: "#00B4AB",
    HTML: "#e34c26",
    CSS: "#563d7c",
    Shell: "#89e051",
    "Jupyter Notebook": "#DA5B0B",
    R: "#198CE7",
    Lua: "#000080",
    "Objective-C": "#438eff",
    Scala: "#c22d40",
    Haskell: "#5e5086",
    Elixir: "#6e4a7e",
    Vue: "#41b883",
    Svelte: "#ff3e00",
  };

  const pad2 = (n) => String(n).padStart(2, "0");

  const escapeHtml = (s) =>
    String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
    );

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

  /* ------------------------------------------------------------------ */
  /*  Fetch ALL public repos from GitHub API (paginated)                 */
  /* ------------------------------------------------------------------ */
  function fetchAllRepos() {
    if (!TOKEN) return Promise.resolve(null);

    const headers = { Authorization: `bearer ${TOKEN}` };
    const perPage = 100;
    let page = 1;
    const allRepos = [];

    function fetchPage() {
      return fetch(`${GITHUB_USER_API}?type=public&sort=updated&per_page=${perPage}&page=${page}`, { headers })
        .then((r) => {
          if (!r.ok) throw new Error(`GitHub API ${r.status}`);
          return r.json();
        })
        .then((repos) => {
          allRepos.push(...repos);
          if (repos.length === perPage) {
            page++;
            return fetchPage();
          }
          return allRepos;
        });
    }

    return fetchPage().catch(() => null);
  }

  /* ------------------------------------------------------------------ */
  /*  Build a card from GitHub API repo data                             */
  /* ------------------------------------------------------------------ */
  function buildCardFromRepo(repo, index, manualDesc) {
    const num = pad2(index + 1);
    const imgSrc = `projects/${num}_${repo.name}.png`;
    const title = repo.name.replace(/[-_]+/g, " ")
      .split(" ")
      .map((w) => ACRONYMS.has(w.toUpperCase()) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    const desc = repo.description || manualDesc || DEFAULT_DESC;
    const url = repo.html_url;
    const lang = repo.language || "";
    const stars = repo.stargazers_count || 0;
    const topics = (repo.topics || []).slice(0, 3);

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
          ${lang ? `<span class="tag" style="border-color:${LANG_COLORS[lang] || "var(--border)"};color:${LANG_COLORS[lang] || "var(--text-dim)"}">${escapeHtml(lang)}</span>` : ""}
          ${topics.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("")}
          ${stars > 0 ? `<span class="tag">&#9733; ${stars}</span>` : ""}
        </div>
        <h3 class="portfolio-card__title">${escapeHtml(title)}</h3>
        <p class="portfolio-card__desc">${escapeHtml(desc)}</p>
        <a class="portfolio-card__link" href="${escapeHtml(url)}" target="_blank" rel="noopener">View project <span aria-hidden="true">&rarr;</span></a>
      </div>
    `;

    const img = card.querySelector("img");
    img.addEventListener("error", () => img.classList.add("is-broken"));

    return card;
  }

  /* ------------------------------------------------------------------ */
  /*  Build a card from a URL (legacy/manual mode)                       */
  /* ------------------------------------------------------------------ */
  const repoFromUrl = (url) => {
    const clean = String(url).trim().replace(/\/+$/, "");
    const seg = clean.split("/").pop() || "";
    try { return decodeURIComponent(seg); } catch { return seg; }
  };

  const hostLabel = (url) => {
    try {
      const host = new URL(url).hostname.replace(/^www\./, "");
      return host.split(".")[0].charAt(0).toUpperCase() + host.split(".")[0].slice(1);
    } catch { return "Project"; }
  };

  const githubRepo = (url) => {
    try {
      const u = new URL(url);
      if (u.hostname.replace(/^www\./, "").toLowerCase() !== "github.com") return null;
      const segs = u.pathname.replace(/\/+$/, "").split("/").filter(Boolean);
      if (segs.length < 2) return null;
      return { owner: segs[segs.length - 2], repo: segs[segs.length - 1] };
    } catch { return null; }
  };

  function buildCardFromUrl(url, index, desc) {
    const repo = repoFromUrl(url);
    const num = pad2(index + 1);
    const imgSrc = `projects/${num}_${repo}.png`;
    const title = prettifyTitle(repo);

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
    img.addEventListener("error", () => img.classList.add("is-broken"));

    return card;
  }

  /* ------------------------------------------------------------------ */
  /*  Fetch GitHub descriptions for manual URLs                          */
  /* ------------------------------------------------------------------ */
  const fetchGitHubDescriptions = (urls) => {
    const jobs = urls.map((url) => {
      const gh = githubRepo(url);
      if (!gh) return Promise.resolve("");
      return fetch(`https://api.github.com/repos/${encodeURIComponent(gh.owner)}/${encodeURIComponent(gh.repo)}`)
        .then((r) => r.ok ? r.json() : Promise.reject())
        .then((d) => typeof d.description === "string" ? d.description.trim() : "")
        .catch(() => "");
    });
    return Promise.all(jobs);
  };

  /* ------------------------------------------------------------------ */
  /*  Reveal-on-scroll for dynamically injected cards                    */
  /* ------------------------------------------------------------------ */
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
            el.addEventListener("transitionend", () => { el.style.transitionDelay = ""; }, { once: true });
            revealObserver.unobserve(el);
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
      );
    }
    els.forEach((el) => revealObserver.observe(el));
  };

  /* ------------------------------------------------------------------ */
  /*  Main render logic                                                  */
  /* ------------------------------------------------------------------ */
  const grid = document.getElementById("portfolio-grid");
  if (!grid) return;

  const bust = `?v=${Date.now()}`;

  if (TOKEN) {
    /* === MODE 1: Auto-fetch from GitHub API === */
    Promise.all([
      fetchAllRepos(),
      fetch(`${DESCS_URL}${bust}`, { cache: "no-store" })
        .then((r) => r.ok ? r.text() : "").catch(() => ""),
    ])
      .then(([repos, descsText]) => {
        if (!repos || !repos.length) {
          /* API failed — fall back to manual mode */
          return fallbackManualMode(grid, descsText);
        }

        const manual = descsText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

        /* Filter: skip forks, profile READMEs (name matches username), sort by updated */
        const filtered = repos
          .filter((r) => !r.fork && r.name.toLowerCase() !== USERNAME.toLowerCase())
          .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

        grid.innerHTML = "";
        filtered.forEach((repo, i) => {
          /* Check if there's a manual description for this repo name */
          const manualIdx = manual.findIndex((_, mi) => {
            const num = pad2(mi + 1);
            return document.querySelector
              ? true
              : false; // descriptions are matched by order, not name
          });
          /* Match manual descriptions by order (same as legacy mode) */
          const desc = manual[i] || "";
          grid.appendChild(buildCardFromRepo(repo, i, desc));
        });
        observeReveals(grid);
      })
      .catch(() => fallbackManualMode(grid, ""));
  } else {
    /* === MODE 2: Manual mode (portfolio-links.txt) === */
    fallbackManualMode(grid, "");
  }

  function fallbackManualMode(container, descsText) {
    const LINKS_URL = "links/portfolio-links.txt";
    fetch(`${LINKS_URL}${bust}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((text) => {
        const urls = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        const manual = (descsText || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        return fetchGitHubDescriptions(urls).then((auto) => {
          const descriptions = urls.map((_, i) => manual[i] || auto[i]);
          container.innerHTML = "";
          urls.forEach((url, i) =>
            container.appendChild(buildCardFromUrl(url, i, descriptions[i]))
          );
          observeReveals(container);
        });
      })
      .catch(() => {
        container.innerHTML = "";
        FALLBACK_LINES.forEach((url, i) =>
          container.appendChild(buildCardFromUrl(url, i, FALLBACK_DESCS[i]))
        );
        observeReveals(container);
      });
  }

  /* Exposed for admin page */
  window.Portfolio = { buildCardFromUrl, buildCardFromRepo, prettifyTitle, repoFromUrl, pad2 };
})();
