import { readFileSync } from "node:fs";

const great = JSON.parse(readFileSync("src/data/rankings-great.json", "utf-8"));
const ultra = JSON.parse(readFileSync("src/data/rankings-ultra.json", "utf-8"));
const master = JSON.parse(readFileSync("src/data/rankings-master.json", "utf-8"));
const gm = JSON.parse(readFileSync("src/data/gamemaster.json", "utf-8"));

const ID_ALIAS: Record<string, string> = { cradily_b: "cradily" };

// Build pokemon lookup
const pokemonMap = new Map<string, any>();
for (const mon of gm.pokemon) {
  pokemonMap.set(mon.speciesId, mon);
}

// Get our 260 deduplicated zhNames with their lookup ids
const allIds = [...great, ...ultra, ...master].map((p: any) => p.speciesId);
const uniqueIds = [...new Set(allIds)] as string[];

const seen = new Set<string>();
const finalEntries: { zhName: string; lookupId: string }[] = [];
for (const id of uniqueIds) {
  const lookupId = ID_ALIAS[id] ?? id;
  const mon = pokemonMap.get(lookupId);
  if (!mon) continue;
  let name = (mon.speciesName as string).split(" ")[0];
  if (name.startsWith("卡璞")) name = "卡璞";
  if (seen.has(name)) continue;
  seen.add(name);
  finalEntries.push({ zhName: name, lookupId });
}

// Strip variant suffixes to get base species id
function getBaseId(id: string): string {
  return id.replace(/_(shadow|galarian|alolan|hisuian|mega_x|mega_y)$/, "");
}

// Collect base ids in our list
const baseIds = new Set(finalEntries.map((e) => getBaseId(e.lookupId)));

// Find families with multiple members in our list
const familyGroups = new Map<string, string[]>();
for (const baseId of baseIds) {
  const mon = pokemonMap.get(baseId);
  if (!mon?.family) continue;
  const famId = mon.family.id as string;
  if (!familyGroups.has(famId)) familyGroups.set(famId, []);
  familyGroups.get(famId)!.push(mon.speciesName.split(" ")[0]);
}

console.log("=== Evolution families with multiple members in our list ===\n");
for (const [famId, members] of familyGroups) {
  const unique = [...new Set(members)];
  if (unique.length > 1) {
    console.log(`${famId}: ${unique.join(", ")}`);
  }
}
