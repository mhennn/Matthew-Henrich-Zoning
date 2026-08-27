/* ==========================================================================
   GITHUB-CHART.JS — Custom dark-themed contribution grid
   --------------------------------------------------------------------------Fetches real contribution data from GitHub GraphQL API (if token is set)
   or falls back to ghchart SVG for the current year.
   ========================================================================== */
(() => {
  "use strict";

  const ghGrid = document.getElementById("github-grid");
  const ghTotal = document.getElementById("gh-total");
  const ghMonths = document.getElementById("github-months");
  const ghYears = document.getElementById("github-years");

  if (!ghGrid) return;

  const DAYS = 7;
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const CELL_PX = 14;

  const config = window.GITHUB_CONFIG || {};
  const USERNAME = config.username || "mhennn";
  const TOKEN = config.token || "";

  const cache = {};
  let activeYear = new Date().getFullYear();

  /* ------------------------------------------------------------------ */
  /*  Grid start date                                                    */
  /* ------------------------------------------------------------------ */
  function getGridStartDate(gridLength) {
    const now = new Date();
    const dow = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - dow - (gridLength - 1) * 7);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  function cellDate(gridStart, weekIdx, dayIdx) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + weekIdx * 7 + dayIdx);
    return d;
  }

  /* ------------------------------------------------------------------ */
  /*  Load year data                                                     */
  /* ------------------------------------------------------------------ */
  function loadYear(year) {
    if (cache[year]) {
      renderYear(year, cache[year]);
      return;
    }

    if (TOKEN) {
      /* Real data from GitHub GraphQL API */
      const now = new Date();
      const isCurrentYear = year === now.getFullYear();
      let from, to;
      if (isCurrentYear) {
        /* Rolling 52-week window: today minus 1 year, to today */
        const fromDate = new Date(now);
        fromDate.setDate(now.getDate() - 365);
        from = fromDate.toISOString();
        to = now.toISOString();
      } else {
        /* Calendar year for past years */
        from = `${year}-01-01T00:00:00Z`;
        to = `${year}-12-31T23:59:59Z`;
      }
      fetchGraphQL(from, to).then((data) => {
        cache[year] = data;
        renderYear(year, data);
      }).catch(() => {
        /* Fallback on error */
        fallbackLoad(year);
      });
    } else {
      fallbackLoad(year);
    }
  }

  function fallbackLoad(year) {
    const now = new Date();
    if (year === now.getFullYear()) {
      fetchGhchart().then((data) => { cache[year] = data; renderYear(year, data); });
    } else {
      const data = generateHistoricalData(year);
      cache[year] = data;
      renderYear(year, data);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  GitHub GraphQL API — real contribution data                         */
  /* ------------------------------------------------------------------ */
  function fetchGraphQL(from, to) {
    const query = `{
      user(login: "${USERNAME}") {
        contributionsCollection(from: "${from}", to: "${to}") {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
                color
              }
            }
          }
        }
      }
    }`;

    return fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `bearer ${TOKEN}`,
      },
      body: JSON.stringify({ query }),
    })
      .then((r) => {
        if (!r.ok) throw new Error(`GitHub API ${r.status}`);
        return r.json();
      })
      .then((json) => {
        const cal = json.data?.user?.contributionsCollection?.contributionCalendar;
        if (!cal) throw new Error("No data");

        /* Convert GitHub's flat week/day structure into our grid format.
           GitHub weeks start on Sunday. Each week has up to 7 days.
           We also store real dates for accurate tooltips and month labels. */
        const grid = [];
        const dates = []; // parallel array: dates[week][day] = "YYYY-MM-DD"
        const counts = []; // parallel array: counts[week][day] = actual count
        cal.weeks.forEach((week) => {
          const row = [];
          const dateRow = [];
          const countRow = [];
          /* Pad beginning if the first week doesn't start on Sunday */
          if (grid.length === 0 && week.contributionDays.length < 7) {
            for (let i = 0; i < 7 - week.contributionDays.length; i++) {
              row.push(0);
              dateRow.push("");
              countRow.push(0);
            }
          }
          week.contributionDays.forEach((day) => {
            const count = day.contributionCount;
            let level;
            if (count === 0) level = 0;
            else if (count <= 2) level = 1;
            else if (count <= 5) level = 2;
            else if (count <= 9) level = 3;
            else level = 4;
            row.push(level);
            dateRow.push(day.date);
            countRow.push(count);
          });
          /* Pad end if the last week is incomplete */
          while (row.length < 7) { row.push(0); dateRow.push(""); countRow.push(0); }
          grid.push(row);
          dates.push(dateRow);
          counts.push(countRow);
        });

        return { grid, dates, counts, total: cal.totalContributions };
      });
  }

  /* ------------------------------------------------------------------ */
  /*  Ghchart SVG fallback (current year only)                           */
  /* ------------------------------------------------------------------ */
  function fetchGhchart() {
    return fetch(`https://ghchart.rshah.org/${USERNAME}`)
      .then((r) => r.ok ? r.blob() : Promise.reject())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            const c = document.createElement("canvas");
            c.width = img.naturalWidth;
            c.height = img.naturalHeight;
            const ctx = c.getContext("2d");
            ctx.drawImage(img, 0, 0);
            const px = ctx.getImageData(0, 0, c.width, c.height).data;
            URL.revokeObjectURL(url);
            resolve(sampleGrid(px, c.width, c.height));
          };
          img.onerror = () => { URL.revokeObjectURL(url); reject(); };
          img.src = url;
        });
      })
      .catch(() => generateFallbackGrid());
  }

  function sampleGrid(data, w, h) {
    const grid = [];
    const cw = 13, ch = 13, ox = 40, oy = 20;
    for (let col = 0; col < 52; col++) {
      const week = [];
      for (let row = 0; row < 7; row++) {
        const x = Math.min(ox + col * cw + 5, w - 1);
        const y = Math.min(oy + row * ch + 5, h - 1);
        const i = (y * w + x) * 4;
        week.push(classifyColor(data[i], data[i + 1], data[i + 2]));
      }
      grid.push(week);
    }
    return { grid, total: sumGrid(grid) };
  }

  function classifyColor(r, g, b) {
    const br = (r + g + b) / 3;
    if (br > 220) return 0;
    if (g > 150 && g > r * 1.5) return 4;
    if (g > 120 && g > r * 1.3) return 3;
    if (g > 80 && g > r) return 2;
    if (g > 40) return 1;
    return 0;
  }

  function sumGrid(grid) {
    let t = 0;
    grid.forEach((w) => w.forEach((l) => { t += l; }));
    return t;
  }

  /* ------------------------------------------------------------------ */
  /*  Seeded random + simulated data for past years (no token)           */
  /* ------------------------------------------------------------------ */
  function seededRandom(seed) {
    let s = seed;
    return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  }

  function generateHistoricalData(year) {
    const rand = seededRandom(year * 31 + 7);
    const grid = [];
    const scale = Math.max(0.4, 1 - (new Date().getFullYear() - year) * 0.15);
    for (let col = 0; col < 52; col++) {
      const week = [];
      for (let row = 0; row < 7; row++) {
        const isWE = row >= 5;
        const r = rand();
        let lv = isWE
          ? (r < 0.72 ? 0 : r < 0.88 ? 1 : r < 0.96 ? 2 : 3)
          : (r < 0.38 ? 0 : r < 0.62 ? 1 : r < 0.82 ? 2 : r < 0.94 ? 3 : 4);
        if (lv > 0 && rand() > scale) lv = 0;
        week.push(lv);
      }
      grid.push(week);
    }
    return { grid, total: sumGrid(grid) };
  }

  function generateFallbackGrid() {
    const grid = [];
    for (let col = 0; col < 52; col++) {
      const week = [];
      for (let row = 0; row < 7; row++) {
        const isWE = row >= 5;
        const r = Math.random();
        week.push(isWE
          ? (r < 0.7 ? 0 : r < 0.88 ? 1 : r < 0.96 ? 2 : 3)
          : (r < 0.35 ? 0 : r < 0.6 ? 1 : r < 0.8 ? 2 : r < 0.93 ? 3 : 4));
      }
      grid.push(week);
    }
    return { grid, total: sumGrid(grid) };
  }

  /* ------------------------------------------------------------------ */
  /*  Render year                                                        */
  /* ------------------------------------------------------------------ */
  function renderYear(year, data) {
    ghGrid.innerHTML = "";

    const now = new Date();
    const currentYear = now.getFullYear();
    const today = new Date(currentYear, now.getMonth(), now.getDate());
    const isCurrentYear = year === currentYear;
    const hasDates = data.dates && data.dates.length > 0;

    /* Filter cells:
       - Current year with real dates: keep all cells <= today
       - Current year without dates: use gridStart calculation
       - Past years: keep only cells within that calendar year */
    const gridStart = getGridStartDate(data.grid.length);
    const grid = data.grid.map((week, wi) =>
      week.map((level, di) => {
        if (hasDates && data.dates[wi] && data.dates[wi][di]) {
          const d = new Date(data.dates[wi][di] + "T00:00:00");
          if (isCurrentYear) return d > today ? 0 : level;
          return d.getFullYear() === year ? level : 0;
        }
        /* Fallback for ghchart/fake data: use gridStart */
        const d = cellDate(gridStart, wi, di);
        if (isCurrentYear) return d > today ? 0 : level;
        return d.getFullYear() === year ? level : 0;
      })
    );

    /* Use the real total from the API (sumGrid only adds levels 0-4, not actual counts) */
    const hasCounts = data.counts && data.counts.length > 0;
    const total = data.total || sumGrid(grid);

    renderMonthLabels(year, grid, data.dates, gridStart);

    /* Build DOM */
    const frag = document.createDocumentFragment();
    grid.forEach((week, wi) => {
      const weekEl = document.createElement("div");
      weekEl.className = "github-chart__week";
      week.forEach((level, di) => {
        const dayEl = document.createElement("span");
        dayEl.className = "github-chart__day";
        dayEl.setAttribute("data-level", level);
        /* Use real date from API if available */
        let tipDate;
        if (hasDates && data.dates[wi] && data.dates[wi][di]) {
          const d = new Date(data.dates[wi][di] + "T00:00:00");
          tipDate = `${MONTHS[d.getMonth()]} ${d.getDate()}`;
        } else {
          const d = cellDate(gridStart, wi, di);
          tipDate = `${MONTHS[d.getMonth()]} ${d.getDate()}`;
        }
        /* Use real count from API if available, otherwise fall back to level */
        const realCount = hasCounts && data.counts[wi] ? data.counts[wi][di] : level;
        const label = realCount === 0 ? "No contributions" : `${realCount} contribution${realCount !== 1 ? "s" : ""}`;
        dayEl.setAttribute("data-tip", `${tipDate} — ${label}`);
        weekEl.appendChild(dayEl);
      });
      frag.appendChild(weekEl);
    });
    ghGrid.appendChild(frag);

    animateCount(ghTotal, total);

    const labelEl = ghTotal?.nextElementSibling;
    if (labelEl) {
      labelEl.textContent = year === currentYear
        ? "contributions in the last year"
        : `contributions in ${year}`;
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Render month labels                                                */
  /* ------------------------------------------------------------------ */
  function renderMonthLabels(year, grid, dates, gridStart) {
    if (!ghMonths) return;
    ghMonths.innerHTML = "";

    const totalWeeks = grid.length;
    const isCurrentYear = year === new Date().getFullYear();
    const hasDates = dates && dates.length > 0;
    const monthFirstWeek = {};

    for (let w = 0; w < totalWeeks; w++) {
      /* Use real date from API if available, otherwise calculate */
      let d;
      if (hasDates && dates[w] && dates[w][0]) {
        d = new Date(dates[w][0] + "T00:00:00");
      } else {
        d = cellDate(gridStart, w, 0);
      }
      /* For current year: show all months in the rolling window
         For past years: only show months within that calendar year */
      if (!isCurrentYear && d.getFullYear() !== year) continue;
      if (isCurrentYear && d.getFullYear() !== year && d.getFullYear() !== year - 1) continue;
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!(key in monthFirstWeek)) monthFirstWeek[key] = { month: d.getMonth(), week: w, year: d.getFullYear() };
    }

    const frag = document.createDocumentFragment();
    const sorted = Object.values(monthFirstWeek).sort((a, b) => a.week - b.week);

    sorted.forEach((entry, idx) => {
      const startWeek = entry.week;
      const endWeek = idx < sorted.length - 1 ? sorted[idx + 1].week : totalWeeks;

      let has = false;
      for (let w = startWeek; w < endWeek; w++) {
        if (grid[w] && grid[w].some((l) => l > 0)) { has = true; break; }
      }
      if (!has) return;

      const span = document.createElement("span");
      span.className = "github-chart__month-label";
      span.textContent = MONTHS[entry.month];
      span.style.position = "absolute";
      span.style.left = `${startWeek * CELL_PX}px`;
      frag.appendChild(span);
    });

    ghMonths.appendChild(frag);
  }

  /* ------------------------------------------------------------------ */
  /*  Tooltip                                                            */
  /* ------------------------------------------------------------------ */
  let tipEl = null;
  function setupTooltips() {
    tipEl = document.createElement("div");
    tipEl.className = "github-chart__tip";
    document.body.appendChild(tipEl);

    ghGrid.addEventListener("mouseover", (e) => {
      const cell = e.target.closest(".github-chart__day");
      if (!cell) return;
      tipEl.textContent = cell.getAttribute("data-tip") || "";
      const rect = cell.getBoundingClientRect();
      tipEl.style.left = `${rect.left + rect.width / 2}px`;
      tipEl.style.top = `${rect.top - 8}px`;
      tipEl.classList.add("is-visible");
    });
    ghGrid.addEventListener("mouseout", (e) => {
      const cell = e.target.closest(".github-chart__day");
      if (!cell) return;
      const related = e.relatedTarget?.closest?.(".github-chart__day");
      if (!related) tipEl.classList.remove("is-visible");
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Year toggle                                                        */
  /* ------------------------------------------------------------------ */
  if (ghYears) {
    const buttons = ghYears.querySelectorAll(".github-chart__year-btn");
    buttons.forEach((btn) => {
      const yr = parseInt(btn.dataset.year, 10);
      if (yr === activeYear) btn.classList.add("is-active");
      btn.addEventListener("click", () => {
        if (yr === activeYear) return;
        activeYear = yr;
        buttons.forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        loadYear(yr);
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Animate count                                                      */
  /* ------------------------------------------------------------------ */
  function animateCount(el, target) {
    if (!el) return;
    const duration = 1000;
    const start = performance.now();
    const from = parseInt(el.textContent.replace(/[^0-9]/g, ""), 10) || 0;
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (target - from) * eased).toLocaleString();
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ------------------------------------------------------------------ */
  /*  Init                                                               */
  /* ------------------------------------------------------------------ */
  setupTooltips();
  loadYear(activeYear);
})();
