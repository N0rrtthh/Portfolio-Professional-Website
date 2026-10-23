/* ══════════════════════════════════════════════════════════
   build-resume — one-page, ATS-friendly résumé PDF
   ──────────────────────────────────────────────────────────
   node scripts/build-resume.mjs
     → public/resume/Elroni-Quinones-Resume.pdf   (downloadable)
     → resume/resume.html                         (source, for review)

   Content comes from src/data/site.ts (Node 24 strips the TS types),
   so the résumé and the website never disagree.

   ATS rules followed: single column, standard section headings, real
   selectable text, no tables/columns/icons/images, standard font,
   dates as plain text, links written out in full.
   ══════════════════════════════════════════════════════════ */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright";
import { profile, education, experience, leadership, skills, projects, certifications } from "../src/data/site.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
/* Plain separators: some ATS parsers drop "·". */
const esc = (s) =>
  String(s).replace(/\s·\s/g, ", ").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const bare = (u) => u.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

const byslug = Object.fromEntries(projects.map((p) => [p.slug, p]));
const ww = byslug.waterwise;
const qa = byslug.quickattend;
const rm = byslug.resumaker;

/* Curated for one page: the strongest, verifiable lines only. */
const resumeProjects = [
  {
    name: "WaterWise — Educational Android Game (Undergraduate Thesis)",
    meta: `${ww.tech.join(", ")} · ${ww.year}`,
    link: ww.github?.[0]?.href,
    points: [
      "Co-developed a Godot game on water conservation with single-player and offline co-op multiplayer over a phone's Wi-Fi hotspot, as one of three thesis proponents.",
      "Implemented rule-based rolling-window adaptive difficulty (Weighted Proficiency Index over five games) and an integer-only G-Counter CRDT for score sync.",
      "Averaged 28.2–29.6 FPS on a Motorola Moto E5 Plus; sync replicas converged in all 180 trials at up to 90% packet loss with updates 76–83% smaller than JSON.",
    ],
  },
  {
    name: "ResuMaker — Résumé Builder Web App",
    meta: `${rm.tech.join(", ")} · ${rm.year}`,
    link: rm.live?.href,
    points: [
      "Built a two-panel résumé editor with live preview, an ATS-inspired quality score, JSON import/export and print-to-PDF; optional OpenAI review with a local fallback.",
    ],
  },
  {
    name: "QuickAttend — QR Attendance System (Web + Mobile)",
    meta: `${qa.tech.join(", ")} · ${qa.year}`,
    link: qa.live?.href,
    points: [
      "Built a web admin that issues a QR code per session and a mobile scanner that adds face recognition as a second verification factor.",
    ],
  },
];

const certList = [
  ...certifications.filter((c) => c.featured),
  ...certifications.filter((c) => ["AI Fundamentals: Language and Vision in AI", "Python Essentials 2"].includes(c.title)),
].slice(0, 6);

const contact = [
  profile.location.replace(", Philippines", ", PH"),
  profile.phone,
  profile.email,
  bare(profile.linkedin),
  bare(profile.github),
  profile.siteUrl ? bare(profile.siteUrl) : null,
].filter(Boolean);

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>${esc(profile.nameAscii)} — Résumé</title>
<meta name="author" content="${esc(profile.name)}">
<meta name="description" content="Résumé of ${esc(profile.name)}, Software Developer">
<style>
  @page { size: A4; margin: 11mm 14mm 10mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 9.6pt; line-height: 1.33; color: #111; }
  h1 { font-size: 20pt; letter-spacing: 0.2px; line-height: 1.1; }
  .headline { font-size: 10.5pt; font-weight: bold; color: #1f3fbf; margin-top: 2px; }
  .contact { margin-top: 4px; font-size: 9pt; color: #222; }
  h2 { font-size: 10pt; text-transform: uppercase; letter-spacing: 0.8px; margin-top: 8px; padding-bottom: 2px; border-bottom: 1px solid #222; }
  p.summary { margin-top: 4px; }
  .entry { margin-top: 5px; }
  .row { display: flex; justify-content: space-between; gap: 12px; }
  .title { font-weight: bold; }
  .meta { color: #333; }
  .date { white-space: nowrap; font-weight: bold; }
  ul { margin: 2px 0 0 15px; }
  ul.two { columns: 2; column-gap: 22px; }
  li { margin-top: 1.5px; }
  .skills p { margin-top: 3px; }
  .skills b { display: inline; }
  a { color: inherit; text-decoration: none; }
</style></head>
<body>
  <h1>${esc(profile.name.toUpperCase())}</h1>
  <div class="headline">${esc(profile.headline)}</div>
  <div class="contact">${contact.map(esc).join("  |  ")}</div>

  <h2>Summary</h2>
  <p class="summary">Early-career software developer and BS Computer Science student at Cavite State University. Shipped a franchise order management portal (React, Node.js, MySQL) now in active use at BidaBoss Inc., a Flutter e-commerce app, and an offline multiplayer Android game in Godot. Seeking an entry-level developer role.</p>

  <h2>Technical Skills</h2>
  <div class="skills">
    ${skills.map((s) => `<p><b>${esc(s.group)}:</b> ${s.items.map(esc).join(", ")}</p>`).join("\n    ")}
  </div>

  <h2>Experience</h2>
  ${experience
    .map(
      (e) => `<div class="entry">
    <div class="row"><span><span class="title">${esc(e.role)}</span> — ${esc(e.org)}, ${esc(e.place)}</span><span class="date">${esc(e.period)}</span></div>
    <ul>${e.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
  </div>`
    )
    .join("\n  ")}

  <h2>Projects</h2>
  ${resumeProjects
    .map(
      (p) => `<div class="entry">
    <div class="row"><span class="title">${esc(p.name)}</span><span class="date">${esc(p.meta.split(" · ").pop())}</span></div>
    <div class="meta">${esc(p.meta.split(" · ")[0])}${p.link ? ` — ${esc(bare(p.link))}` : ""}</div>
    <ul>${p.points.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
  </div>`
    )
    .join("\n  ")}

  <h2>Education</h2>
  ${education
    .slice(0, 1) // degree only — one page
    .map(
      (e) => `<div class="entry">
    <div class="row"><span><span class="title">${esc(e.degree)}</span> — ${esc(e.school)}, ${esc(e.place)}</span><span class="date">${esc(e.period)}</span></div>
    ${e.note ? `<div class="meta">${esc(e.note)}</div>` : ""}
  </div>`
    )
    .join("\n  ")}

  <h2>Certifications</h2>
  <ul>${certList.map((c) => `<li>${esc(c.title)} — ${esc(c.issuer.split(" · ").slice(0, 2).join(" · "))} (${esc(c.year)})</li>`).join("")}</ul>

  <h2>Leadership &amp; Activities</h2>
  <ul>${leadership.map((l) => `<li><b>${esc(l.role)}</b>, ${esc(l.org.replace(", CvSU Chapter", "").replace(", CvSU", ""))}, CvSU (${esc(l.period)})</li>`).join("")}</ul>
</body></html>`;

fs.mkdirSync(path.join(root, "resume"), { recursive: true });
fs.mkdirSync(path.join(root, "public/resume"), { recursive: true });
fs.writeFileSync(path.join(root, "resume/resume.html"), html);

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage();
await page.setContent(html, { waitUntil: "load" });
const out = path.join(root, "public", profile.resumeFile);
await page.pdf({ path: out, format: "A4", printBackground: false, preferCSSPageSize: true, tagged: true, outline: false });
await browser.close();
console.log("wrote", path.relative(root, out));
