/* Renders public/og.png (1200×630 social card) from HTML with the site's
   own font, fox mark and portrait. Re-run after changing the name or
   headline:  npm run assets
   (Favicons are the fox: public/favicon-32.png, favicon.ico,
   apple-touch-icon.png.) */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright";
import { profile } from "../src/data/site.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const b64 = (p) => fs.readFileSync(path.join(root, p)).toString("base64");
const font = (file, family, style = "normal") =>
  `@font-face{font-family:"${family}";src:url(data:font/woff2;base64,${b64(`src/assets/fonts/${file}`)}) format("woff2");font-style:${style};font-weight:100 900}`;
const fonts = font("Geist-Variable.woff2", "Geist");
const [first, ...rest] = profile.name.split(" ");

const og = `<!doctype html><html><head><style>${fonts}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;background:#f7f6f2;color:#141414;font-family:Geist;display:flex;align-items:center;padding:0 84px;gap:64px}
.copy{flex:1}
.pill{display:inline-flex;align-items:center;gap:10px;border:1px solid #e2e0d9;background:#fff;border-radius:99px;padding:8px 16px 8px 13px;font-size:20px;font-weight:550;color:#3d3e42}
.dot{width:11px;height:11px;border-radius:50%;background:#157a46}
h1{font:700 92px/1 Geist;letter-spacing:-4px;margin-top:30px}
h1 em{font-style:normal;font-weight:500;color:#5d5f65}
.top{display:flex;align-items:center;gap:18px}
.fox{width:56px;height:56px;object-fit:contain;border-radius:0;box-shadow:none}
.role{font-size:28px;font-weight:600;margin-top:24px;letter-spacing:-0.3px}
.meta{font-size:22px;color:#5d5f65;margin-top:14px}
.bar{width:120px;height:5px;border-radius:3px;background:#c2410c;margin-top:34px}
img{width:300px;height:360px;object-fit:cover;border-radius:22px;box-shadow:0 30px 60px -24px rgba(20,20,20,.35)}
</style></head><body>
<div class="copy">
  <div class="top"><img class="fox" src="data:image/png;base64,${b64("src/assets/fox.png")}" alt=""><span class="pill"><span class="dot"></span>${profile.availability}</span></div>
  <h1>${first} <em>${rest.join(" ")}</em></h1>
  <p class="role">${profile.headline}</p>
  <p class="meta">BS Computer Science · Cavite State University · github.com/${profile.githubHandle}</p>
  <div class="bar"></div>
</div>
<img src="data:image/jpeg;base64,${b64("src/assets/portrait.jpg")}" alt="">
</body></html>`;

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1200, height: 630 });
await page.setContent(og, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: path.join(root, "public/og.png") });

await browser.close();
console.log("wrote public/og.png");
