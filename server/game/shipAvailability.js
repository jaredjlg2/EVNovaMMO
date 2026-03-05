/**
 * Ship Availability System
 *
 * Determines which ships are purchasable in a given star system based on:
 *   - System metadata (type, shipyard tier, tech level, population)
 *   - Ship requirements (required shipyard level, min tech, min population)
 *   - Faction territory rules (faction ships sold in their own systems)
 *   - Special regional availability (unique ships tied to specific system types)
 *
 * System metadata is derived from existing fields (status, zoneType, tags, traffic,
 * factionId, capitalOf) so no new data storage is required for most systems.
 *
 * FACTION PHILOSOPHIES
 * ─────────────────────
 *  solar_directorate   — Balanced military: modular fighters, gunships, cruisers
 *  ironclad_clans      — Heavy armored warships: slow, high hull, brutal boarding
 *  echotrail_communion — Advanced shields/energy: bio-ships, psychic disruptors
 *  luminari_compact    — Fast exotic drives: stealth, high-speed interceptors
 *  free_horizons_guild — Flexible traders: modular freighters, escort gunships
 *  black_flag_syndicate— Pirate raids: cheap, fast, aggressive raider ships
 *  starseed_foundation — Colonial logistics: mining, agricultural, heavy cargo
 *  obsidian_covenant   — Void tech: corruption weapons, entropy fields
 *
 * SYSTEM TYPES
 * ─────────────
 *  capital          — Faction homeworld; tier 5 shipyard, all faction ships
 *  core_world       — Developed core system; tier 3–4 shipyard
 *  trade_hub        — High-traffic commerce nexus; neutral + faction ships
 *  industrial       — Heavy manufacturing; freighters and gunships
 *  agricultural     — Farming/terraforming worlds; traders and haulers
 *  mining           — Extraction worlds; mining ships and heavy freighters
 *  frontier         — Sparse settlements; starter ships only
 *  pirate_haven     — Lawless pirate bases; black-market and pirate ships
 *  research_outpost — Science stations; high-tech and exotic ships
 *  contested        — Active conflict zones; military ships from both sides
 *
 * AVAILABILITY ALGORITHM
 * ──────────────────────
 * 1. Derive system metadata from existing fields.
 * 2. Determine which factions may sell ships here.
 * 3. Filter ships by shipyard tier, tech level, population.
 * 4. Apply special regional overrides (unique/prototype ships).
 */

const { ships, factions } = require("./data");

// ─── FACTION CAPITAL MAP ────────────────────────────────────────────────────

const factionById = new Map(factions.map((f) => [f.id, f]));

// ─── SYSTEM TYPE DERIVATION ─────────────────────────────────────────────────

/**
 * Derive structured metadata for a system from its raw fields.
 * @param {object} system - A star system object from systems.json
 * @returns {object} Derived metadata
 */
const deriveSystemMetadata = (system) => {
  const { status, traffic, zoneType, tags = [], factionId, capitalOf } = system;

  // 1. System type
  let systemType;
  if (capitalOf) {
    systemType = "capital";
  } else if (tags.includes("TRADE_HUB") || zoneType === "HUB") {
    systemType = "trade_hub";
  } else if (tags.includes("PIRATE_BASE") || tags.includes("PIRATE_MARKET")) {
    systemType = "pirate_haven";
  } else if (tags.includes("SENSOR_SPIRE") || tags.includes("PSYCHIC_ANOMALY") || zoneType === "STORY_UNIQUE") {
    systemType = "research_outpost";
  } else if (tags.includes("FORGE_WORLD")) {
    systemType = "industrial";
  } else if (tags.includes("TERRAFORMING_SITE") || tags.includes("COLONY_CANDIDATE")) {
    systemType = "agricultural";
  } else if (tags.includes("CONFLICT_ZONE")) {
    systemType = "contested";
  } else if (tags.includes("DEEP_BACKWATER")) {
    systemType = "frontier";
  } else if (status === "core") {
    systemType = "core_world";
  } else if (status === "frontier") {
    systemType = "frontier";
  } else {
    systemType = "core_world";
  }

  // 2. Shipyard tier (0 = none, 1 = basic, 5 = full capital)
  let shipyardTier;
  if (systemType === "capital") {
    shipyardTier = 5;
  } else if (systemType === "trade_hub") {
    shipyardTier = 4;
  } else if (systemType === "industrial") {
    shipyardTier = 4;
  } else if (status === "core" && traffic === "heavy") {
    shipyardTier = 4;
  } else if (status === "core") {
    shipyardTier = 3;
  } else if (systemType === "research_outpost") {
    shipyardTier = 3;
  } else if (systemType === "agricultural") {
    shipyardTier = 2;
  } else if (systemType === "pirate_haven") {
    shipyardTier = 2;
  } else if (status === "border" && traffic === "medium") {
    shipyardTier = 2;
  } else if (systemType === "frontier" || tags.includes("DEEP_BACKWATER")) {
    shipyardTier = 1;
  } else if (systemType === "contested") {
    shipyardTier = 1;
  } else {
    shipyardTier = 1;
  }

  // 3. Tech level (1–5); high-tech factions get a bonus in their own territory
  let techLevel;
  const hiTechFactions = new Set(["luminari_compact", "echotrail_communion"]);
  const isHiTech = factionId && hiTechFactions.has(factionId);
  if (systemType === "capital") {
    techLevel = isHiTech ? 5 : 4;
  } else if (status === "core" && isHiTech) {
    techLevel = 4;
  } else if (status === "core") {
    techLevel = 3;
  } else if (systemType === "research_outpost") {
    techLevel = isHiTech ? 5 : 4;
  } else if (systemType === "industrial") {
    techLevel = 3;
  } else if (status === "border") {
    techLevel = 2;
  } else {
    techLevel = 1;
  }

  // 4. Population level (1–5)
  let populationLevel;
  if (systemType === "capital") {
    populationLevel = 5;
  } else if (traffic === "heavy" && status === "core") {
    populationLevel = 4;
  } else if (traffic === "medium" && (status === "core" || status === "border")) {
    populationLevel = 3;
  } else if (traffic === "light") {
    populationLevel = 2;
  } else if (systemType === "frontier" || tags.includes("DEEP_BACKWATER")) {
    populationLevel = 1;
  } else {
    populationLevel = 2;
  }

  // 5. Industrial output (1–5)
  let industrialOutput;
  if (systemType === "industrial") {
    industrialOutput = 5;
  } else if (systemType === "capital" || systemType === "trade_hub") {
    industrialOutput = 4;
  } else if (status === "core" && traffic === "heavy") {
    industrialOutput = 3;
  } else if (traffic === "medium") {
    industrialOutput = 2;
  } else {
    industrialOutput = 1;
  }

  // 6. Economic level (1–5)
  let economicLevel;
  if (systemType === "trade_hub" || systemType === "capital") {
    economicLevel = 5;
  } else if (status === "core") {
    economicLevel = traffic === "heavy" ? 4 : 3;
  } else if (status === "border") {
    economicLevel = 2;
  } else {
    economicLevel = 1;
  }

  return {
    systemType,
    shipyardTier,
    techLevel,
    populationLevel,
    industrialOutput,
    economicLevel,
  };
};

// ─── FACTION TERRITORY RULES ────────────────────────────────────────────────

/**
 * Returns faction IDs that are allowed to sell ships in the given system.
 * Neutral ships are always allowed wherever there is a shipyard.
 */
const getAllowedFactions = (system, metadata) => {
  const allowed = new Set();

  // Neutral ships available everywhere
  allowed.add("neutral");

  const { systemType } = metadata;
  const { factionId, capitalOf, tags = [] } = system;

  // The system's controlling faction
  if (factionId) {
    allowed.add(factionId);
  }
  if (capitalOf) {
    allowed.add(capitalOf);
  }

  // Pirate havens carry Black Flag ships regardless of owner
  if (
    systemType === "pirate_haven" ||
    tags.includes("PIRATE_BASE") ||
    tags.includes("PIRATE_MARKET")
  ) {
    allowed.add("black_flag_syndicate");
  }

  // Trade hubs carry Free Horizons Guild civilian ships
  if (systemType === "trade_hub") {
    allowed.add("free_horizons_guild");
  }

  // Contested border systems may carry ships from disputing factions
  if (tags.includes("CONFLICT_ZONE") && Array.isArray(system.disputedWith)) {
    for (const disputeFaction of system.disputedWith) {
      allowed.add(disputeFaction);
    }
  }

  return allowed;
};

// ─── SEEDED RANDOM ──────────────────────────────────────────────────────────

/** Simple DJB2-style string hash for seeding the PRNG. */
const hashString = (value) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

/** Splitmix32-based seeded PRNG. Returns a function that yields [0,1) floats. */
const seededRandom = (seed) => {
  let t = seed + 0x6d2b79f5;
  return () => {
    t += 0x6d2b79f5;
    let result = Math.imul(t ^ (t >>> 15), 1 | t);
    result ^= result + Math.imul(result ^ (result >>> 7), 61 | result);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
};

// ─── SHIP TIER NUMERIC MAPPING ──────────────────────────────────────────────

/**
 * Map each ship tier string to a numeric range [min, max].
 * Used to determine whether a ship's tier falls within a shipyard's allowed
 * tier window.
 */
const TIER_TO_NUMERIC = {
  "I":      [1, 1],
  "I-II":   [1, 2],
  "II":     [2, 2],
  "II-III": [2, 3],
  "III":    [3, 3],
  "III-IV": [3, 4],
  "IV":     [4, 4],
  "V":      [5, 5],
  "V+":     [5, 5],
};

// ─── SHIPYARD TIER → ALLOWED SHIP TIER RANGE ───────────────────────────────

/**
 * Which ship tiers a shipyard of a given level may stock.
 *
 *  Level 1 → Tier 1–2   (starter + light)
 *  Level 2 → Tier 1–3   (up to medium)
 *  Level 3 → Tier 1–4   (up to heavy)
 *  Level 4 → Tier 2–4   (light through heavy, no starters)
 *  Level 5 → Tier 2–5   (light through capital, no starters)
 */
const SHIPYARD_ALLOWED_TIERS = {
  1: [1, 2],
  2: [1, 3],
  3: [1, 4],
  4: [2, 4],
  5: [2, 5],
};

// ─── SHIPYARD SIZE RANGES ───────────────────────────────────────────────────

/**
 * Min / max number of ships a shipyard may offer, indexed by shipyard tier.
 *
 *  Tier 1 — frontier system       : 3–6  ships
 *  Tier 2 — small colony          : 5–7  ships
 *  Tier 3 — developed world       : 7–10 ships
 *  Tier 4 — major trade hub       : 10–12 ships
 *  Tier 5 — faction capital       : 12–18 ships
 *
 * Absolute maximum across all tiers: 18.
 */
const SHIPYARD_SIZE_RANGE = {
  1: [3, 6],
  2: [5, 7],
  3: [7, 10],
  4: [10, 12],
  5: [12, 18],
};

const ABSOLUTE_MAX_SHIPS = 18;

// ─── INDUSTRY PREFERENCE ────────────────────────────────────────────────────

/**
 * System type → preferred ship archetypes.
 * Ships with a matching archetype receive a weight boost during selection.
 * null means no particular preference (all archetypes equally weighted).
 */
const INDUSTRY_PREFERRED_ARCHETYPES = {
  contested:         ["fighter", "interceptor", "gunship", "cruiser", "carrier", "battleship"],
  industrial:        ["freighter", "heavy_freighter", "light_trader"],
  research_outpost:  ["scout_courier", "interceptor"],
  trade_hub:         ["light_trader", "scout_courier", "freighter"],
  pirate_haven:      ["fighter", "interceptor", "gunship"],
  agricultural:      ["light_trader", "freighter", "heavy_freighter"],
  frontier:          ["scout_courier", "light_trader", "fighter"],
  capital:           null,
  core_world:        null,
};

// ─── RARITY WEIGHTS ─────────────────────────────────────────────────────────

/**
 * Base selection weight by ship tier.
 * Lower-tier (common) ships have higher weight → appear in more systems.
 * Higher-tier (rare) ships have lower weight → appear in fewer systems.
 */
const RARITY_WEIGHT = {
  "I":      3.0,
  "I-II":   2.5,
  "II":     2.5,
  "II-III": 2.0,
  "III":    2.0,
  "III-IV": 1.5,
  "IV":     1.5,
  "V":      1.0,
  "V+":     0.5,
};

// ─── SHIP AVAILABILITY ALGORITHM ────────────────────────────────────────────

/**
 * Returns the list of ships available for purchase in the given system.
 *
 * Algorithm:
 *  1. System must have a shipyard (shipyardTier >= 1) to sell any ships.
 *  2. Hard-filter ships by: faction territory, tier range, tech level,
 *     and population requirements.
 *  3. Determine a target inventory size from SHIPYARD_SIZE_RANGE.
 *  4. If eligible ships fit within the target, return them all.
 *  5. Otherwise, allocate slots by faction distribution
 *     (60–70% primary, 20–30% neutral, 0–10% foreign) and fill each
 *     bucket via weighted random selection influenced by:
 *       – industry preference (system type → archetype boost)
 *       – regional preference (ship.preferredSystemTypes)
 *       – rarity weight (ship tier)
 *  6. The total list is hard-capped at 18 ships.
 *
 * @param {object} system - Star system object from systems.json
 * @returns {{ metadata: object, available: object[] }}
 */
const getShipsForSystem = (system) => {
  const metadata = deriveSystemMetadata(system);
  const { shipyardTier, techLevel, populationLevel, systemType } = metadata;

  if (shipyardTier === 0) {
    return { metadata, available: [] };
  }

  const allowedFactions = getAllowedFactions(system, metadata);
  const isCapital = systemType === "capital";

  // Faction capitals stock all tiers (including starters for new recruits).
  // Other shipyards follow the strict tier window.
  const [minAllowedTier, maxAllowedTier] = isCapital
    ? [1, 5]
    : SHIPYARD_ALLOWED_TIERS[shipyardTier];

  // ── Step 1: Hard-filter eligible ships ──────────────────────────────────
  const eligible = ships.filter((ship) => {
    // Faction gate
    if (!allowedFactions.has(ship.factionId)) {
      return false;
    }

    // Tier gate — ship's numeric tier range must overlap with the shipyard's
    const [shipMinTier, shipMaxTier] = TIER_TO_NUMERIC[ship.tier] || [1, 5];
    if (shipMinTier > maxAllowedTier || shipMaxTier < minAllowedTier) {
      return false;
    }

    // Tech level gate
    if (techLevel < (ship.minTechLevel ?? 1)) {
      return false;
    }

    // Population gate
    if (populationLevel < (ship.minPopulation ?? 0)) {
      return false;
    }

    return true;
  });

  // ── Step 2: Determine target inventory size ─────────────────────────────
  const [minShips, maxShips] = SHIPYARD_SIZE_RANGE[shipyardTier];
  const rng = seededRandom(hashString(system.id));
  const targetCount = Math.min(
    eligible.length,
    minShips + Math.floor(rng() * (maxShips - minShips + 1))
  );

  // If every eligible ship fits, return them all — no need for selection.
  if (eligible.length <= targetCount) {
    return { metadata, available: eligible };
  }

  // ── Step 3: Split eligible ships by faction bucket ──────────────────────
  const primaryFaction = system.capitalOf || system.factionId || null;

  const primaryPool  = primaryFaction
    ? eligible.filter((s) => s.factionId === primaryFaction)
    : [];
  const neutralPool  = eligible.filter((s) => s.factionId === "neutral");
  const foreignPool  = eligible.filter(
    (s) => s.factionId !== primaryFaction && s.factionId !== "neutral"
  );

  // ── Step 4: Allocate slots by faction distribution ──────────────────────
  // At faction capitals, guarantee ALL primary faction ships first, then
  // fill the remaining slots with neutral/foreign ships.
  // At other systems, target ratios: 60–70% primary, 20–30% neutral, 0–10% foreign
  let primaryTarget, neutralTarget, foreignTarget;

  if (isCapital) {
    // Capitals guarantee every eligible faction ship
    primaryTarget = primaryPool.length;
    const remainingSlots = Math.max(0, targetCount - primaryTarget);
    const neutralSlots = Math.min(neutralPool.length, Math.ceil(remainingSlots * 0.7));
    const foreignSlots = Math.min(foreignPool.length, remainingSlots - neutralSlots);
    neutralTarget = neutralSlots;
    foreignTarget = Math.max(0, foreignSlots);
  } else {
    const primaryRatio = 0.60 + rng() * 0.10;
    const neutralRatio = 0.20 + rng() * 0.10;

    primaryTarget = Math.round(targetCount * primaryRatio);
    neutralTarget = Math.round(targetCount * neutralRatio);
    foreignTarget = Math.max(0, targetCount - primaryTarget - neutralTarget);

    // Cap each bucket to what's actually available
    primaryTarget = Math.min(primaryTarget, primaryPool.length);
    neutralTarget = Math.min(neutralTarget, neutralPool.length);
    foreignTarget = Math.min(foreignTarget, foreignPool.length);

    // Redistribute any unused slots — primary gets priority, then neutral
    let remaining = targetCount - primaryTarget - neutralTarget - foreignTarget;
    if (remaining > 0 && primaryPool.length > primaryTarget) {
      const add = Math.min(remaining, primaryPool.length - primaryTarget);
      primaryTarget += add;
      remaining -= add;
    }
    if (remaining > 0 && neutralPool.length > neutralTarget) {
      const add = Math.min(remaining, neutralPool.length - neutralTarget);
      neutralTarget += add;
      remaining -= add;
    }
    if (remaining > 0 && foreignPool.length > foreignTarget) {
      const add = Math.min(remaining, foreignPool.length - foreignTarget);
      foreignTarget += add;
      remaining -= add;
    }
  }

  // ── Step 5: Weighted random selection within each bucket ────────────────
  const preferredArchetypes = INDUSTRY_PREFERRED_ARCHETYPES[systemType] || null;

  const computeWeight = (ship) => {
    let weight = RARITY_WEIGHT[ship.tier] || 1;

    // Industry preference boost
    if (preferredArchetypes && preferredArchetypes.includes(ship.archetype)) {
      weight *= 2;
    }

    // Regional preference boost
    if (
      Array.isArray(ship.preferredSystemTypes) &&
      ship.preferredSystemTypes.includes(systemType)
    ) {
      weight *= 2;
    }

    return weight;
  };

  const pickWeightedSample = (pool, count) => {
    if (count <= 0 || pool.length === 0) return [];
    if (pool.length <= count) return [...pool];

    const items = pool.map((ship) => ({ ship, weight: computeWeight(ship) }));
    const selected = [];

    for (let i = 0; i < count && items.length > 0; i++) {
      const totalWeight = items.reduce((sum, it) => sum + it.weight, 0);
      let roll = rng() * totalWeight;
      let chosenIdx = 0;
      for (let j = 0; j < items.length; j++) {
        roll -= items[j].weight;
        if (roll <= 0) {
          chosenIdx = j;
          break;
        }
      }
      selected.push(items[chosenIdx].ship);
      items.splice(chosenIdx, 1);
    }

    return selected;
  };

  const available = [
    ...pickWeightedSample(primaryPool, primaryTarget),
    ...pickWeightedSample(neutralPool, neutralTarget),
    ...pickWeightedSample(foreignPool, foreignTarget),
  ];

  // Final hard cap (safety net)
  return { metadata, available: available.slice(0, ABSOLUTE_MAX_SHIPS) };
};

// ─── CONVENIENCE WRAPPER ────────────────────────────────────────────────────

/**
 * Look up a system by ID and return its available ships.
 * @param {string} systemId
 * @param {Map<string, object>} systemById - Map from world.js
 * @returns {{ metadata: object, available: object[] } | null}
 */
const getShipsForSystemId = (systemId, systemById) => {
  const system = systemById.get(systemId);
  if (!system) {
    return null;
  }
  return getShipsForSystem(system);
};

module.exports = {
  deriveSystemMetadata,
  getAllowedFactions,
  getShipsForSystem,
  getShipsForSystemId,
};
