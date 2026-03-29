import greatRankings from "../src/data/rankings-great.json";
import ultraRankings from "../src/data/rankings-ultra.json";
import masterRankings from "../src/data/rankings-master.json";
import gamemaster from "../src/data/gamemaster.json";

// 1. Collect all speciesId from 3 leagues
const allIds = [
  ...greatRankings.map((p: any) => p.speciesId),
  ...ultraRankings.map((p: any) => p.speciesId),
  ...masterRankings.map((p: any) => p.speciesId),
];

// 2. Deduplicate
const uniqueIds = [...new Set(allIds)];

// 3. Build name map from gamemaster
const nameMap = new Map<string, string>();
// Special case: cradily_b -> use cradily's name
const ID_ALIAS: Record<string, string> = { cradily_b: "cradily" };
for (const mon of (gamemaster as any).pokemon) {
  nameMap.set(mon.speciesId, mon.speciesName);
}

// 4. Map to base Chinese name (first token before space)
const result = uniqueIds.map((id) => {
  const lookupId = ID_ALIAS[id] ?? id;
  const fullName = nameMap.get(lookupId) ?? "(not found)";
  let baseName = fullName.split(" ")[0];
  // Merge "卡璞・XX" variants into "卡璞"
  if (baseName.startsWith("卡璞")) baseName = "卡璞";
  return { speciesId: id, zhName: baseName };
});

// Deduplicate by zhName
const seen = new Set<string>();
const deduped = result.filter(({ zhName }) => {
  if (seen.has(zhName)) return false;
  seen.add(zhName);
  return true;
});

// 5. Remove pre-evolutions, keep only final form per family
const pokemonMap = new Map<string, any>();
for (const mon of (gamemaster as any).pokemon) {
  pokemonMap.set(mon.speciesId, mon);
}

// Build a set of zhNames that are pre-evolutions of another zhName in our list
const preEvoNames = new Set<string>();
const dedupedNames = new Set(deduped.map((d) => d.zhName));

for (const { speciesId } of deduped) {
  const lookupId = ID_ALIAS[speciesId] ?? speciesId;
  // Strip variant suffixes to find base form in gamemaster
  const baseId = lookupId.replace(/_(shadow|galarian|alolan|hisuian)$/, "");
  const mon = pokemonMap.get(baseId);
  if (!mon?.family?.evolutions) continue;

  // This pokemon has evolutions - check if any evolved form is also in our list
  for (const evoId of mon.family.evolutions) {
    const evoMon = pokemonMap.get(evoId);
    if (!evoMon) continue;
    let evoName = evoMon.speciesName.split(" ")[0];
    if (evoName.startsWith("卡璞")) evoName = "卡璞";
    if (dedupedNames.has(evoName)) {
      // Our current pokemon's zhName is a pre-evo of something in the list
      const myName = deduped.find((d) => d.speciesId === speciesId)!.zhName;
      preEvoNames.add(myName);
    }
  }
}

const afterEvo = deduped.filter(({ zhName }) => !preEvoNames.has(zhName));

// 6. Deduplicate branch evolutions: keep only first per family
const seenFamily = new Set<string>();
const final = afterEvo.filter(({ speciesId }) => {
  const lookupId = ID_ALIAS[speciesId] ?? speciesId;
  const baseId = lookupId.replace(/_(shadow|galarian|alolan|hisuian)$/, "");
  const mon = pokemonMap.get(baseId);
  const famId = mon?.family?.id ?? baseId;
  if (seenFamily.has(famId)) return false;
  seenFamily.add(famId);
  return true;
});

// Output as JSON for frontend
import { writeFileSync as writeFile, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dir, "..", "public", "data");
mkdirSync(outDir, { recursive: true });
const outPath = resolve(outDir, "pokemon-names.json");
const names = final.map(({ zhName }) => zhName);
const payload = {
  updatedAt: new Date().toISOString(),
  names: names.join(","),
};
writeFile(outPath, JSON.stringify(payload), "utf-8");
console.log(`Total: ${names.length}, saved to public/data/pokemon-names.json`);
