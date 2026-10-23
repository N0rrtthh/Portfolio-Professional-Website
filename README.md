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
| `npm run build` | Production build → `dist/` |
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
src/components/           ← Nav, Hero, Projects (+ case-study dialogs), Skills, About, Contact, Loader, Icon
src/layouts/Base.astro    ← <head>, SEO, theme bootstrap
src/styles/global.css     ← design tokens (light + dark), type, buttons
src/scripts/site.ts       ← loader skip, theme toggle, dialogs fallback, copy email, mobile menu
scripts/                  ← résumé + OG image generators
public/resume/            ← downloadable résumé PDF
```

Fonts: Geist & Geist Mono (Vercel) and Instrument Serif — SIL Open Font License, see `public/fonts/`.
