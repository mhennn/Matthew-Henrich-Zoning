# Matthew Henrich — Portfolio

![Portfolio preview](images/main_portfolio.png)

Personal portfolio site for Matthew Henrich — designer & developer. A dark, bold, single-page site built.

## Features

- Fixed glass navbar with scroll-spy highlighting and an animated mobile menu
- Hero with staggered headline and glass status card
- Skills section with toolbox chips — no fake percentage bars
- Link cards auto-built from `links/social-links.txt` (brand icons included)
- Contact form delivered to your inbox via FormSubmit (no backend)
- Scroll-entrance reveals via `IntersectionObserver`
- Footer year and the years-of-experience counter update automatically
- Portfolio descriptions auto-pulled from each repo's GitHub description

## Project structure

```
├── index.html               # single-page site
├── css/
│   └── styles.css           # all styles (design tokens at the top)
├── js/
│   ├── script.js            # nav, reveals, footer year, experience counter
│   ├── portfolio.js         # dynamic project grid from portfolio-links.txt
│   ├── social.js            # dynamic link cards from social-links.txt
│   └── contact.js           # contact form -> FormSubmit -> your inbox
├── links/
│   ├── portfolio-links.txt  # project URLs (data source for the grid)
│   └── social-links.txt     # one URL or email per line (data source for the cards)
├── projects/                # thumbnails + description/description.txt
└── images/                  # assets (e.g. the README screenshot)
```

## Adding content

Everything on the page is file-driven: edit a plain `.txt` file or drop
an image into a folder, then refresh (see *Deploying changes* below).

### Add a project (Work grid)

1. **Add the URL** — append one line to `links/portfolio-links.txt`
   (file order = display order). Appending at the end is easiest; if you
   insert in the middle, everything after it shifts row numbers.
2. **Add the thumbnail** — save it as `projects/<NN>_<repo>.png`, where:
   - `NN` is the URL's row number in the file (01, 02, 03, …)
   - `<repo>` is the last segment of the URL

   Example: 5th line, `https://github.com/mhennn/New-Project` →
   `projects/05_New-Project.png`.
3. **Description (optional)** — add one line to
   `projects/description/description.txt`, in the same row order as the
   links file. Skip it and the description is pulled automatically from
   the repo's GitHub page (GitHub URLs only; ~60 free API requests/hour).
   Manual lines always win.

Missing or misnamed image? The card still renders with a gradient
placeholder and a note showing the exact filename to save.

### Add a link card (Links section)

Append one URL **or** email per line to `links/social-links.txt`:

- **URLs** — detected by hostname. Known platforms (GitHub, LinkedIn,
  X, Facebook) get their brand icon, name and handle; anything else gets
  a generic link icon.
- **Emails** — become a card with an envelope icon and a `mailto:` link.

### Change where the contact form sends

Edit `FORM_ENDPOINT` at the top of `js/contact.js`. Then confirm the new
address once: submit the form and click the confirmation link FormSubmit
emails to it.

### Deploying changes

Redeploy the edited files to your host, then hard-refresh the browser
(`Ctrl+Shift+R` / `Cmd+Shift+R`) — cached CSS/JS is the usual reason a
page looks outdated after an update. The dynamic grids fetch their `.txt`
files over http(s), so they work on the live site or a local server
(e.g. `python -m http.server`) — not when opening the file directly
(a built-in fallback list covers that case).

## Customizing

- **Colors / fonts / radii** — edit the `:root` design tokens at the top of
  `css/styles.css` (green/red accents, Space Grotesk + Inter).
- **Copy** — hero, about, and skills text lives in `index.html`.
- **Years of experience** — set `START_YEAR` in `js/script.js`; the counter
  auto-increments every year.

## Tech

Vanilla HTML5, CSS3 (Grid, custom properties, backdrop-filter), and
JavaScript (ES6+, IntersectionObserver). No frameworks, no dependencies.
