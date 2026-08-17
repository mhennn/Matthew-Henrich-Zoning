# Matthew Henrich — Portfolio

![Portfolio preview](images/main_portfolio.png)

Personal portfolio site for Matthew Henrich — designer & developer. A dark, bold, single-page site built.

## Features

- Fixed glass navbar with scroll-spy highlighting and an animated mobile menu
- Hero with staggered headline, glass status card, an
- Skills section with toolbox chips — no fake percentage bars
- Link cards auto-built from `links/social-links.txt` (brand icons included)
- Contact form delivered to your inbox via FormSubmit (no backend)
- Scroll-entrance reveals via `IntersectionObserver`
- Footer year and the years-of-experience counter update automatically

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
├── projects/                # project thumbnails
└── images/                  # assets (e.g. the README screenshot)
```

## Customizing

- **Colors / fonts / radii** — edit the `:root` design tokens at the top of
  `css/styles.css` (green/red accents, Space Grotesk + Inter).
- **Copy** — hero, about, and skills text lives in `index.html`.
- **Social links** — add one URL or email per line to
  `links/social-links.txt`; `js/social.js` builds the cards on load
  (known platforms get brand icons, emails become `mailto:` cards,
  anything else gets a generic link icon).
- **Contact form** — delivered via FormSubmit (free, no signup). Change
  the receiving address in `FORM_ENDPOINT` at the top of `js/contact.js`.
  On the first submission FormSubmit emails a confirmation link to that
  address — click it once and all later submissions arrive in the inbox.
- **Years of experience** — set `START_YEAR` in `js/script.js`; the counter
  auto-increments every year.

## Tech

Vanilla HTML5, CSS3 (Grid, custom properties, backdrop-filter), and
JavaScript (ES6+, IntersectionObserver). No frameworks, no dependencies.
