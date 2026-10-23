/* Fetches public GitHub activity for the "GitHub activity" section and
   writes src/data/github.json. Runs before every build (npm "prebuild").
   No token: contributions come from the public jogruber mirror of GitHub's
   calendar, profile stats from the public REST API. If the network is
   down the previous JSON is kept, so builds never fail because of it. */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const USER = "N0rrtthh";
const FIRST_YEAR = 2022;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(root, "src/data/github.json");

const get = async (url) => {
  const r = await fetch(url, { headers: { "User-Agent": "portfolio-build", Accept: "application/json" } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
};

try {
  const thisYear = new Date().getUTCFullYear();
  const years = Array.from({ length: thisYear - FIRST_YEAR + 1 }, (_, i) => FIRST_YEAR + i);
  const [last, perYear, user, repos] = await Promise.all([
    get(`https://github-contributions-api.jogruber.de/v4/${USER}?y=last`),
    get(`https://github-contributions-api.jogruber.de/v4/${USER}?${years.map((y) => `y=${y}`).join("&")}`),
    get(`https://api.github.com/users/${USER}`),
    get(`https://api.github.com/users/${USER}/repos?per_page=100&type=owner`),
  ]);

  const langs = {};
  for (const r of repos) if (!r.fork && r.language) langs[r.language] = (langs[r.language] || 0) + 1;

  const data = {
    user: USER,
    fetchedAt: new Date().toISOString(),
    lastYearTotal: last.total.lastYear,
    days: last.contributions.map((d) => [d.date, d.count, d.level]),
    yearTotals: Object.fromEntries(years.map((y) => [y, perYear.total[y] ?? 0])),
    publicRepos: user.public_repos,
    languages: Object.entries(langs).sort((a, b) => b[1] - a[1]).slice(0, 6),
  };
  fs.writeFileSync(OUT, JSON.stringify(data) + "\n");
  console.log(`github: ${data.lastYearTotal} contributions in the last year, ${data.publicRepos} repos`);
} catch (e) {
  if (fs.existsSync(OUT)) console.warn(`github: fetch failed (${e.message}) — keeping previous data`);
  else throw e;
}
