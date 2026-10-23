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

- Section order: Hero → Selected projects → Certifications → Skills → About → GitHub activity → Contact.
- Sections reveal as they scroll in (heading wipe, hairline draw, staggered content). Disabled automatically for reduced-motion users and without JavaScript.
- **Liquid glass** (droplet button in the nav): translucent, blurred surfaces over a soft colour field; Chromium browsers also refract the nav and buttons through an SVG lens. Remembered per visitor, off by default.
- Light/dark (moon/sun button) and glass both switch with a circular reveal from the button.

Fonts: Geist & Geist Mono (Vercel) — SIL Open Font License, see `public/fonts/`.
