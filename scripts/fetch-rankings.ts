import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = "https://pvpoketw.com/data/rankings/all/overall";
const VERSION = "1.36.21.1";
const TOP_N = 200;

const LEAGUES = [
  { name: "great", cp: 1500 },
  { name: "ultra", cp: 2500 },
  { name: "master", cp: 10000 },
];

async function fetchLeague(cp: number): Promise<unknown[]> {
  const url = `${BASE_URL}/rankings-${cp}.json?v=${VERSION}`;
  console.log(`Fetching CP ${cp}...`);

  const res = await fetch(url, {
    headers: {
      accept: "application/json, text/javascript, */*; q=0.01",
      "accept-language": "zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7",
      "x-requested-with": "XMLHttpRequest",
      Referer: `https://pvpoketw.com/rankings/all/${cp}/overall/`,
    },
  });

  if (!res.ok) {
    throw new Error(`CP ${cp} failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return (data as unknown[]).slice(0, TOP_N);
}

async function main() {
  const outDir = resolve(__dirname, "..", "src", "data");
  mkdirSync(outDir, { recursive: true });

  const results = await Promise.all(
    LEAGUES.map(async (league) => {
      const data = await fetchLeague(league.cp);
      return { name: league.name, data };
    })
  );

  for (const { name, data } of results) {
    const outPath = resolve(outDir, `rankings-${name}.json`);
    writeFileSync(outPath, JSON.stringify(data, null, 2), "utf-8");
    console.log(`Saved ${data.length} entries to rankings-${name}.json`);
  }

  // Fetch gamemaster for Chinese/English name mapping
  console.log("Fetching gamemaster...");
  const gmRes = await fetch(
    `https://pvpoketw.com/data/gamemaster.min.json?v=${VERSION}`,
    {
      headers: {
        accept: "application/json, text/javascript, */*; q=0.01",
        "x-requested-with": "XMLHttpRequest",
        Referer: "https://pvpoketw.com/rankings/all/10000/overall/",
      },
    }
  );
  if (!gmRes.ok) {
    throw new Error(`Gamemaster failed: ${gmRes.status} ${gmRes.statusText}`);
  }
  const gamemaster = await gmRes.json();
  const gmPath = resolve(outDir, "gamemaster.json");
  writeFileSync(gmPath, JSON.stringify(gamemaster, null, 2), "utf-8");
  console.log(`Saved gamemaster to gamemaster.json`);

  console.log("Done!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
