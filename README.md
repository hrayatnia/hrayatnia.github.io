# sam.rayatnia.me

Personal portfolio website for [Sam Rayatnia](https://github.com/hrayatnia) — Lead Mobile Engineer & Software Engineer based in Munich, Germany.

**Live site:** [sam.rayatnia.me](https://sam.rayatnia.me)

---

## Pages

| Page | Description |
|------|-------------|
| `/` | Homepage with hero, intro stats, and navigation |
| `/profile.html` | Professional summary and languages |
| `/experience.html` | Work history with timelines and durations |
| `/education.html` | Academic background and research |
| `/skills.html` | Technical skills with proficiency levels |

---

## Tech Stack

- **HTML5** — semantic markup, no framework
- **Tailwind CSS** — via CDN, utility-first responsive styling
- **Vanilla JavaScript** — theme toggle, parallax, grain texture, portal effects
- **Inter** — variable font for typography
- **GitHub Pages** — static hosting with custom domain

No build step, no dependencies to install. Files are served directly.

---

## Features

- Light/dark theme with `localStorage` persistence
- Parallax scroll and grain texture effects
- Responsive layout across mobile, tablet, and desktop
- Animated skill progress bars
- Visual timeline for experience and education
- Full favicon/PWA icon set

---

## Development

Clone and open any HTML file directly in a browser — no server or build process required.

```sh
git clone https://github.com/hrayatnia/hrayatnia.github.io.git
cd hrayatnia.github.io
open index.html
```

Changes pushed to `master` deploy automatically via GitHub Pages.

---

## Structure

```
.
├── index.html
├── profile.html
├── experience.html
├── education.html
├── skills.html
├── CNAME
└── static/
    ├── css/          # Tailwind overrides, themes, responsive styles
    ├── js/           # theme, parallax, grain, portal, duration, safari fixes
    ├── font/         # Inter variable font
    ├── img/          # Profile photo and video backgrounds
    └── favicon/      # Multi-platform icon set
```
