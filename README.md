# Elroni Quiñones — Hiring Portfolio

A one-page, recruiter-first portfolio. Static HTML from [Astro](https://astro.build), ~2 KB of JavaScript, no backend.

## Edit content

Everything visitors read lives in **`src/data/site.ts`**: name, intro, links, projects, skills, experience, certifications.
Empty optional fields are simply not rendered, so nothing half-finished ever shows up on the site.

- **Add a project screenshot:** put the image in `src/assets/`, register it in `src/components/ProjectMedia.astro`, and use its key as `image` in `site.ts`.
- **GeoPalay** is a draft (`published: false`). Fill in verified details and set `published: true` to show it.
- **Not looking any more?** Set `openToWork: false` to hide the availability badge.
- **Production URL:** set `profile.siteUrl` (or the `SITE_URL` env var) to enable canonical links, the sitemap and absolute Open Graph URLs.

## Commands

| Command | What it does |
| --- | --- |
| `npm install` | Install dependencies (Node 22.23+ / 24) |
| `npm run dev` | Local dev server at http://localhost:4321 |
| `npm run build` | Refreshes GitHub activity (`src/data/github.json`), then builds → `dist/` |
| `npm run github` | Refresh GitHub activity only (keeps the old data if offline) |
| `npm run preview` | Serve the production build locally |
| `npm run resume` | Regenerate `public/resume/Elroni-Quinones-Resume.pdf` (one-page, ATS-friendly) from `site.ts` — needs Google Chrome installed |
| `npm run assets` | Regenerate `public/og.png` and the PNG favicons |

The résumé source is also saved as `resume/resume.html` so you can review it.

## Deploy

**GitHub Pages:** push this folder to a GitHub repo, then Settings → Pages → Source: *GitHub Actions*. `.github/workflows/deploy.yml` builds with the right base path automatically.

**Vercel / Netlify / Cloudflare Pages:** framework preset *Astro*, build command `npm run build`, output directory `dist`. No env vars needed (set `SITE_URL` for canonical/sitemap).

## Structure

```
src/data/site.ts          ← all content
src/components/           ← Nav, Hero, Projects (+ case-study dialogs), Certifications, Skills, About, GitHub, Contact, Loader, Icon
src/assets/badges/        ← Credly badge art (saved locally; file name = slug of the certificate title)
src/layouts/Base.astro    ← <head>, SEO, theme bootstrap
src/styles/global.css     ← design tokens (light + dark), type, buttons
src/scripts/site.ts       ← loader skip, theme toggle, dialogs fallback, copy email, mobile menu
scripts/                  ← résumé + OG image generators
public/resume/            ← downloadable résumé PDF
```

## Look & motion

- Section order: Hero → Selected projects → Certifications (all 29) → Skills → About → GitHub activity → Contact.
- Every section opens like the hero: heading rises out of a mask, an accent hairline draws across, content lifts in on a stagger. Reduced-motion visitors get gentle fades instead; without JavaScript everything is simply visible.
- Project cards tilt toward the cursor, a glare follows it, and the screenshot zooms with slight parallax (mouse/trackpad only).
- Nav: a full-width square bar at the top that morphs into a floating pill once you scroll (all modes).
- **Liquid glass** (droplet button): glass mode puts real WebGL refraction from [@ybouane/liquidglass](https://github.com/ybouane/liquidglass) (vendored in `src/vendor/liquidglass/`, MIT) on every card, over a slowly drifting fox-orange gradient. It loads only while glass mode is on, after the page is idle. Remembered per visitor, off by default.
- **Nav glass (always on)**: the nav bar and floating pill are clear liquid glass, and the section (hamburger) menu is lightly frosted liquid glass, in light, dark and glass mode, refracting the live page behind them. `src/scripts/lens.ts` ports the library's fragment shader into an SVG filter used as `backdrop-filter: url(#…)`, with its own fixed settings (`NAV_GLASS`) — the settings panel does not touch it — a faint theme tint and a soft halo behind the labels (`--lens-tint`, `--lens-halo` in `global.css`) so the text stays readable over any photo. The first bake waits for the visitor's first interaction (or 6 quiet seconds) and runs in small slices, so it never slows the page load. Chromium browsers only (Chrome, Edge, Opera, Android Chrome); Safari/Firefox show CSS frosted glass. The menu is a `popover` (top layer), so its glass sees the page rather than the pill.
- **Glass settings panel**: rest the pointer on the droplet for ~1 s (a ring fills), long-press it on touch, or focus it and press Arrow Down. The panel is itself liquid glass and previews the settings live on itself; presets **Clear** (the playground settings: blur 0.14, refraction 0.82, chromatic aberration 0.155, edge highlight 0.05, specular 0.25, fresnel 0.48, distortion 0.49, corner radius 40, z-radius 36, opacity 1, saturation 0.44, brightness 0.1, shadow 0.21 / 12, bevel 0), **Frosted** (+ blur 0.25) and **Dark** (+ blur 0.25, brightness −0.3), plus every playground slider. The same settings style every card in glass mode (never the nav), remembered per visitor. Defaults and ranges: `src/scripts/glass-config.ts`; panel: `src/scripts/glass-panel.ts`.
- Light/dark (moon/sun) and glass both switch with a circular reveal from the button.

Fonts: Geist & Geist Mono (Vercel) — SIL Open Font License, see `public/fonts/`.
